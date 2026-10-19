const mongoose = require('mongoose');

const cameraSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true }, // e.g. CAM-01
  name: { type: String, required: true },
  location: { type: String, required: true },
  installationAddress: { type: String },
  latitude: { type: Number },
  longitude: { type: Number },
  status: { type: String, default: 'Active' },
  aiDetection: { type: Boolean, default: true },
  detectedPersons: { type: Number, default: 0 },
  lastActive: { type: String, default: 'Live' },
  feed: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Camera', cameraSchema);
