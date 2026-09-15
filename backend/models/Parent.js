const mongoose = require('mongoose');

const parentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: { type: String, required: true },
  address: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  profilePicture: { type: String, default: "" },
  childStudentId: { type: String, required: true } // References Student.id (Registration Number)
});

module.exports = mongoose.model('Parent', parentSchema);
