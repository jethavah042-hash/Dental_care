/**
 * models/Patient.js
 * ------------------
 * Mongoose Patient Schema — clinical patient record.
 *
 * [Gujarati સમજણ]
 * Patient.js clinic ના patient records store કરવાનો model છે.
 * User.js authentication (login/password) handle કરે છે,
 * Patient.js clinical + contact information handle કરે છે.
 *
 * Key Design Decisions:
 *  - userId: optional — patient may or may not have a login account
 *    (Receptionist-registered patients may not have online accounts)
 *  - patientId: auto-generated unique ID format DENT-PAT-000001
 *  - Duplicate patient guard: same fullName + phone + dateOfBirth
 *  - Medical fields: optional, can be updated by authorized roles
 *  - createdBy: stores the admin/receptionist who registered the patient
 *  - Soft delete: isActive flag (never hard-delete medical records)
 */

const mongoose = require("mongoose");
const { Schema } = mongoose;

// ─── Counter Helper — Auto-incrementing Patient ID ────────────────────────────
// Uses a separate "counters" collection to safely generate sequential IDs
// even under concurrent requests.
const counterSchema = new Schema({
  _id:    { type: String, required: true },
  seq:    { type: Number, default: 0 },
});
const Counter = mongoose.model("Counter", counterSchema);

/**
 * Generates the next unique Patient ID.
 * Format: DENT-PAT-000001, DENT-PAT-000002, ...
 * Uses atomic findOneAndUpdate to prevent race conditions.
 */
const generatePatientId = async () => {
  const counter = await Counter.findOneAndUpdate(
    { _id: "patientId" },
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );
  const paddedSeq = String(counter.seq).padStart(6, "0");
  return `DENT-PAT-${paddedSeq}`;
};

// ─── Patient Schema ───────────────────────────────────────────────────────────
const patientSchema = new Schema(
  {
    // ── Link to User account (optional) ───────────────────────────────────────
    // Set if patient registered online (Phase 2 auth registration)
    // null if registered directly by receptionist/admin
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    // ── Unique Auto-generated Patient ID ──────────────────────────────────────
    patientId: {
      type: String,
      unique: true,
      trim: true,
      // Value set in pre-validate hook below — do NOT set manually
    },

    // ── Core Identity ─────────────────────────────────────────────────────────
    fullName: {
      type: String,
      required: [true, "Full name is required"],
      trim: true,
      minlength: [2, "Full name must be at least 2 characters"],
      maxlength: [100, "Full name cannot exceed 100 characters"],
    },

    email: {
      type: String,
      lowercase: true,
      trim: true,
      default: null,
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

    // ── Personal Details ──────────────────────────────────────────────────────
    dateOfBirth: {
      type: Date,
      default: null,
    },

    gender: {
      type: String,
      enum: {
        values: ["male", "female", "other", "prefer_not_to_say"],
        message: "Gender must be: male, female, other, or prefer_not_to_say",
      },
      default: null,
    },

    bloodGroup: {
      type: String,
      enum: {
        values: ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-", null],
        message: "Invalid blood group",
      },
      default: null,
    },

    profileImage: {
      type: String,
      default: null,
    },

    // ── Address ───────────────────────────────────────────────────────────────
    address: {
      street:  { type: String, trim: true, default: null },
      city:    { type: String, trim: true, default: null },
      state:   { type: String, trim: true, default: null },
      pincode: {
        type: String,
        trim: true,
        default: null,
        match: [/^\d{6}$/, "Pincode must be a 6-digit number"],
      },
    },

    // ── Emergency Contact ─────────────────────────────────────────────────────
    emergencyContact: {
      name: {
        type: String,
        trim: true,
        default: null,
      },
      relationship: {
        type: String,
        trim: true,
        default: null,
      },
      phone: {
        type: String,
        trim: true,
        default: null,
        match: [
          /^[6-9]\d{9}$/,
          "Emergency contact phone must be a valid 10-digit Indian mobile number",
        ],
      },
    },

    // ── Medical Information ───────────────────────────────────────────────────
    // These are free-text fields — structured treatment data lives in Treatment model
    medicalHistory: {
      type: String,
      trim: true,
      default: null,
      maxlength: [2000, "Medical history cannot exceed 2000 characters"],
    },

    allergies: {
      type: String,
      trim: true,
      default: null,
      maxlength: [1000, "Allergies field cannot exceed 1000 characters"],
    },

    currentMedications: {
      type: String,
      trim: true,
      default: null,
      maxlength: [1000, "Current medications field cannot exceed 1000 characters"],
    },

    notes: {
      type: String,
      trim: true,
      default: null,
      maxlength: [2000, "Notes cannot exceed 2000 characters"],
    },

    // ── Administrative ────────────────────────────────────────────────────────
    registrationDate: {
      type: Date,
      default: Date.now,
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    // Who registered this patient (admin or receptionist userId)
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Creator user ID is required"],
    },
  },
  {
    timestamps: true,
  }
);

// ─── Indexes ──────────────────────────────────────────────────────────────────
patientSchema.index({ patientId: 1 });            // fast lookup by patientId
patientSchema.index({ phone: 1 });                // search by phone
patientSchema.index({ email: 1 });                // search by email
patientSchema.index({ isActive: 1 });             // filter active/inactive
patientSchema.index({ "address.city": 1 });       // filter by city
patientSchema.index({ registrationDate: -1 });    // sort newest first
patientSchema.index({                             // text search
  fullName: "text",
  email: "text",
  phone: "text",
  patientId: "text",
});

// ─── Pre-validate Hook: Auto-generate patientId ───────────────────────────────
// Runs before schema validation so patientId is set before the required check
patientSchema.pre("validate", async function (next) {
  if (!this.patientId) {
    try {
      this.patientId = await generatePatientId();
    } catch (err) {
      return next(err);
    }
  }
  next();
});

// ─── Export ───────────────────────────────────────────────────────────────────
const Patient = mongoose.model("Patient", patientSchema);

module.exports = Patient;
