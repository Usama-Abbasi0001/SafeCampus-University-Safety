const mongoose = require('mongoose');

const cameraSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true }, // e.g. CAM-001
  name: { type: String, required: true },
  location: { type: String },
  status: { type: String, default: 'Active' },
  aiDetection: { type: Boolean, default: true },
  detectedPersons: { type: Number, default: 0 },
  lastActive: { type: String, default: 'Live' },
  feed: { type: String }
});

module.exports = mongoose.model('Camera', cameraSchema);
