/**
 * middleware/authMiddleware.js
 * ----------------------------
 * JWT Authentication & Role Authorization Middleware.
 *
 * [Gujarati સમજણ]
 * આ file બે important middleware functions provide કરે છે:
 *
 * 1. protect
 *    - Request header માંથી JWT token read કરે છે (Authorization: Bearer TOKEN)
 *    - Token verify કરે છે (signature + expiry)
 *    - Token valid હોય તો user DB માંથી fetch કરે, req.user set કરે
 *    - Token invalid/missing/expired હોય તો 401 return કરે
 *
 * 2. authorizeRoles(...roles)
 *    - protect middleware પછી use કરવાનું
 *    - req.user.role check કરે
 *    - Allowed roles માં ન હોય તો 403 Forbidden return કરે
 *    - Role check server-side user data use કરે — client input trust નહિ
 *
 * Usage:
 *   router.get("/me", protect, getMe);
 *   router.delete("/user/:id", protect, authorizeRoles("admin"), deleteUser);
 */

const jwt = require("jsonwebtoken");
const User = require("../models/User");

// ─── protect ─────────────────────────────────────────────────────────────────
/**
 * Verifies the Bearer JWT from Authorization header.
 * On success: attaches req.user (safe user object, no password).
 * On failure: returns 401 Unauthorized.
 */
const protect = async (req, res, next) => {
  try {
    let token;

    // Read token from Authorization header
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.split(" ")[1];
    }

    // No token provided
    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Access denied. No token provided. Please log in.",
      });
    }

    // Verify token signature and expiry
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (jwtError) {
      if (jwtError.name === "TokenExpiredError") {
        return res.status(401).json({
          success: false,
          message: "Session expired. Please log in again.",
        });
      }
      return res.status(401).json({
        success: false,
        message: "Invalid token. Please log in again.",
      });
    }

    // Fetch user from DB (do NOT use token data directly for user info)
    // password excluded via select:false on schema
    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User no longer exists.",
      });
    }

    // Check account is active
    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: "Your account has been deactivated. Please contact support.",
      });
    }

    // Attach authenticated user to request (available in next middleware/controller)
    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};

// ─── authorizeRoles ───────────────────────────────────────────────────────────
/**
 * Returns a middleware that restricts access to specified roles.
 * Must be used AFTER protect middleware.
 *
 * @param {...string} roles - allowed role names
 *
 * Example:
 *   router.get("/admin/users", protect, authorizeRoles("admin"), listUsers);
 *   router.get("/records", protect, authorizeRoles("admin","dentist"), getRecords);
 */
const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    // req.user.role is from DB (server-side) — not from client
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. This resource requires one of these roles: ${roles.join(", ")}.`,
      });
    }
    next();
  };
};

module.exports = { protect, authorizeRoles };
