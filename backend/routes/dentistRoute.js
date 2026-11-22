/**
 * routes/dentistRoute.js
 * ----------------------
 * Express router for Dentist Management.
 */

const express = require('express');
const {
  registerDentist,
  listDentists,
  getDentistStats,
  getDentist,
  updateDentist,
  updateDentistStatus,
} = require('../controllers/dentistController');
const { protect, authorizeRoles } = require('../middleware/authMiddleware');
const {
  createDentistValidator,
  updateDentistValidator,
  statusValidator,
  listDentistValidator,
  dentistIdParamValidator,
} = require('../validators/dentistValidator');

const router = express.Router();

// All routes protected
router.use(protect);

// Create – admin only
router.post(
  '/',
  authorizeRoles('admin'),
  createDentistValidator,
  registerDentist
);

// Stats – admin & receptionist
router.get(
  '/stats',
  authorizeRoles('admin', 'receptionist'),
  getDentistStats
);

// List – admin, receptionist, dentist
router.get(
  '/',
  authorizeRoles('admin', 'receptionist', 'dentist'),
  listDentistValidator,
  listDentists
);

// Get by ID – admin, receptionist, dentist
router.get(
  '/:id',
  authorizeRoles('admin', 'receptionist', 'dentist'),
  dentistIdParamValidator,
  getDentist
);

// Update – admin only
router.patch(
  '/:id',
  authorizeRoles('admin'),
  dentistIdParamValidator,
  updateDentistValidator,
  updateDentist
);

// Status update – admin only
router.patch(
  '/:id/status',
  authorizeRoles('admin'),
  dentistIdParamValidator,
  statusValidator,
  updateDentistStatus
);

module.exports = router;
