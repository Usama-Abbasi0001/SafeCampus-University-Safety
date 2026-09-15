const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true }, // e.g. 2K22-CS-01
  name: { type: String, required: true },
  parentName: { type: String },
  department: { type: String, default: "Computer Science" },
  semester: { type: String, default: "8th" },
  photo: { type: String, default: "" }, // URL to photo
  email: { type: String },
  phone: { type: String },
  password: { type: String },
  parentPhone: { type: String },
  status: { type: String, default: "Active" }, // Active/Inactive
  safetyStatus: { type: String, default: "Safe" } // Safe/At Risk
});

module.exports = mongoose.model('Student', studentSchema);
