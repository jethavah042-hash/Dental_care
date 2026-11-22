/**
 * validators/patientValidator.js
 * -------------------------------
 * express-validator rule chains for Patient Management APIs.
 *
 * [Gujarati સમજણ]
 * આ file patient management ના APIs માટે input validation rules define કરે છે.
 * Invalid data controller/service સુધી ન પહોંચે — 400 error return.
 *
 * Validators:
 *  - createPatientValidator    → POST /api/patients
 *  - updatePatientValidator    → PATCH /api/patients/:id
 *  - statusUpdateValidator     → PATCH /api/patients/:id/status
 *  - patientQueryValidator     → GET /api/patients (pagination/filter params)
 *  - mongoIdValidator          → :id param validate
 *  - handleValidationErrors    → collect errors → 400 JSON (reused from auth)
 */

const { body, param, query, validationResult } = require("express-validator");

// ─── Reusable: Collect & Return Validation Errors ────────────────────────────
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const messages = errors.array().map((e) => e.msg);
    return res.status(400).json({
      success: false,
      message: messages[0],
      errors: messages,
    });
  }
  next();
};

// ─── Reusable Field Rules ─────────────────────────────────────────────────────
const fullNameRule = body("fullName")
  .trim()
  .notEmpty().withMessage("Full name is required")
  .isLength({ min: 2 }).withMessage("Full name must be at least 2 characters")
  .isLength({ max: 100 }).withMessage("Full name cannot exceed 100 characters")
  .matches(/^[a-zA-Z\s.'-]+$/)
  .withMessage("Full name can only contain letters, spaces, dots, apostrophes or hyphens");

const emailRule = body("email")
  .optional({ nullable: true, checkFalsy: true })
  .trim()
  .isEmail().withMessage("Please provide a valid email address")
  .normalizeEmail({ gmail_remove_dots: false });

const phoneRule = body("phone")
  .trim()
  .notEmpty().withMessage("Phone number is required")
  .matches(/^[6-9]\d{9}$/)
  .withMessage("Phone must be a valid 10-digit Indian mobile number starting with 6-9");

const dobRule = body("dateOfBirth")
  .optional({ nullable: true, checkFalsy: true })
  .isISO8601().withMessage("Date of birth must be a valid date (YYYY-MM-DD)")
  .toDate()
  .custom((value) => {
    if (value > new Date()) throw new Error("Date of birth cannot be in the future");
    return true;
  });

const genderRule = body("gender")
  .optional({ nullable: true, checkFalsy: true })
  .isIn(["male", "female", "other", "prefer_not_to_say"])
  .withMessage("Gender must be: male, female, other, or prefer_not_to_say");

const bloodGroupRule = body("bloodGroup")
  .optional({ nullable: true, checkFalsy: true })
  .isIn(["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"])
  .withMessage("Invalid blood group. Must be one of: A+, A-, B+, B-, AB+, AB-, O+, O-");

const addressRules = [
  body("address.street").optional({ nullable: true }).trim().isLength({ max: 200 })
    .withMessage("Street cannot exceed 200 characters"),
  body("address.city").optional({ nullable: true }).trim().isLength({ max: 100 })
    .withMessage("City cannot exceed 100 characters"),
  body("address.state").optional({ nullable: true }).trim().isLength({ max: 100 })
    .withMessage("State cannot exceed 100 characters"),
  body("address.pincode")
    .optional({ nullable: true, checkFalsy: true })
    .matches(/^\d{6}$/).withMessage("Pincode must be exactly 6 digits"),
];

const emergencyContactRules = [
  body("emergencyContact.name").optional({ nullable: true }).trim()
    .isLength({ max: 100 }).withMessage("Emergency contact name cannot exceed 100 characters"),
  body("emergencyContact.relationship").optional({ nullable: true }).trim()
    .isLength({ max: 50 }).withMessage("Relationship cannot exceed 50 characters"),
  body("emergencyContact.phone")
    .optional({ nullable: true, checkFalsy: true })
    .matches(/^[6-9]\d{9}$/)
    .withMessage("Emergency contact phone must be a valid 10-digit Indian mobile number"),
];

const medicalRules = [
  body("medicalHistory").optional({ nullable: true }).trim()
    .isLength({ max: 2000 }).withMessage("Medical history cannot exceed 2000 characters"),
  body("allergies").optional({ nullable: true }).trim()
    .isLength({ max: 1000 }).withMessage("Allergies cannot exceed 1000 characters"),
  body("currentMedications").optional({ nullable: true }).trim()
    .isLength({ max: 1000 }).withMessage("Current medications cannot exceed 1000 characters"),
  body("notes").optional({ nullable: true }).trim()
    .isLength({ max: 2000 }).withMessage("Notes cannot exceed 2000 characters"),
];

// ─── Create Patient Validator ─────────────────────────────────────────────────
const createPatientValidator = [
  fullNameRule,
  emailRule,
  phoneRule,
  dobRule,
  genderRule,
  bloodGroupRule,
  ...addressRules,
  ...emergencyContactRules,
  ...medicalRules,
  handleValidationErrors,
];

// ─── Update Patient Validator ─────────────────────────────────────────────────
// All fields optional for PATCH — only validate what is sent
const updatePatientValidator = [
  body("fullName")
    .optional()
    .trim()
    .isLength({ min: 2 }).withMessage("Full name must be at least 2 characters")
    .isLength({ max: 100 }).withMessage("Full name cannot exceed 100 characters")
    .matches(/^[a-zA-Z\s.'-]+$/).withMessage("Full name contains invalid characters"),
  emailRule,
  body("phone")
    .optional()
    .trim()
    .matches(/^[6-9]\d{9}$/)
    .withMessage("Phone must be a valid 10-digit Indian mobile number"),
  dobRule,
  genderRule,
  bloodGroupRule,
  ...addressRules,
  ...emergencyContactRules,
  ...medicalRules,
  // Prevent patientId, userId, createdBy from being updated
  body("patientId").not().exists().withMessage("Patient ID cannot be modified"),
  body("userId").not().exists().withMessage("User ID cannot be modified via this endpoint"),
  body("createdBy").not().exists().withMessage("Creator field cannot be modified"),
  handleValidationErrors,
];

// ─── Status Update Validator ──────────────────────────────────────────────────
const statusUpdateValidator = [
  body("isActive")
    .notEmpty().withMessage("isActive field is required")
    .isBoolean().withMessage("isActive must be a boolean (true or false)")
    .toBoolean(),
  handleValidationErrors,
];

// ─── MongoDB ObjectId Param Validator ─────────────────────────────────────────
const mongoIdValidator = [
  param("id")
    .isMongoId().withMessage("Invalid patient ID format. Must be a valid MongoDB ObjectId"),
  handleValidationErrors,
];

// ─── Query Parameter Validator ────────────────────────────────────────────────
const patientQueryValidator = [
  query("page")
    .optional()
    .isInt({ min: 1 }).withMessage("Page must be a positive integer")
    .toInt(),
  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage("Limit must be between 1 and 100")
    .toInt(),
  query("gender")
    .optional()
    .isIn(["male", "female", "other", "prefer_not_to_say"])
    .withMessage("Invalid gender filter"),
  query("isActive")
    .optional()
    .isIn(["true", "false"]).withMessage("isActive must be true or false"),
  query("sortOrder")
    .optional()
    .isIn(["asc", "desc"]).withMessage("sortOrder must be asc or desc"),
  handleValidationErrors,
];

module.exports = {
  createPatientValidator,
  updatePatientValidator,
  statusUpdateValidator,
  mongoIdValidator,
  patientQueryValidator,
  handleValidationErrors,
};
