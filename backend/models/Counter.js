/**
 * models/Counter.js
 * -----------------
 * Global Counter model used for generating sequential IDs for various entities
 * (e.g., patients, dentists). This file registers the schema under the name
 * 'Counter' so that it can be accessed via mongoose.model('Counter') from any
 * other module.
 */

const mongoose = require('mongoose');
const { Schema } = mongoose;

const counterSchema = new Schema({
  _id: { type: String, required: true }, // e.g., 'patientId', 'dentistId'
  seq: { type: Number, default: 0 },
});

module.exports = mongoose.model('Counter', counterSchema);
