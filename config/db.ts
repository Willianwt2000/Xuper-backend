import mongoose from 'mongoose';

export const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGO_URI;
    if (!mongoURI) {
      throw new Error("MONGO_URI is not defined in environment variables");
    }
    await mongoose.connect(mongoURI);
    console.log('✅ MongoDB connected successfully!!!');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};