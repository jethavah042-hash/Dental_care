/**
 * services/authService.js
 * ------------------------
 * Authentication Business Logic Layer.
 *
 * [Gujarati સમજણ]
 * Service layer controller અને database ની વચ્ચે business logic handle કરે છે.
 * Controller ફક્ત HTTP (request/response) handle કરે,
 * actual work (DB queries, validations, password check) service layer કરે.
 *
 * આ approach (Separation of Concerns) code reusable અને testable બનાવે છે.
 *
 * Functions:
 *  - registerUser()     → new patient account create
 *  - loginUser()        → credentials verify, lastLogin update
 *  - getProfile()       → authenticated user profile DB from fetch
 *  - changePassword()   → password verify, update, save
 */

const User = require("../models/User");

// ─── Register User ────────────────────────────────────────────────────────────
/**
 * Creates a new Patient user account.
 * Role is ALWAYS set to "patient" regardless of client input.
 *
 * @param {Object} data - { fullName, email, phone, password }
 * @returns {Object}    - { user: safeUserObject }
 * @throws  {Error}     - with statusCode property for controller
 */
const registerUser = async ({ fullName, email, phone, password }) => {
  // Normalize email (lowercase) for consistent DB lookup
  const normalizedEmail = email.trim().toLowerCase();

  // Check for duplicate email — before attempting to create
  const existingUser = await User.findOne({ email: normalizedEmail });
  if (existingUser) {
    const error = new Error(
      "An account with this email already exists. Please use a different email or log in."
    );
    error.statusCode = 409; // Conflict
    throw error;
  }

  // Create user — password hashed by pre-save hook in User model
  // Role is hardcoded to "patient" — NEVER read from client input
  const user = await User.create({
    fullName: fullName.trim(),
    email: normalizedEmail,
    phone: phone.trim(),
    password,           // raw — model pre-save hook hashes it
    role: "patient",    // server-enforced; never accept from client
  });

  return { user: user.toSafeObject() };
};

// ─── Login User ───────────────────────────────────────────────────────────────
/**
 * Validates credentials and returns authenticated user.
 * Uses vague error message to prevent email enumeration attacks.
 *
 * @param {string} email
 * @param {string} password
 * @returns {Object} - { user: safeUserObject }
 * @throws  {Error}  - with statusCode
 */
const loginUser = async (email, password) => {
  const normalizedEmail = email.trim().toLowerCase();

  // Fetch user WITH password (select:false overridden here for comparison)
  const user = await User.findOne({ email: normalizedEmail }).select("+password");

  // Vague error: do not reveal whether email or password was wrong
  const invalidCredentialsError = new Error("Invalid email or password.");
  invalidCredentialsError.statusCode = 401;

  if (!user) throw invalidCredentialsError;

  // Verify password with bcrypt
  const isPasswordMatch = await user.matchPassword(password);
  if (!isPasswordMatch) throw invalidCredentialsError;

  // Check account is active
  if (!user.isActive) {
    const error = new Error(
      "Your account has been deactivated. Please contact support."
    );
    error.statusCode = 403;
    throw error;
  }

  // Update lastLogin timestamp
  user.lastLogin = new Date();
  await user.save({ validateBeforeSave: false });

  return { user: user.toSafeObject() };
};

// ─── Get Profile ──────────────────────────────────────────────────────────────
/**
 * Returns the authenticated user's profile from DB.
 * Uses user ID from verified JWT (req.user._id).
 *
 * @param {string} userId - Mongoose ObjectId string
 * @returns {Object}      - { user: safeUserObject }
 * @throws  {Error}       - with statusCode
 */
const getProfile = async (userId) => {
  const user = await User.findById(userId).select("-password");

  if (!user) {
    const error = new Error("User not found.");
    error.statusCode = 404;
    throw error;
  }

  if (!user.isActive) {
    const error = new Error("Account is deactivated. Please contact support.");
    error.statusCode = 403;
    throw error;
  }

  return { user: user.toSafeObject() };
};

// ─── Change Password ──────────────────────────────────────────────────────────
/**
 * Verifies current password and updates to new password.
 *
 * @param {string} userId          - from req.user._id
 * @param {string} currentPassword - must match stored hash
 * @param {string} newPassword     - new plain text password
 * @returns {Object}               - { message: "..." }
 * @throws  {Error}                - with statusCode
 */
const changePassword = async (userId, currentPassword, newPassword) => {
  // Fetch user with password field
  const user = await User.findById(userId).select("+password");

  if (!user) {
    const error = new Error("User not found.");
    error.statusCode = 404;
    throw error;
  }

  // Verify current password
  const isMatch = await user.matchPassword(currentPassword);
  if (!isMatch) {
    const error = new Error("Current password is incorrect.");
    error.statusCode = 400;
    throw error;
  }

  // Prevent setting the same password
  const isSamePassword = await user.matchPassword(newPassword);
  if (isSamePassword) {
    const error = new Error(
      "New password must be different from your current password."
    );
    error.statusCode = 400;
    throw error;
  }

  // Assign new password — pre-save hook will hash it
  user.password = newPassword;
  await user.save();

  return { message: "Password changed successfully." };
};

module.exports = {
  registerUser,
  loginUser,
  getProfile,
  changePassword,
};
