const mongoose = require("mongoose");

/**
 * Opens the MongoDB connection.
 * Kept separate from server.js so it can be reused by tests/scripts
 * without booting the whole HTTP server.
 */
async function connectDB() {
  const uri = process.env.MONGO_URI;

  if (!uri) {
    throw new Error("MONGO_URI is not set. Copy .env.example to .env and fill it in.");
  }

  mongoose.set("strictQuery", true);

  await mongoose.connect(uri);

  mongoose.connection.on("disconnected", () => {
    console.warn("⚠️  MongoDB disconnected");
  });

  mongoose.connection.on("error", (err) => {
    console.error("❌ MongoDB error:", err.message);
  });

  return mongoose.connection;
}

module.exports = connectDB;
