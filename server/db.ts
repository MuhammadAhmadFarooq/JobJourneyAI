import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;

let isConnected = false;

export function getIsConnected() {
  return isConnected && mongoose.connection.readyState === 1;
}

export async function connectDB(): Promise<boolean> {
  if (!MONGODB_URI) {
    console.warn("⚠️  No MONGODB_URI provided; starting without a MongoDB connection.");
    return false;
  }

  try {
    // Set mongoose-level options for connection resilience
    mongoose.set("bufferCommands", false);

    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 60000,
      family: 4,
      maxPoolSize: 10,
      minPoolSize: 2,
      connectTimeoutMS: 30000,
      heartbeatFrequencyMS: 10000,
      retryWrites: true,
      retryReads: true,
    });

    // Verify the connection is actually usable by running a ping
    await mongoose.connection.db!.admin().ping();

    isConnected = true;
    console.log("✅ Connected to MongoDB");
    return true;
  } catch (error: any) {
    console.error("❌ MongoDB connection error:", error?.message || error);
    console.warn("⚠️  Continuing without MongoDB; data-dependent features may be unavailable.");
    isConnected = false;
    return false;
  }
}

// Handle connection events
mongoose.connection.on("connected", () => {
  isConnected = true;
  console.log("MongoDB connected");
});

mongoose.connection.on("disconnected", () => {
  isConnected = false;
  console.log("MongoDB disconnected");
});

mongoose.connection.on("error", (err) => {
  console.error("MongoDB connection error:", err?.message || err);
  isConnected = false;
});

mongoose.connection.on("reconnected", () => {
  isConnected = true;
  console.log("MongoDB reconnected");
});

// Prevent unhandled promise rejections from crashing the app
// (MongoStore and other MongoDB operations can throw these on connection drops)
process.on("unhandledRejection", (reason: any) => {
  const message = reason?.message || String(reason);
  // Only log MongoDB-related unhandled rejections as warnings instead of crashing
  if (
    message.includes("Mongo") ||
    message.includes("Pool") ||
    message.includes("topology") ||
    message.includes("ECONNREFUSED") ||
    message.includes("ENOTFOUND") ||
    message.includes("Server selection")
  ) {
    console.warn("⚠️  MongoDB unhandled rejection (non-fatal):", message);
  } else {
    console.error("Unhandled rejection:", reason);
  }
});

// Graceful shutdown
async function gracefulShutdown(signal: string) {
  console.log(`\n${signal} received. Closing MongoDB connection...`);
  try {
    await mongoose.connection.close();
    console.log("MongoDB connection closed.");
  } catch (err) {
    console.error("Error closing MongoDB connection:", err);
  }
  process.exit(0);
}

process.on("SIGINT", () => gracefulShutdown("SIGINT"));
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));

export default mongoose;
