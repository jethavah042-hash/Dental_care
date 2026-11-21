/**
 * app.js
 * -------
 * Express application configuration.
 * This file sets up ALL middleware and routes.
 * server.js imports this and starts the HTTP server.
 *
 * [Gujarati સમજણ]
 * app.js Express application ને configure કરે છે.
 * અહીં:
 *  - Security headers (helmet) set થાય છે
 *  - CORS configure થાય છે (React frontend ને allow કરવા)
 *  - JSON request body parse થાય છે
 *  - Rate limiting apply થાય છે (DDoS protection)
 *  - Cookie parser configure થાય છે
 *  - API routes mount થાય છે
 *  - 404 અને global error handler mount થાય છે
 *
 * server.js આ file import કરીને HTTP server start કરે છે.
 */

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const cookieParser = require("cookie-parser");
const rateLimit = require("express-rate-limit");

// ─── Route Imports ────────────────────────────────────────────────────────────
const healthRoute = require("./routes/healthRoute");
const authRoute   = require("./routes/authRoute");

// ─── Middleware Imports ───────────────────────────────────────────────────────
const { notFound, errorHandler } = require("./middleware/errorMiddleware");

// ─── Initialize Express App ───────────────────────────────────────────────────
const app = express();

// ─── Security Middleware ──────────────────────────────────────────────────────
// helmet: HTTP response headers ને secure બનાવે છે (XSS, clickjacking, etc.)
app.use(helmet());

// ─── CORS Configuration ───────────────────────────────────────────────────────
// CLIENT_URL = React frontend origin (default: http://localhost:5173)
const corsOptions = {
  origin: process.env.CLIENT_URL || "http://localhost:5173",
  credentials: true, // Allow cookies / Authorization headers
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};
app.use(cors(corsOptions));

// ─── Body Parsers ─────────────────────────────────────────────────────────────
// JSON body parse કરવા (e.g. POST /api/auth/login)
app.use(express.json({ limit: "10mb" }));
// URL-encoded form data parse કરવા
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// ─── Cookie Parser ────────────────────────────────────────────────────────────
// Cookie-based JWT tokens read કરવા (future auth module)
app.use(cookieParser());

// ─── Global API Rate Limiter ──────────────────────────────────────────────────
// 15 minutes ની window માં max 100 requests allow
// DDoS અને brute-force attacks સામે protection
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many requests. Please try again after 15 minutes.",
  },
});
app.use("/api", apiLimiter);

// ─── API Routes ───────────────────────────────────────────────────────────────
// Health check: GET /api/health
app.use("/api/health", healthRoute);

// Phase 2: Authentication & User Account
app.use("/api/auth", authRoute);

// Future routes will be added here (Phase 3 onwards):
// app.use("/api/users", userRoute);
// app.use("/api/patients", patientRoute);
// app.use("/api/dentists", dentistRoute);
// app.use("/api/appointments", appointmentRoute);
// ... and more

// ─── Root Endpoint ────────────────────────────────────────────────────────────
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Welcome to Dental Care API",
    version: "1.0.0",
    docs: "Use /api/health to check server status",
  });
});

// ─── Error Handling Middleware (Must be LAST) ─────────────────────────────────
// 404 handler: matched route ન મળ્યો
app.use(notFound);
// Global error handler
app.use(errorHandler);

module.exports = app;
