/**
 * models/User.js
 * ---------------
 * Mongoose User Schema — the central identity model for all roles.
 *
 * [Gujarati સમજણ]
 * User.js એ database નો main model છે.
 * clinic ના ચારેય roles — admin, dentist, receptionist, patient —
 * આ એક schema માં store થાય છે.
 *
 * મુખ્ય features:
 *  - email unique અને lowercase normalize
 *  - password bcryptjs વડે hash (plain text ક્યારેય store નહિ)
 *  - pre-save hook: password change થાય ત્યારે auto-hash
 *  - matchPassword(): login verification
 *  - toSafeObject(): API response માં password ક્યારેય return નહિ
 *  - Public registration: role હંમેશા "patient" — client input ignored
 */

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

// ─── User Schema ─────────────────────────────────────────────────────────────
const userSchema = new mongoose.Schema(
  {
    // ── Identity ──────────────────────────────────────────────────────────────
    fullName: {
      type: String,
      required: [true, "Full name is required"],
      trim: true,
      minlength: [2, "Full name must be at least 2 characters"],
      maxlength: [100, "Full name cannot exceed 100 characters"],
    },

    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,  // normalize: always store as lowercase
      trim: true,
      match: [
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        "Please provide a valid email address",
      ],
    },

    phone: {
      type: String,
      required: [true, "Phone number is required"],
      trim: true,
      match: [
        /^[6-9]\d{9}$/,
        "Please provide a valid 10-digit Indian mobile number",
      ],
    },

    // ── Authentication ────────────────────────────────────────────────────────
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [8, "Password must be at least 8 characters"],
      select: false, // NEVER returned in queries by default
    },

    // ── Role ──────────────────────────────────────────────────────────────────
    // Public registration sets this to "patient" on the server.
    // Admin/dentist/receptionist accounts created via admin processes only.
    role: {
      type: String,
      enum: {
        values: ["admin", "dentist", "receptionist", "patient"],
        message: "Role must be one of: admin, dentist, receptionist, patient",
      },
      default: "patient",
    },

    // ── Profile ───────────────────────────────────────────────────────────────
    profileImage: {
      type: String,
      default: null,
    },

    gender: {
      type: String,
      enum: {
        values: ["male", "female", "other", "prefer_not_to_say"],
        message: "Gender must be male, female, other, or prefer_not_to_say",
      },
      default: null,
    },

    dateOfBirth: {
      type: Date,
      default: null,
    },

    address: {
      street: { type: String, trim: true, default: null },
      city:   { type: String, trim: true, default: null },
      state:  { type: String, trim: true, default: null },
      pincode:{ type: String, trim: true, default: null },
    },

    // ── Account Status ────────────────────────────────────────────────────────
    isActive: {
      type: Boolean,
      default: true,
    },

    isEmailVerified: {
      type: Boolean,
      default: false,
    },

    // ── Activity Tracking ─────────────────────────────────────────────────────
    lastLogin: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true, // adds createdAt and updatedAt automatically
  }
);

// ─── Indexes ──────────────────────────────────────────────────────────────────
// email already has unique:true (creates index automatically)
// role index: fast filtering of users by role
userSchema.index({ role: 1 });
userSchema.index({ isActive: 1 });

// ─── Pre-save Hook: Password Hashing ─────────────────────────────────────────
// Password ત્યારે જ hash થાય જ્યારે modify થઈ હોય
// (profile update વખતે unnecessary re-hash ટાળવા)
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  try {
    const saltRounds = 12; // higher = more secure but slower
    this.password = await bcrypt.hash(this.password, saltRounds);
    next();
  } catch (error) {
    next(error);
  }
});

// ─── Instance Method: Password Comparison ────────────────────────────────────
// Login verification: plaintext password vs stored hash
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// ─── Instance Method: Safe Response Object ────────────────────────────────────
// API response માં password hash ક્યારેય return ન કરવો
userSchema.methods.toSafeObject = function () {
  return {
    id: this._id,
    fullName: this.fullName,
    email: this.email,
    phone: this.phone,
    role: this.role,
    profileImage: this.profileImage,
    gender: this.gender,
    dateOfBirth: this.dateOfBirth,
    address: this.address,
    isActive: this.isActive,
    isEmailVerified: this.isEmailVerified,
    lastLogin: this.lastLogin,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  };
};

// ─── Export Model ─────────────────────────────────────────────────────────────
const User = mongoose.model("User", userSchema);

module.exports = User;
