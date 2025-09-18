const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || "mongodb+srv://bdc01:Ewo0aeThzbCCHQ7W@bdc02.gb2bzap.mongodb.net/vihara_bdc_db";
    
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
