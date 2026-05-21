import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;

export async function connectDB(): Promise<boolean> {
  if (!MONGODB_URI) {
    console.warn("⚠️  No MONGODB_URI provided; starting without a MongoDB connection.");
    return false;
  }

  try {
    await mongoose.connect(MONGODB_URI);
    console.log("✅ Connected to MongoDB");
    return true;
  } catch (error) {
    console.error("❌ MongoDB connection error:", error);
    console.warn("⚠️  Continuing without MongoDB; data-dependent features may be unavailable.");
    return false;
  }
}

// Handle connection events
mongoose.connection.on("disconnected", () => {
  console.log("MongoDB disconnected");
});

mongoose.connection.on("error", (err) => {
  console.error("MongoDB error:", err);
});

export default mongoose;
