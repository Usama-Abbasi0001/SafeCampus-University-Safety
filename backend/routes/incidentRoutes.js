const express = require('express');
const router = express.Router();
const Incident = require('../models/Incident');
// const Parent = require('../models/Parent');
const multer = require('multer');
const nodemailer = require('nodemailer');

// Configure Multer for local file storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});
const upload = multer({ storage });

// GET all incidents
router.get('/', async (req, res) => {
  try {
    const incidents = await Incident.find().sort({ _id: -1 });
    res.json(incidents);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST a new incident
router.post('/', upload.single('evidenceImage'), async (req, res) => {
  try {
    const imageUrl = req.file ? `http://localhost:5000/uploads/${req.file.filename}` : "";
    
    // Auto-generate ID like INC-1678912345
    const incidentId = `INC-${Date.now()}`;
    
    const incidentData = {
      ...req.body,
      id: incidentId,
      evidenceImage: imageUrl,
      date: req.body.date || new Date().toISOString().split('T')[0],
      time: req.body.time || new Date().toLocaleTimeString(),
    };

    // Use camera location
    const Camera = require('../models/Camera');
    const camera = await Camera.findOne({ id: incidentData.cameraId });
    if (camera && camera.location) {
      incidentData.location = camera.location;
    }

    // Lookup student names (COMMENTED OUT)
    // const Student = require('../models/Student');
    
    // Victim lookup
    let victimObj = {
      id: "VICTIM-001",
      name: "Demo Victim",
      gender: "Female",
      status: "Potential Victim"
    };
    /*
    if (incidentData.victimId && incidentData.victimId !== "Unknown") {
      const student = await Student.findOne({ id: new RegExp(`^${incidentData.victimId}$`, 'i') });
      if (student) {
        victimObj = { ... };
      }
    }
    */
    incidentData.victim = victimObj;

    // Harasser lookup
    let harasserObj = {
      id: "HARASSER-001",
      name: "Demo Harasser",
      gender: "Male",
      status: "Suspected Harasser"
    };
    /*
    if (incidentData.harasserId && incidentData.harasserId !== "Unknown") {
      const student = await Student.findOne({ id: new RegExp(`^${incidentData.harasserId}$`, 'i') });
      if (student) {
        harasserObj = { ... };
      }
    }
    */
    incidentData.harasser = harasserObj;


    const incident = new Incident(incidentData);
    const newIncident = await incident.save();
    
    // Emit real-time alert via Socket.io
    if (req.io) {
      req.io.emit('new_incident', newIncident);
    }
    
    res.status(201).json(newIncident);
  } catch (err) {
    console.error("Error creating incident:", err);
    res.status(400).json({ message: err.message });
  }
});

// Helper to send email (Real SMTP if configured, else Ethereal)
const sendEmail = async (to, subject, html) => {
  try {
    let transporter;
    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      // Use Real SMTP (e.g. Gmail)
      transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS
        }
      });
    } else {
      // Use Ethereal Test Account
      const account = await nodemailer.createTestAccount();
      transporter = nodemailer.createTransport({
        host: account.smtp.host,
        port: account.smtp.port,
        secure: account.smtp.secure,
        auth: { user: account.user, pass: account.pass }
      });
    }

    const info = await transporter.sendMail({
      from: 'SafeCampus Admin <admin@safecampus.com>',
      to,
      subject,
      html
    });

    console.log('✅ Email sent to parent: %s', to);
    if (!process.env.EMAIL_USER) {
      console.log('🔗 [ACTION REQUIRED] View the test email here: %s', nodemailer.getTestMessageUrl(info));
    }
  } catch (err) {
    console.error('❌ Error sending email:', err.message);
  }
};

// PUT update an incident
router.put('/:id', async (req, res) => {
  try {
    const originalIncident = await Incident.findOne({ id: req.params.id });
    
    let updateData = { ...req.body };
    // If victimId changed, re-lookup (COMMENTED OUT)
    /*
    const Student = require('../models/Student');
    if (updateData.victimId && updateData.victimId !== originalIncident.victimId) { ... }
    if (updateData.harasserId && updateData.harasserId !== originalIncident.harasserId) { ... }
    */

    const updated = await Incident.findOneAndUpdate({ id: req.params.id }, updateData, { new: true });
    if (!updated) return res.status(404).json({ message: "Incident not found" });

    // Notification emails to parents (COMMENTED OUT)
    /*
    if (originalIncident && req.body.status && req.body.status !== originalIncident.status) {
      const victimParent = await Parent.findOne({ childStudentId: updated.victimId || (updated.victim && updated.victim.studentId) });
      const harasserParent = await Parent.findOne({ childStudentId: updated.harasserId || (updated.harasser && updated.harasser.studentId) });
      ...
    }
    */


    res.json(updated);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Seed data
router.post('/seed', async (req, res) => {
  try {
    await Incident.deleteMany({});
    await Incident.insertMany(req.body);
    res.status(201).json({ message: "Seed successful!" });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// DELETE an incident
router.delete('/:id', async (req, res) => {
  try {
    const deleted = await Incident.findOneAndDelete({ id: req.params.id });
    if (!deleted) return res.status(404).json({ message: "Incident not found" });
    res.json({ message: "Incident deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
