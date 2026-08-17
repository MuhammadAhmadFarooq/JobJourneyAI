import express, { type Express } from "express";
import fs from "fs";
import path from "path";

export function serveStatic(app: Express) {
  const possiblePaths = [
    path.resolve(__dirname, "public"),
    path.resolve(process.cwd(), "dist", "public"),
    path.resolve(process.cwd(), "public"),
  ];

  const distPath = possiblePaths.find((p) => fs.existsSync(p));

  if (!distPath) {
    throw new Error(
      `Could not find the client build directory in any of: ${possiblePaths.join(", ")}. Make sure to run 'npm run build' first.`,
    );
  }

  app.use(express.static(distPath));

  // Fallback to index.html for client-side routing
  app.use("*", (_req, res) => {
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}
