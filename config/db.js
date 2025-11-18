const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error("MONGO_URI is not set in environment variables. Please set it in your .env file");
    }
    
    const mongoUri = process.env.MONGO_URI;
    await mongoose.connect(mongoUri);
    console.log("MongoDB connected successfully");
  } catch (err) {
    console.error("MongoDB connection error:", err);
    console.log("Please make sure MongoDB is running and MONGO_URI is set in .env file");
    console.log("You can use MongoDB Atlas or install MongoDB locally");
    process.exit(1);
  }
};

module.exports = connectDB;
