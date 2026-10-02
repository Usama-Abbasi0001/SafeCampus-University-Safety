const express = require('express');
const router = express.Router();
const Student = require('../models/Student');
const multer = require('multer');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});
const upload = multer({ storage: storage });

// GET all students
router.get('/', async (req, res) => {
  try {
    const students = await Student.find().sort({ id: 1 });
    res.json(students);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET a student by id
router.get('/:id', async (req, res) => {
  try {
    const student = await Student.findOne({ id: req.params.id });
    if (!student) return res.status(404).json({ message: "Student not found" });
    res.json(student);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST a new student
router.post('/', upload.single('profilePicture'), async (req, res) => {
  const photo = req.file ? `/uploads/${req.file.filename}` : req.body.photo || '';
  const student = new Student({
    id: req.body.id,
    name: req.body.name,
    parentName: req.body.parentName,
    department: req.body.department || "Computer Science",
    semester: req.body.semester || "8th",
    photo: photo,
    email: req.body.email,
    parentPhone: req.body.parentPhone,
    status: req.body.status || "Active",
    safetyStatus: req.body.safetyStatus || "Safe",
  });

  try {
    const newStudent = await student.save();
    res.status(201).json(newStudent);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// PUT update student
router.put('/:id', upload.single('profilePicture'), async (req, res) => {
  try {
    let updateData = { ...req.body };
    if (req.file) {
      updateData.photo = `/uploads/${req.file.filename}`;
    }
    const updatedStudent = await Student.findOneAndUpdate(
      { id: req.params.id },
      updateData,
      { new: true }
    );
    if (!updatedStudent) return res.status(404).json({ message: "Student not found" });
    res.json(updatedStudent);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Seed data (Optional route to insert the 50 students quickly)
router.post('/seed', async (req, res) => {
  try {
    const data = req.body; // Array of students
    await Student.insertMany(data);
    res.status(201).json({ message: "Seed successful!" });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});
// DELETE a student by id
router.delete('/:id', async (req, res) => {
  try {
    const student = await Student.findOneAndDelete({ id: req.params.id });
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }
    res.json({ message: "Student deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
