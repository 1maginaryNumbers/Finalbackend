const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
    
    if (!mongoUri) {
      throw new Error("MONGODB_URI or MONGO_URI is not set in environment variables. Please set it in your .env file or Vercel environment variables");
    }
    
    await mongoose.connect(mongoUri);
    console.log("MongoDB connected successfully");
  } catch (err) {
    console.error("MongoDB connection error:", err);
    console.log("Please make sure MongoDB is running and MONGODB_URI or MONGO_URI is set in environment variables");
    console.log("You can use MongoDB Atlas or install MongoDB locally");
    process.exit(1);
  }
};

module.exports = connectDB;
