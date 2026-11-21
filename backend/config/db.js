/**
 * config/db.js
 * -------------
 * MongoDB Atlas connection using Mongoose.
 *
 * [Gujarati સમજણ]
 * આ file MongoDB Atlas સાથે connection બનાવે છે.
 * connectDB() function async છે — connection સફળ થાય
 * તો log print કરે છે, fail થાય તો process terminate કરે છે.
 * server.js માંથી આ function call કરવામાં આવે છે.
 */

const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI;

    if (!mongoURI) {
      throw new Error(
        "MONGODB_URI is not defined in environment variables. Please check your .env file."
      );
    }

    const conn = await mongoose.connect(mongoURI, {
      // Mongoose 7+ uses these by default; listed for clarity
      serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
    });

    console.log(
      `✅ MongoDB Connected: ${conn.connection.host} [DB: ${conn.connection.name}]`
    );
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    // Exit process with failure — server cannot run without DB
    process.exit(1);
  }
};

module.exports = connectDB;
