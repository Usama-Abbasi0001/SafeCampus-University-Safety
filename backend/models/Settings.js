const mongoose = require('mongoose');

const SettingsSchema = new mongoose.Schema({
  aiThreshold: { type: Number, default: 75 },
  emailNotifs: { type: Boolean, default: true },
  smsNotifs: { type: Boolean, default: true },
  autoConfirm: { type: Boolean, default: false },
  universityName: { type: String, default: 'National University of Sciences & Technology' },
  safetyOfficerEmail: { type: String, default: 'safety@nust.edu.pk' },
  emergencyPhone: { type: String, default: '+92-51-9085000' },
  safetyOfficer: { type: String, default: 'Dr. Hina Shahid' },
  adminName: { type: String, default: 'Dr. Ahmad Raza' },
  adminEmail: { type: String, default: 'admin@nust.edu.pk' }
}, { timestamps: true });

module.exports = mongoose.model('Settings', SettingsSchema);
