/**
 * services/dentistService.js
 * --------------------------
 * Business logic for Dentist Management.
 * Uses the existing Counter model (from Patient) for sequential IDs.
 */

const mongoose = require('mongoose');
const Dentist = require('../models/Dentist');
const User = require('../models/User');

/**
 * Helper to check that a linked User exists and has role 'dentist'.
 * Returns the User document if valid.
 */
const validateDentistUser = async (userId) => {
  const user = await User.findById(userId);
  if (!user) {
    const err = new Error('Linked User not found');
    err.statusCode = 404;
    throw err;
  }
  if (user.role !== 'dentist') {
    const err = new Error('Linked User does not have role "dentist"');
    err.statusCode = 400;
    throw err;
  }
  return user;
};

/**
 * Create a new dentist profile.
 * adminId – the authenticated admin creating the record (stored in createdBy).
 */
const createDentist = async (data, adminId) => {
  // Ensure linked user is valid and role is dentist.
  await validateDentistUser(data.userId);

  // Ensure no other dentist profile uses this userId.
  const existing = await Dentist.findOne({ userId: data.userId });
  if (existing) {
    const err = new Error('A dentist profile for this user already exists');
    err.statusCode = 409;
    throw err;
  }

  // License number uniqueness is enforced by schema, but we provide a clear error.
  const licenseUpper = data.licenseNumber.toUpperCase();

  const dentist = await Dentist.create({
    ...data,
    licenseNumber: licenseUpper,
    createdBy: adminId,
  });

  // Populate linked user email/role for admin response.
  await dentist.populate('userId', 'email role');

  return { dentist };
};

/**
 * Get a paginated list of dentists with optional search / filters.
 * queryParams includes page, limit, search, specialization, city, isActive, sortBy, sortOrder.
 */
const getAllDentists = async (queryParams) => {
  const {
    page = parseInt(process.env.DEFAULT_PAGE) || 1,
    limit = parseInt(process.env.DEFAULT_LIMIT) || 10,
    search = '',
    specialization,
    city,
    isActive,
    sortBy = 'createdAt',
    sortOrder = 'desc',
  } = queryParams;

  const filter = {};
  if (isActive !== undefined) filter.isActive = isActive === 'true' || isActive === true;
  if (specialization) filter.specialization = specialization;
  if (city) filter['address.city'] = { $regex: city.trim(), $options: 'i' };

  if (search && search.trim() !== '') {
    const safe = search.trim().replace(/[.*+?^${}()|[\\]\\\\]/g, '\\$&');
    filter.$or = [
      { dentistId: { $regex: safe, $options: 'i' } },
      { fullName: { $regex: safe, $options: 'i' } },
      { email: { $regex: safe, $options: 'i' } },
      { phone: { $regex: safe, $options: 'i' } },
      { specialization: { $regex: safe, $options: 'i' } },
      { licenseNumber: { $regex: safe, $options: 'i' } },
    ];
  }

  const pageNum = Math.max(1, parseInt(page));
  const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
  const skip = (pageNum - 1) * limitNum;

  const allowedSort = ['fullName', 'createdAt', 'dentistId', 'specialization'];
  const sortField = allowedSort.includes(sortBy) ? sortBy : 'createdAt';
  const sortDir = sortOrder === 'asc' ? 1 : -1;

  const [dentists, total] = await Promise.all([
    Dentist.find(filter)
      .select('-consultationFee -experienceYears -licenseNumber -qualifications -workingHours -workingDays -languages') // list view minimal
      .populate('createdBy', 'fullName email role')
      .sort({ [sortField]: sortDir })
      .skip(skip)
      .limit(limitNum)
      .lean(),
    Dentist.countDocuments(filter),
  ]);

  const totalPages = Math.ceil(total / limitNum);

  return {
    dentists,
    pagination: { totalDentists: total, currentPage: pageNum, totalPages, limit: limitNum },
  };
};

/**
 * Get dentist details by MongoDB _id or dentistId.
 * If admin, populate linked user email & role.
 */
const getDentistById = async (identifier, requester) => {
  const isMongoId = mongoose.Types.ObjectId.isValid(identifier);
  const query = isMongoId ? { _id: identifier } : { dentistId: identifier };

  const populateOpts = requester.role === 'admin' ? 'userId email role' : '';

  const dentist = await Dentist.findOne(query)
    .populate('createdBy', 'fullName email role')
    .populate(populateOpts ? { path: 'userId', select: populateOpts } : null)
    .lean();

  if (!dentist) {
    const err = new Error('Dentist not found');
    err.statusCode = 404;
    throw err;
  }

  return { dentist };
};

/**
 * Update dentist profile – admin only.
 */
const updateDentist = async (id, updates) => {
  // Disallow changes to immutable fields – handled by controller validation.
  const dentist = await Dentist.findByIdAndUpdate(id, updates, { new: true, runValidators: true })
    .populate('userId', 'email role')
    .lean();
  if (!dentist) {
    const err = new Error('Dentist not found');
    err.statusCode = 404;
    throw err;
  }
  return { dentist };
};

/**
 * Activate / deactivate dentist (soft delete).
 */
const updateDentistStatus = async (id, isActive) => {
  const dentist = await Dentist.findByIdAndUpdate(id, { isActive }, { new: true }).lean();
  if (!dentist) {
    const err = new Error('Dentist not found');
    err.statusCode = 404;
    throw err;
  }
  return { dentist };
};

/**
 * Statistics aggregation.
 */
const getDentistStats = async () => {
  const agg = await Dentist.aggregate([
    {
      $facet: {
        total: [{ $count: 'count' }],
        active: [{ $match: { isActive: true } }, { $count: 'count' }],
        inactive: [{ $match: { isActive: false } }, { $count: 'count' }],
        avgExperience: [{ $group: { _id: null, avgExp: { $avg: '$experienceYears' } } }],
        avgFee: [{ $group: { _id: null, avgFee: { $avg: '$consultationFee' } } }],
        bySpecialization: [
          { $group: { _id: '$specialization', count: { $sum: 1 } } },
          { $project: { specialization: '$_id', count: 1, _id: 0 } },
        ],
      },
    },
    {
      $project: {
        totalDentists: { $arrayElemAt: ['$total.count', 0] },
        activeDentists: { $arrayElemAt: ['$active.count', 0] },
        inactiveDentists: { $arrayElemAt: ['$inactive.count', 0] },
        averageExperience: { $arrayElemAt: ['$avgExperience.avgExp', 0] },
        averageConsultationFee: { $arrayElemAt: ['$avgFee.avgFee', 0] },
        specializationStats: '$bySpecialization',
      },
    },
  ]);

  return agg[0] || {
    totalDentists: 0,
    activeDentists: 0,
    inactiveDentists: 0,
    averageExperience: 0,
    averageConsultationFee: 0,
    specializationStats: [],
  };
};

module.exports = {
  createDentist,
  getAllDentists,
  getDentistById,
  updateDentist,
  updateDentistStatus,
  getDentistStats,
};
