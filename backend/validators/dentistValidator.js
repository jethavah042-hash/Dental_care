/**
 * validators/dentistValidator.js
 * ----------------------------
 * Express‑validator chains for Dentist endpoints.
 */

const { body, param, query } = require('express-validator');

const allowedWorkingDays = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
];

// Helper to trim and normalize email
const normalizeEmail = (value) => (value ? value.toString().trim().toLowerCase() : value);

// ---------- CREATE ----------
const createDentistValidator = [
  body('userId')
    .exists().withMessage('userId is required')
    .isMongoId().withMessage('Invalid userId'),
  body('fullName')
    .exists().withMessage('Full name required')
    .isString().trim().notEmpty().withMessage('Full name cannot be empty'),
  body('email')
    .exists().withMessage('Email required')
    .isEmail().withMessage('Invalid email')
    .customSanitizer(normalizeEmail),
  body('phone')
    .exists().withMessage('Phone required')
    .matches(/^[6-9]\d{9}$/).withMessage('Phone must be a valid 10‑digit Indian mobile number'),
  body('gender')
    .exists().withMessage('Gender required')
    .isIn(['male', 'female', 'other', 'prefer_not_to_say']).withMessage('Invalid gender'),
  body('dateOfBirth')
    .exists().withMessage('Date of birth required')
    .isISO8601().toDate().withMessage('Invalid date')
    .custom((value) => {
      if (value > new Date()) {
        throw new Error('Date of birth cannot be in the future');
      }
      return true;
    }),
  body('specialization')
    .exists().withMessage('Specialization required')
    .isString().trim().notEmpty(),
  body('qualifications')
    .optional()
    .isArray().withMessage('Qualifications must be an array'),
  body('experienceYears')
    .exists().withMessage('Experience years required')
    .isInt({ min: 0 }).withMessage('Experience must be a non‑negative integer'),
  body('licenseNumber')
    .exists().withMessage('License number required')
    .isString().trim().notEmpty()
    .customSanitizer((val) => val.toUpperCase()),
  body('consultationFee')
    .exists().withMessage('Consultation fee required')
    .isFloat({ min: 0 }).withMessage('Consultation fee must be a positive number'),
  body('address.street').optional().isString().trim(),
  body('address.city').optional().isString().trim(),
  body('address.state').optional().isString().trim(),
  body('address.pincode')
    .optional()
    .matches(/^\d{6}$/).withMessage('Pincode must be a 6‑digit number'),
  body('workingDays')
    .optional()
    .isArray({ min: 1 }).withMessage('Working days must be an array')
    .custom((arr) => {
      const invalid = arr.filter(d => !allowedWorkingDays.includes(d));
      if (invalid.length) {
        throw new Error(`Invalid working days: ${invalid.join(', ')}`);
      }
      return true;
    }),
  body('workingHours.startTime')
    .exists().withMessage('Start time required')
    .matches(/^([01]\d|2[0-3]):([0-5]\d)$/).withMessage('Invalid startTime format (HH:mm)'),
  body('workingHours.endTime')
    .exists().withMessage('End time required')
    .matches(/^([01]\d|2[0-3]):([0-5]\d)$/).withMessage('Invalid endTime format (HH:mm)')
    .custom((value, { req }) => {
      const start = req.body.workingHours?.startTime;
      if (start && value <= start) {
        throw new Error('End time must be after start time');
      }
      return true;
    }),
  body('languages')
    .optional()
    .isArray().withMessage('Languages must be an array of strings'),
];

// ---------- UPDATE ----------
const updateDentistValidator = [
  param('id').custom((value) => {
    const objectIdPattern = /^[a-f\d]{24}$/i;
    const dentistIdPattern = /^DENT-DOC-\d{6}$/i;
    if (objectIdPattern.test(value) || dentistIdPattern.test(value)) return true;
    throw new Error('Invalid dentist identifier');
  }),
  body('fullName').optional().isString().trim().notEmpty(),
  body('email').optional().isEmail().customSanitizer(normalizeEmail),
  body('phone').optional().matches(/^[6-9]\d{9}$/).withMessage('Invalid phone'),
  body('gender').optional().isIn(['male', 'female', 'other', 'prefer_not_to_say']),
  body('dateOfBirth').optional().isISO8601().toDate().custom((value) => {
    if (value > new Date()) throw new Error('DOB cannot be in the future');
    return true;
  }),
  body('specialization').optional().isString().trim().notEmpty(),
  body('qualifications').optional().isArray(),
  body('experienceYears').optional().isInt({ min: 0 }),
  body('licenseNumber').optional().isString().trim().customSanitizer((v) => v.toUpperCase()),
  body('consultationFee').optional().isFloat({ min: 0 }),
  body('address.street').optional().isString().trim(),
  body('address.city').optional().isString().trim(),
  body('address.state').optional().isString().trim(),
  body('address.pincode').optional().matches(/^\d{6}$/),
  body('workingDays').optional().isArray().custom((arr) => {
    const invalid = arr.filter(d => !allowedWorkingDays.includes(d));
    if (invalid.length) throw new Error(`Invalid working days: ${invalid.join(', ')}`);
    return true;
  }),
  body('workingHours.startTime').optional().matches(/^([01]\d|2[0-3]):([0-5]\d)$/),
  body('workingHours.endTime').optional().matches(/^([01]\d|2[0-3]):([0-5]\d)$/).custom((value, { req }) => {
    const start = req.body.workingHours?.startTime;
    if (start && value <= start) throw new Error('End time must be after start time');
    return true;
  }),
  body('languages').optional().isArray(),
];

// ---------- PARAM VALIDATOR ----------
const dentistIdParamValidator = [
  param('id').custom((value) => {
    const objectIdPattern = /^[a-f\d]{24}$/i;
    const dentistIdPattern = /^DENT-DOC-\d{6}$/i;
    if (objectIdPattern.test(value) || dentistIdPattern.test(value)) return true;
    throw new Error('Invalid dentist identifier');
  }),
];

// ---------- STATUS UPDATE ----------
const statusValidator = [
  param('id').custom((value) => {
    const objectIdPattern = /^[a-f\d]{24}$/i;
    const dentistIdPattern = /^DENT-DOC-\d{6}$/i;
    if (objectIdPattern.test(value) || dentistIdPattern.test(value)) return true;
    throw new Error('Invalid dentist identifier');
  }),
  body('isActive').exists().isBoolean().withMessage('isActive must be boolean'),
];

// ---------- LIST / SEARCH ----------
const listDentistValidator = [
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1 }).toInt(),
  query('search').optional().isString().trim(),
  query('specialization').optional().isString().trim(),
  query('city').optional().isString().trim(),
  query('isActive').optional().isBoolean().toBoolean(),
  query('sortBy').optional().isIn(['fullName', 'createdAt', 'dentistId', 'specialization']),
  query('sortOrder').optional().isIn(['asc', 'desc']),
];

module.exports = {
  createDentistValidator,
  updateDentistValidator,
  statusValidator,
  listDentistValidator,
  dentistIdParamValidator,
};
