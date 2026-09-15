const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const Student = require('../models/Student');
const Parent = require('../models/Parent');

// Configure Multer for local file storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

// ADMIN LOGIN
router.post('/admin/login', (req, res) => {
  const { adminId, password } = req.body;
  
  if (adminId === process.env.ADMIN_ID && password === process.env.ADMIN_PASSWORD) {
    res.json({ message: "Admin authenticated", role: "admin", user: { name: "Administrator" } });
  } else {
    res.status(401).json({ message: "Invalid admin credentials" });
  }
});

// STUDENT SIGNUP
router.post('/student/signup', upload.single('profilePicture'), async (req, res) => {
  try {
    const existing = await Student.findOne({ id: req.body.registrationNumber });
    if (existing) {
      return res.status(400).json({ message: "Registration number already exists." });
    }

    const photoUrl = req.file ? `http://localhost:5000/uploads/${req.file.filename}` : "";
    
    const student = new Student({
      id: req.body.registrationNumber,
      name: req.body.name,
      parentName: req.body.fatherName,
      phone: req.body.phone,
      department: req.body.department,
      semester: req.body.currentSemester,
      email: req.body.email,
      password: req.body.password,
      photo: photoUrl
    });

    await student.save();
    res.status(201).json({ message: "Student registered successfully", user: student });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// STUDENT LOGIN
router.post('/student/login', async (req, res) => {
  try {
    const { registrationNumber, password } = req.body;
    const student = await Student.findOne({ id: registrationNumber, password });
    
    if (student) {
      res.json({ message: "Student authenticated", role: "student", user: student });
    } else {
      res.status(401).json({ message: "Invalid registration number or password." });
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PARENT LINK VERIFICATION
router.post('/parent/verify-student', async (req, res) => {
  try {
    const student = await Student.findOne({ id: req.body.registrationNumber });
    if (student) {
      res.json({ studentName: student.name });
    } else {
      res.status(404).json({ message: "Student record not found. Please enter a valid Registration Number." });
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PARENT SIGNUP
router.post('/parent/signup', upload.single('profilePicture'), async (req, res) => {
  try {
    const existingParent = await Parent.findOne({ email: req.body.email });
    if (existingParent) {
      return res.status(400).json({ message: "Email already registered." });
    }

    const existingStudent = await Student.findOne({ id: req.body.registrationNumber });
    if (!existingStudent) {
      return res.status(404).json({ message: "Student not found." });
    }

    const photoUrl = req.file ? `http://localhost:5000/uploads/${req.file.filename}` : "";

    const parent = new Parent({
      name: req.body.name,
      phone: req.body.phone,
      address: req.body.address,
      email: req.body.email,
      password: req.body.password,
      childStudentId: existingStudent.id,
      profilePicture: photoUrl
    });

    await parent.save();
    res.status(201).json({ message: "Parent registered successfully", user: parent, linkedStudent: existingStudent });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PARENT LOGIN
router.post('/parent/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const parent = await Parent.findOne({ email, password });
    
    if (parent) {
      const child = await Student.findOne({ id: parent.childStudentId });
      res.json({ message: "Parent authenticated", role: "parent", user: parent, linkedStudent: child });
    } else {
      res.status(401).json({ message: "Invalid email or password." });
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
