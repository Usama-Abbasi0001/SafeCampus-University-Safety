const express = require('express');
const router = express.Router();
const Student = require('../models/Student');

// GET all students
router.get('/', async (req, res) => {
  try {
    const students = await Student.find().sort({ id: 1 });
    res.json(students);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST a new student
router.post('/', async (req, res) => {
  const student = new Student({
    id: req.body.id,
    name: req.body.name,
    parentName: req.body.parentName,
    department: req.body.department || "Computer Science",
    semester: req.body.semester || "8th",
    photo: req.body.photo,
    email: req.body.email,
    parentPhone: req.body.parentPhone
  });

  try {
    const newStudent = await student.save();
    res.status(201).json(newStudent);
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
