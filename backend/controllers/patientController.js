/**
 * controllers/patientController.js
 * ---------------------------------
 * Patient Management HTTP Controllers (thin layer).
 *
 * [Gujarati સમજણ]
 * Controller HTTP request receive કરે, service call કરે, response format કરે.
 * Business logic patientService.js માં છે.
 *
 * Controllers:
 *  - createPatient      → POST   /api/patients
 *  - getAllPatients      → GET    /api/patients
 *  - getPatientStats    → GET    /api/patients/stats
 *  - getPatient         → GET    /api/patients/:id
 *  - updatePatient      → PATCH  /api/patients/:id
 *  - updatePatientStatus→ PATCH  /api/patients/:id/status
 *
 * Role-based data exposure:
 *  - Dentist: can view patient but limited medical detail shown by /me routes
 *  - Admin/Receptionist: full patient detail
 */

const patientService = require("../services/patientService");

// ─── Create Patient ───────────────────────────────────────────────────────────
/**
 * POST /api/patients
 * Access: admin, receptionist
 */
const createPatient = async (req, res, next) => {
  try {
    const { patient } = await patientService.createPatient(
      req.body,
      req.user._id  // createdBy = authenticated admin/receptionist
    );

    res.status(201).json({
      success: true,
      message: "Patient registered successfully.",
      data: { patient },
    });
  } catch (error) {
    if (error.statusCode) res.status(error.statusCode);
    next(error);
  }
};

// ─── Get All Patients ─────────────────────────────────────────────────────────
/**
 * GET /api/patients
 * Access: admin, receptionist, dentist
 * Query: page, limit, search, gender, isActive, city, sortBy, sortOrder
 */
const getAllPatients = async (req, res, next) => {
  try {
    const { patients, pagination } = await patientService.getAllPatients(req.query);

    res.status(200).json({
      success: true,
      message: "Patients fetched successfully.",
      data: { patients, pagination },
    });
  } catch (error) {
    if (error.statusCode) res.status(error.statusCode);
    next(error);
  }
};

// ─── Get Patient Statistics ───────────────────────────────────────────────────
/**
 * GET /api/patients/stats
 * Access: admin, receptionist
 * IMPORTANT: This route must be defined BEFORE /:id in the router
 * to prevent Express matching "stats" as a MongoDB ObjectId.
 */
const getPatientStats = async (req, res, next) => {
  try {
    const { stats } = await patientService.getPatientStats();

    res.status(200).json({
      success: true,
      message: "Patient statistics fetched successfully.",
      data: { stats },
    });
  } catch (error) {
    if (error.statusCode) res.status(error.statusCode);
    next(error);
  }
};

// ─── Get Single Patient ───────────────────────────────────────────────────────
/**
 * GET /api/patients/:id
 * Access: admin, receptionist, dentist
 * Returns full patient detail including medical info.
 */
const getPatient = async (req, res, next) => {
  try {
    const { patient } = await patientService.getPatientById(req.params.id);

    res.status(200).json({
      success: true,
      message: "Patient details fetched successfully.",
      data: { patient },
    });
  } catch (error) {
    if (error.statusCode) res.status(error.statusCode);
    next(error);
  }
};

// ─── Update Patient ───────────────────────────────────────────────────────────
/**
 * PATCH /api/patients/:id
 * Access: admin, receptionist
 * Partial update — only send fields that need to change.
 */
const updatePatient = async (req, res, next) => {
  try {
    const { patient } = await patientService.updatePatient(
      req.params.id,
      req.body
    );

    res.status(200).json({
      success: true,
      message: "Patient updated successfully.",
      data: { patient },
    });
  } catch (error) {
    if (error.statusCode) res.status(error.statusCode);
    next(error);
  }
};

// ─── Update Patient Status ────────────────────────────────────────────────────
/**
 * PATCH /api/patients/:id/status
 * Access: admin only
 * Body: { isActive: true|false }
 * Soft-deactivation — medical records preserved permanently.
 */
const updatePatientStatus = async (req, res, next) => {
  try {
    const { isActive } = req.body;

    const { patient } = await patientService.updatePatientStatus(
      req.params.id,
      isActive
    );

    const statusMsg = isActive ? "activated" : "deactivated";

    res.status(200).json({
      success: true,
      message: `Patient ${statusMsg} successfully.`,
      data: { patient },
    });
  } catch (error) {
    if (error.statusCode) res.status(error.statusCode);
    next(error);
  }
};

module.exports = {
  createPatient,
  getAllPatients,
  getPatientStats,
  getPatient,
  updatePatient,
  updatePatientStatus,
};
