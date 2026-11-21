/**
 * middleware/errorMiddleware.js
 * ------------------------------
 * Global error handling middleware for Express.
 *
 * [Gujarati સમજણ]
 * આ file બે middleware functions define કરે છે:
 *
 * 1. notFound   → જ્યારે કોઈ route match ન થાય ત્યારે 404 error return કરે છે.
 * 2. errorHandler → app.js માં mount કરેલ global error handler.
 *    development mode માં full stack trace return કરે છે,
 *    production mode માં stack trace hide કરે છે (security).
 *
 * બધા errors consistent JSON format માં return થાય છે:
 * { success: false, message: "...", stack: "..." }
 */

// ─── 404 Not Found Handler ──────────────────────────────────────────────────
const notFound = (req, res, next) => {
  const error = new Error(`Route Not Found: ${req.method} ${req.originalUrl}`);
  res.status(404);
  next(error);
};

// ─── Global Error Handler ────────────────────────────────────────────────────
const errorHandler = (err, req, res, next) => {
  // Sometimes Express sets status 200 even on errors — fix it
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;

  res.status(statusCode).json({
    success: false,
    message: err.message || "Internal Server Error",
    // Show stack trace only in development — never in production
    stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
  });
};

module.exports = { notFound, errorHandler };
