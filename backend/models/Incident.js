const mongoose = require('mongoose');

const personSchema = new mongoose.Schema({
  studentId: String,
  name: String,
  fatherName: String,
  rollNumber: String,
  department: String,
  semester: String,
  email: String,
  phone: String,
  profilePicture: String,
  faceRecognitionStatus: String
}, { _id: false });

const incidentSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  type: { type: String, required: true },
  victim: personSchema,
  harasser: personSchema,
  
  // For backwards compatibility with old frontend code during transition:
  victimId: { type: String },
  victimDept: { type: String },
  victimSemester: { type: String },
  suspectedPerson: { type: String },

  date: { type: String },
  time: { type: String },
  location: { type: String },
  latitude: { type: Number },
  longitude: { type: Number },
  cameraId: { type: String },
  aiConfidence: { type: Number },
  duration: { type: Number }, // Added duration
  status: { type: String, default: 'New' },
  evidenceImage: { type: String },
  notes: { type: String }
});

module.exports = mongoose.model('Incident', incidentSchema);
