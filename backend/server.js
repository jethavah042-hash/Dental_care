/**
 * server.js
 * ----------
 * Application Entry Point.
 * This is the first file Node.js executes: `node server.js` or `npm run dev`.
 *
 * [Gujarati સમજણ]
 * server.js એ backend નો starting point છે.
 * આ file:
 *  1. .env file load કરે છે (dotenv)
 *  2. MongoDB Atlas સાથે connect થાય છે (config/db.js)
 *  3. Express app import કરે છે (app.js)
 *  4. PORT પર HTTP server start કરે છે
 *  5. Uncaught errors handle કરે છે — server crash ન થાય
 *
 * Terminal command: npm run dev
 */

// Step 1: Load environment variables from .env BEFORE anything else
require("dotenv").config();

const app = require("./app");
const connectDB = require("./config/db");

// ─── Port Configuration ───────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
const NODE_ENV = process.env.NODE_ENV || "development";

// ─── Start Server ─────────────────────────────────────────────────────────────
const startServer = async () => {
  try {
    // Step 2: Connect to MongoDB Atlas first
    await connectDB();

    // Step 3: Start Express HTTP server
    const server = app.listen(PORT, () => {
      console.log("================================================");
      console.log("  🦷  Dental Care Backend Server");
      console.log("================================================");
      console.log(`  ✅  Status     : Running`);
      console.log(`  🌐  Environment: ${NODE_ENV}`);
      console.log(`  🚀  Port       : ${PORT}`);
      console.log(`  🔗  URL        : http://localhost:${PORT}`);
      console.log(`  ❤️   Health     : http://localhost:${PORT}/api/health`);
      console.log("================================================");
    });

    // ─── Graceful Shutdown ────────────────────────────────────────────────────
    // SIGTERM: process manager (e.g. PM2) server stop કરે ત્યારે
    process.on("SIGTERM", () => {
      console.log("⚠️  SIGTERM received. Shutting down gracefully...");
      server.close(() => {
        console.log("🔴 HTTP server closed.");
        process.exit(0);
      });
    });

    // ─── Unhandled Promise Rejections ─────────────────────────────────────────
    // async code માં unhandled rejection server crash ન કરે
    process.on("unhandledRejection", (reason, promise) => {
      console.error("❌ Unhandled Rejection at:", promise, "reason:", reason);
      server.close(() => {
        process.exit(1);
      });
    });

    // ─── Uncaught Exceptions ──────────────────────────────────────────────────
    process.on("uncaughtException", (err) => {
      console.error("❌ Uncaught Exception:", err.message);
      process.exit(1);
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error.message);
    process.exit(1);
  }
};

// ─── Boot ─────────────────────────────────────────────────────────────────────
startServer();
