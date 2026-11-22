/**
 * models/Dentist.js
 * -----------------
 * Mongoose Dentist Schema — stores professional dentist profiles.
 *
 * Gujarati સમજણ:
 * આ મોડેલ ક્લિનિકમાં કામ કરનારા ડેન્ટિસ્ટની માહિતી સ્ટોર કરે છે.
 * દરેક ડેન્ટિસ્ટનું અનન્ય `dentistId` (ઉદા. DENT-DOC-000001) હોય છે,
 * અને તેสัมพันธ์િત `User` (role: dentist) સાથે `userId` દ્વારા જોડાયેલ છે.
 *
 * મુખ્ય ડિઝાઇન પોઇન્ટ્સ:
 *   - `dentistId` auto‑generated, અનન્ય, sequential, Counter કલેક્શન દ્વારા.
 *   - `userId` આવશ્યક અને અનન્ય, અને તેનો User રોલ પહેલાથી `dentist` હોવો જોઇએ.
 *   - `licenseNumber` Uppercase માં સ્ટોર થાય છે, case‑insensitive unique.
 *   - `workingHours` એક સિંગલ ઑબ્જેક્ટ { startTime, endTime } (HH:mm).
 *   - `workingDays` એ નક્કી કરેલ દિવસોની એરે (Monday‑Sunday).
 *   - `languages` ફિલ્ડ સ્ટ્રિંગ્સની એરે (લવચીક).
 *   - સંબંધિત ફિલ્ડ્સ માટે યોગ્ય વેલિડેશન, ઇન્ડેક્સ અને `timestamps`.
 */

const mongoose = require('mongoose');
const { Schema } = mongoose;

// Reuse the global Counter model (registered in Patient.js)
const Counter = require('../models/Counter');

// Helper to generate unique dentistId (DENT-DOC-000001)
const generateDentistId = async () => {
  const counter = await Counter.findOneAndUpdate(
    { _id: 'dentistId' },
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );
  const padded = String(counter.seq).padStart(6, '0');
  return `DENT-DOC-${padded}`;
};

const allowedWorkingDays = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
];

const dentistSchema = new Schema({
  // Unique auto‑generated dentist identifier
  dentistId: { type: String, unique: true, trim: true },

  // Link to an existing User (must have role 'dentist')
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },

  fullName: { type: String, required: true, trim: true },
  email: { type: String, required: true, lowercase: true, trim: true },
  phone: { type: String, required: true, trim: true, match: [/^[6-9]\d{9}$/, 'Please provide a valid 10‑digit Indian mobile number'] },
  profileImage: { type: String, default: null },
  gender: { type: String, enum: ['male', 'female', 'other', 'prefer_not_to_say'], required: true },
  dateOfBirth: { type: Date, required: true },
  specialization: { type: String, required: true, trim: true },
  qualifications: [{ type: String, trim: true }],
  experienceYears: { type: Number, required: true, min: 0 },
  licenseNumber: { type: String, required: true, trim: true, uppercase: true },
  consultationFee: { type: Number, required: true, min: 0 },
  bio: { type: String, trim: true, default: null },
  address: {
    street: { type: String, trim: true, default: null },
    city: { type: String, trim: true, default: null },
    state: { type: String, trim: true, default: null },
    pincode: { type: String, trim: true, match: [/^\d{6}$/, 'Pincode must be a 6‑digit number'], default: null },
  },
  workingDays: { type: [{ type: String, enum: allowedWorkingDays }], default: [] },
  workingHours: {
    startTime: { type: String, required: true, match: [/^([01]\d|2[0-3]):([0-5]\d)$/, 'Invalid time format (HH:mm)'] },
    endTime: { type: String, required: true, match: [/^([01]\d|2[0-3]):([0-5]\d)$/, 'Invalid time format (HH:mm)'] },
  },
  languages: [{ type: String, trim: true }],
  isActive: { type: Boolean, default: true },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true, collation: { locale: 'en', strength: 2 } });

// Pre‑validate hook to generate dentistId if not set
 dentistSchema.pre('validate', async function (next) {
   if (!this.dentistId) {
     try {
       this.dentistId = await generateDentistId();
     } catch (err) {
       return next(err);
     }
   }
   next();
 });

// Indexes for efficient search and uniqueness
 dentistSchema.index({ fullName: 'text', email: 'text', phone: 'text', specialization: 'text' });
 dentistSchema.index({ licenseNumber: 1 }, { unique: true, collation: { locale: 'en', strength: 2 } });
 dentistSchema.index({ city: 1 });

module.exports = mongoose.model('Dentist', dentistSchema);
