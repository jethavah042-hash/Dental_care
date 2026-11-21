/**
 * controllers/authController.js
 * ------------------------------
 * Authentication HTTP Controllers (thin layer).
 *
 * [Gujarati સમજણ]
 * Controller HTTP request receive કરે છે,
 * service layer ને call કરે છે, અને HTTP response format કરે છે.
 * Controller business logic ન કરે — service layer delegate કરે.
 *
 * Controllers:
 *  - register       → POST /api/auth/register
 *  - login          → POST /api/auth/login
 *  - logout         → POST /api/auth/logout
 *  - getMe          → GET  /api/auth/me (protected)
 *  - changePassword → PATCH /api/auth/change-password (protected)
 */

const authService = require("../services/authService");
const generateToken = require("../utils/generateToken");

// ─── Register ─────────────────────────────────────────────────────────────────
/**
 * POST /api/auth/register
 * Public. Creates a new patient account.
 * Role is ALWAYS patient — even if client sends a different role, it is ignored.
 */
const register = async (req, res, next) => {
  try {
    const { fullName, email, phone, password } = req.body;
    // Note: req.body.role is intentionally NOT read here

    const { user } = await authService.registerUser({
      fullName,
      email,
      phone,
      password,
    });

    res.status(201).json({
      success: true,
      message: "Registration successful. Welcome to Dental Care!",
      data: { user },
    });
  } catch (error) {
    // Set HTTP status from service-thrown error if available
    if (error.statusCode) res.status(error.statusCode);
    next(error);
  }
};

// ─── Login ────────────────────────────────────────────────────────────────────
/**
 * POST /api/auth/login
 * Public. Authenticates user and returns JWT token.
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const { user } = await authService.loginUser(email, password);

    // Generate JWT with user ID and role
    const token = generateToken({ id: user.id, role: user.role });

    res.status(200).json({
      success: true,
      message: "Login successful.",
      data: {
        token,
        user,
      },
    });
  } catch (error) {
    if (error.statusCode) res.status(error.statusCode);
    next(error);
  }
};

// ─── Logout ───────────────────────────────────────────────────────────────────
/**
 * POST /api/auth/logout
 * Protected. Stateless JWT logout.
 *
 * JWT is stateless — the server does NOT store or invalidate tokens.
 * The frontend must delete the token from its storage (localStorage/cookie).
 * This endpoint signals the client to clear its auth state.
 *
 * Future enhancement: implement token blacklisting with Redis for
 * true server-side token invalidation.
 */
const logout = async (req, res, next) => {
  try {
    res.status(200).json({
      success: true,
      message:
        "Logged out successfully. Please remove the token from your client storage.",
    });
  } catch (error) {
    next(error);
  }
};

// ─── Get Authenticated User Profile ──────────────────────────────────────────
/**
 * GET /api/auth/me
 * Protected. Returns the current authenticated user's profile.
 * User ID comes from req.user (set by protect middleware — not from client).
 */
const getMe = async (req, res, next) => {
  try {
    const { user } = await authService.getProfile(req.user._id);

    res.status(200).json({
      success: true,
      message: "Profile fetched successfully.",
      data: { user },
    });
  } catch (error) {
    if (error.statusCode) res.status(error.statusCode);
    next(error);
  }
};

// ─── Change Password ──────────────────────────────────────────────────────────
/**
 * PATCH /api/auth/change-password
 * Protected. Validates current password and updates to new password.
 */
const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const result = await authService.changePassword(
      req.user._id,
      currentPassword,
      newPassword
    );

    res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    if (error.statusCode) res.status(error.statusCode);
    next(error);
  }
};

module.exports = {
  register,
  login,
  logout,
  getMe,
  changePassword,
};
