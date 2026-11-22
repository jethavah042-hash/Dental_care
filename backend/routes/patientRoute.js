/**
 * routes/patientRoute.js
 * ----------------------
 * Patient Management API routes.
 *
 * [Gujarati સમજણ]
 * આ file patient સંબંધિત API endpoints define કરે છે.
 * protect middleware ensures authentication.
 * authorizeRoles ensures role based access.
 *
 * Endpoints:
 *  POST   /api/patients                → createPatient (admin, receptionist)
 *  GET    /api/patients                → getAllPatients (admin, receptionist, dentist)
 *  GET    /api/patients/stats          → getPatientStats (admin, receptionist)
 *  GET    /api/patients/:id            → getPatient (admin, receptionist, dentist)
 *  PATCH  /api/patients/:id            → updatePatient (admin, receptionist)
 *  PATCH  /api/patients/:id/status     → updatePatientStatus (admin only)
 */

const express = require("express");
const router = express.Router();

const patientController = require("../controllers/patientController");
const { protect, authorizeRoles } = require("../middleware/authMiddleware");
const {
  createPatientValidator,
  updatePatientValidator,
  statusUpdateValidator,
  mongoIdValidator,
  patientQueryValidator,
} = require("../validators/patientValidator");

// ─── Create Patient ────────────────────────────────────────────────────────
router.post(
  "/",
  protect,
  authorizeRoles("admin", "receptionist"),
  createPatientValidator,
  patientController.createPatient
);

// ─── Statistics (must be before :id) ───────────────────────────────────────
router.get(
  "/stats",
  protect,
  authorizeRoles("admin", "receptionist"),
  patientController.getPatientStats
);

// ─── List / Search Patients ────────────────────────────────────────────────
router.get(
  "/",
  protect,
  authorizeRoles("admin", "receptionist", "dentist"),
  patientQueryValidator,
  patientController.getAllPatients
);

// ─── Get Single Patient ───────────────────────────────────────────────────
router.get(
  "/:id",
  protect,
  authorizeRoles("admin", "receptionist", "dentist"),
  mongoIdValidator,
  patientController.getPatient
);

// ─── Update Patient (partial) ───────────────────────────────────────────────
router.patch(
  "/:id",
  protect,
  authorizeRoles("admin", "receptionist"),
  mongoIdValidator,
  updatePatientValidator,
  patientController.updatePatient
);

// ─── Update Patient Status (activate/deactivate) ───────────────────────────
router.patch(
  "/:id/status",
  protect,
  authorizeRoles("admin"),
  mongoIdValidator,
  statusUpdateValidator,
  patientController.updatePatientStatus
);

module.exports = router;
