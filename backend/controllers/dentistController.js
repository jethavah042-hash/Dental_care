/**
 * controllers/dentistController.js
 * --------------------------------
 * Thin HTTP handlers for Dentist endpoints.
 * Uses the service layer and returns consistent JSON responses.
 */

const asyncHandler = require('express-async-handler');
const dentistService = require('../services/dentistService');

// POST /api/dentists – admin only
const registerDentist = asyncHandler(async (req, res) => {
  const { dentist } = await dentistService.createDentist(req.body, req.user._id);
  res.status(201).json({
    success: true,
    message: 'Dentist registered successfully.',
    data: { dentist },
  });
});

// GET /api/dentists – list with pagination/search/filters
const listDentists = asyncHandler(async (req, res) => {
  const result = await dentistService.getAllDentists(req.query);
  res.json({ success: true, data: result });
});

// GET /api/dentists/stats – admin/receptionist
const getDentistStats = asyncHandler(async (req, res) => {
  const stats = await dentistService.getDentistStats();
  res.json({ success: true, data: stats });
});

// GET /api/dentists/:id – details
const getDentist = asyncHandler(async (req, res) => {
  const { dentist } = await dentistService.getDentistById(req.params.id, req.user);
  res.json({ success: true, data: { dentist } });
});

// PATCH /api/dentists/:id – admin only
const updateDentist = asyncHandler(async (req, res) => {
  const { dentist } = await dentistService.updateDentist(req.params.id, req.body);
  res.json({
    success: true,
    message: 'Dentist updated successfully.',
    data: { dentist },
  });
});

// PATCH /api/dentists/:id/status – admin only
const updateDentistStatus = asyncHandler(async (req, res) => {
  const { dentist } = await dentistService.updateDentistStatus(req.params.id, req.body.isActive);
  res.json({
    success: true,
    message: `Dentist ${req.body.isActive ? 'activated' : 'deactivated'} successfully.`,
    data: { dentist },
  });
});

module.exports = {
  registerDentist,
  listDentists,
  getDentistStats,
  getDentist,
  updateDentist,
  updateDentistStatus,
};
