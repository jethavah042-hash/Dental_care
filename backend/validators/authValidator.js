/**
 * validators/authValidator.js
 * ----------------------------
 * express-validator rule chains for Authentication APIs.
 *
 * [Gujarati સમજણ]
 * આ file express-validator package use કરીને
 * request body ના inputs validate કરે છે.
 *
 * Validators:
 *  - registerValidator  → registration API ના inputs
 *  - loginValidator     → login API ના inputs
 *  - changePasswordValidator → change password API ના inputs
 *  - handleValidationErrors  → errors collect કરીને 400 response return
 *
 * Client invalid data મોકલે ત્યારે controller સુધી request જ ન પહોંચે.
 */

const { body, validationResult } = require("express-validator");

// ─── Middleware: Collect & Return Validation Errors ──────────────────────────
/**
 * Run after any validator array.
 * Collects express-validator errors and returns 400 with readable messages.
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const messages = errors.array().map((err) => err.msg);
    return res.status(400).json({
      success: false,
      message: messages[0], // show first error clearly
      errors: messages,     // all errors for detailed frontend display
    });
  }
  next();
};

// ─── Register Validator ───────────────────────────────────────────────────────
const registerValidator = [
  body("fullName")
    .trim()
    .notEmpty().withMessage("Full name is required")
    .isLength({ min: 2 }).withMessage("Full name must be at least 2 characters")
    .isLength({ max: 100 }).withMessage("Full name cannot exceed 100 characters")
    .matches(/^[a-zA-Z\s]+$/).withMessage("Full name can only contain letters and spaces"),

  body("email")
    .trim()
    .notEmpty().withMessage("Email is required")
    .isEmail().withMessage("Please provide a valid email address")
    .normalizeEmail({ gmail_remove_dots: false }), // lowercase + trim

  body("phone")
    .trim()
    .notEmpty().withMessage("Phone number is required")
    .matches(/^[6-9]\d{9}$/).withMessage(
      "Phone must be a valid 10-digit Indian mobile number starting with 6-9"
    ),

  body("password")
    .notEmpty().withMessage("Password is required")
    .isLength({ min: 8 }).withMessage("Password must be at least 8 characters")
    .matches(/[A-Z]/).withMessage("Password must contain at least one uppercase letter")
    .matches(/[a-z]/).withMessage("Password must contain at least one lowercase letter")
    .matches(/\d/).withMessage("Password must contain at least one number"),

  // Security: silently strip 'role' even if sent — role is set server-side
  // (validation does NOT check role; controller ignores client role)

  handleValidationErrors,
];

// ─── Login Validator ──────────────────────────────────────────────────────────
const loginValidator = [
  body("email")
    .trim()
    .notEmpty().withMessage("Email is required")
    .isEmail().withMessage("Please provide a valid email address")
    .normalizeEmail({ gmail_remove_dots: false }),

  body("password")
    .notEmpty().withMessage("Password is required")
    .isLength({ min: 1 }).withMessage("Password cannot be empty"),

  handleValidationErrors,
];

// ─── Change Password Validator ────────────────────────────────────────────────
const changePasswordValidator = [
  body("currentPassword")
    .notEmpty().withMessage("Current password is required"),

  body("newPassword")
    .notEmpty().withMessage("New password is required")
    .isLength({ min: 8 }).withMessage("New password must be at least 8 characters")
    .matches(/[A-Z]/).withMessage("New password must contain at least one uppercase letter")
    .matches(/[a-z]/).withMessage("New password must contain at least one lowercase letter")
    .matches(/\d/).withMessage("New password must contain at least one number"),

  handleValidationErrors,
];

module.exports = {
  registerValidator,
  loginValidator,
  changePasswordValidator,
  handleValidationErrors,
};
