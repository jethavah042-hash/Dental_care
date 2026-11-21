/**
 * routes/authRoute.js
 * --------------------
 * Authentication API Routes.
 *
 * [Gujarati સમજણ]
 * આ file authentication ના 5 routes define કરે છે:
 *
 *  POST  /api/auth/register        → patient registration (public)
 *  POST  /api/auth/login           → login, JWT token return (public)
 *  POST  /api/auth/logout          → logout signal (protected)
 *  GET   /api/auth/me              → current user profile (protected)
 *  PATCH /api/auth/change-password → change password (protected)
 *
 * Route pipeline:
 *  Validator → (protect middleware) → Controller
 *
 * Public routes: register, login (no token needed)
 * Protected routes: logout, me, change-password (valid JWT required)
 */

const express = require("express");
const router = express.Router();

// ─── Controllers ──────────────────────────────────────────────────────────────
const {
  register,
  login,
  logout,
  getMe,
  changePassword,
} = require("../controllers/authController");

// ─── Middleware ───────────────────────────────────────────────────────────────
const { protect } = require("../middleware/authMiddleware");

// ─── Validators ───────────────────────────────────────────────────────────────
const {
  registerValidator,
  loginValidator,
  changePasswordValidator,
} = require("../validators/authValidator");

// ─── Public Routes ────────────────────────────────────────────────────────────

// POST /api/auth/register — Patient registration
// Validators run first, then controller
router.post("/register", registerValidator, register);

// POST /api/auth/login — Authenticate and get JWT token
router.post("/login", loginValidator, login);

// ─── Protected Routes (require valid JWT) ─────────────────────────────────────

// POST /api/auth/logout — Signal client to clear token
router.post("/logout", protect, logout);

// GET /api/auth/me — Get current authenticated user's profile
router.get("/me", protect, getMe);

// PATCH /api/auth/change-password — Change authenticated user's password
router.patch("/change-password", protect, changePasswordValidator, changePassword);

module.exports = router;
