const mongoose = require("mongoose");

async function connectDB() {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    throw new Error("MONGO_URI missing in .env");
  }
  await mongoose.connect(uri, {
    autoIndex: true,
    serverSelectionTimeoutMS: 8000,
  });
  console.log(`  ✓ MongoDB connected: ${mongoose.connection.host}`);
}

module.exports = connectDB;
