import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

export const connectDB = async (): Promise<void> => {

  if (mongoose.connection.readyState >= 1) {
    console.log("✅ MongoDB ya está conectado (hot start).");
    return;
  }

  try {
    const mongoURI = process.env.MONGO_URI;
    if (!mongoURI) {
      throw new Error("MONGO_URI is not defined in environment variables");
    }
    await mongoose.connect(mongoURI);
    console.log("✅ MongoDB conectado exitosamente!!!");
  } catch (error) {
    console.error("MongoDB connection error:", error);
    process.exit(1);
  }
};