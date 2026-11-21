/**
 * routes/healthRoute.js
 * ----------------------
 * API Health-Check Endpoint.
 *
 * [Gujarati સમજણ]
 * આ route backend server ચાલે છે કે નહિ
 * તે verify કરવા માટે છે.
 *
 * GET /api/health
 *   → Server status, timestamp, database connection status
 *      અને Node.js version return કરે છે.
 *
 * Postman અથવા browser માં test કરી શકાય છે.
 */

const express = require("express");
const mongoose = require("mongoose");

const router = express.Router();

// ─── GET /api/health ─────────────────────────────────────────────────────────
router.get("/", (req, res) => {
  // Mongoose connection states: 0=disconnected, 1=connected, 2=connecting, 3=disconnecting
  const dbState = mongoose.connection.readyState;
  const dbStatus =
    dbState === 1
      ? "connected"
      : dbState === 2
      ? "connecting"
      : "disconnected";

  res.status(200).json({
    success: true,
    message: "Dental Care API is running",
    data: {
      status: "OK",
      environment: process.env.NODE_ENV || "development",
      timestamp: new Date().toISOString(),
      database: dbStatus,
      nodeVersion: process.version,
      uptime: `${Math.floor(process.uptime())}s`,
    },
  });
});

module.exports = router;
