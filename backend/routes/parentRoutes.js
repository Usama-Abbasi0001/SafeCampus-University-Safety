const express = require('express');
const router = express.Router();
const Parent = require('../models/Parent');
const multer = require('multer');

// Setup Multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});
const upload = multer({ storage: storage });

// GET all parents
router.get('/', async (req, res) => {
  try {
    const parents = await Parent.find().lean();
    const Student = require('../models/Student');
    for (let p of parents) {
      if (p.childStudentId) {
        const student = await Student.findOne({ id: p.childStudentId }).lean();
        if (student) {
          p.linkedStudentName = student.name;
          p.linkedStudentId = student.id;
          p.studentSafetyStatus = student.safetyStatus || "Safe";
        }
      }
      p.id = p._id; // Frontend expects p.id
    }
    res.json(parents);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST a new parent
router.post('/', upload.single('profilePicture'), async (req, res) => {
  try {
    const { name, email, phone, address, linkedStudentId, status, password } = req.body;
    const photo = req.file ? `/uploads/${req.file.filename}` : '';
    
    // Check if email already exists
    const existing = await Parent.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: "Email already registered" });
    }

    const newParent = new Parent({
      name,
      email,
      phone,
      address,
      childStudentId: linkedStudentId,
      status: status || "Active",
      password: password || "default123",
      profilePicture: photo
    });

    const savedParent = await newParent.save();
    res.status(201).json(savedParent);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// PUT update parent
router.put('/:id', upload.single('profilePicture'), async (req, res) => {
  try {
    const { name, email, phone, address, linkedStudentId, status, password } = req.body;
    let updateData = { name, email, phone, address, childStudentId: linkedStudentId, status };
    
    if (password) {
      updateData.password = password;
    }
    if (req.file) {
      updateData.profilePicture = `/uploads/${req.file.filename}`;
    }

    const updatedParent = await Parent.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );
    res.json(updatedParent);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// DELETE parent
router.delete('/:id', async (req, res) => {
  try {
    await Parent.findByIdAndDelete(req.params.id);
    res.json({ message: 'Parent deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
