const mongoose = require('mongoose');

const incidentSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true }, // e.g. INC-2024-0047
  type: { type: String, required: true },
  victim: { type: String },
  victimId: { type: String },
  victimDept: { type: String },
  victimSemester: { type: String },
  suspectedPerson: { type: String },
  date: { type: String },
  time: { type: String },
  location: { type: String },
  cameraId: { type: String },
  aiConfidence: { type: Number },
  status: { type: String, default: 'New' },
  evidenceImage: { type: String },
  notes: { type: String }
});

module.exports = mongoose.model('Incident', incidentSchema);
