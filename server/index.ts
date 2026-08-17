import "dotenv/config";
import express, { type Request, Response, NextFunction } from "express";
import session from "express-session";
import MongoStore from "connect-mongo";
import MemoryStoreFactory from "memorystore";
import { registerRoutes } from "./routes";
import { serveStatic } from "./static";
import { createServer } from "node:http";
import { connectDB } from "./db";
import mongoose from "mongoose";
import authRoutes from "./routes/auth";
import profileRoutes from "./routes/profile";

const app = express();
const httpServer = createServer(app);
const MemoryStore = MemoryStoreFactory(session);

declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

app.use(
  express.json({
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  }),
);

app.use(express.urlencoded({ extended: false }));

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      log(logLine);
    }
  });

  next();
});

async function startup() {
  try {
    const dbConnected = await connectDB();

    // Create session store with fallback
    let sessionStore: session.Store;
    if (dbConnected && process.env.MONGODB_URI) {
      try {
        sessionStore = MongoStore.create({
          client: mongoose.connection.getClient() as any,
          ttl: 7 * 24 * 60 * 60,
          autoRemove: "native",
          touchAfter: 24 * 3600, // Only update session once per 24h to reduce DB writes
        });
        console.log("✅ Session store: MongoDB");
      } catch (storeErr: any) {
        console.warn("⚠️ Failed to create MongoStore, falling back to MemoryStore:", storeErr?.message);
        sessionStore = new MemoryStore({ checkPeriod: 24 * 60 * 60 * 1000 });
        console.log("✅ Session store: MemoryStore (fallback)");
      }
    } else {
      sessionStore = new MemoryStore({ checkPeriod: 24 * 60 * 60 * 1000 });
      console.log("✅ Session store: MemoryStore");
    }

    // Attach error handler (non-fatal — just log warnings)
    if (typeof sessionStore.on === "function") {
      sessionStore.on("error", (err: any) => {
        console.warn("⚠️ Session store warning:", err?.message || err);
      });
    }

    app.use(
      session({
        secret: process.env.SESSION_SECRET || "jobjourney-secret-key",
        resave: false,
        saveUninitialized: false,
        store: sessionStore,
        cookie: {
          secure: process.env.NODE_ENV === "production",
          httpOnly: true,
          maxAge: 7 * 24 * 60 * 60 * 1000,
          sameSite: "lax",
        },
      })
    );
    console.log("✅ Session middleware configured");

    app.use("/api/auth", authRoutes);
    app.use("/api/profile", profileRoutes);

    await registerRoutes(httpServer, app);
    console.log("✅ Routes registered");

    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";
      console.error(`[Error] ${status}: ${message}`);
      res.status(status).json({ message });
    });

    if (process.env.NODE_ENV === "production") {
      serveStatic(app);
    } else {
      const { setupVite } = await import("./vite");
      await setupVite(httpServer, app);
    }

    const port = Number.parseInt(process.env.PORT || "5000", 10);
    httpServer.listen(port, () => {
      log(`serving on port ${port}`);
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
}

// eslint-disable-next-line @typescript-eslint/prefer-top-level-await
(async () => {
  await startup();
})();
