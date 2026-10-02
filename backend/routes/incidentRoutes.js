const express = require('express');
const router = express.Router();
const Incident = require('../models/Incident');
const Parent = require('../models/Parent');
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

    // Lookup student names
    const Student = require('../models/Student');
    
    // Victim lookup
    let victimObj = { faceRecognitionStatus: "Unknown", name: "Unknown Person" };
    if (incidentData.victimId && incidentData.victimId !== "Unknown") {
      const student = await Student.findOne({ id: incidentData.victimId });
      if (student) {
        victimObj = {
          studentId: student.id,
          name: student.name,
          fatherName: student.fatherName,
          rollNumber: student.rollNumber,
          department: student.department,
          semester: student.semester,
          email: student.email,
          phone: student.phone,
          profilePicture: student.photo,
          faceRecognitionStatus: "Recognized"
        };
        // Backwards compat
        incidentData.victimDept = student.department;
        incidentData.victimSemester = student.semester;
      }
    }
    incidentData.victim = victimObj;

    // Harasser lookup
    let harasserObj = { faceRecognitionStatus: "Unknown", name: "Unknown Person" };
    if (incidentData.harasserId && incidentData.harasserId !== "Unknown") {
      const student = await Student.findOne({ id: incidentData.harasserId });
      if (student) {
        harasserObj = {
          studentId: student.id,
          name: student.name,
          fatherName: student.fatherName,
          rollNumber: student.rollNumber,
          department: student.department,
          semester: student.semester,
          email: student.email,
          phone: student.phone,
          profilePicture: student.photo,
          faceRecognitionStatus: "Recognized"
        };
        // Backwards compat
        incidentData.suspectedPerson = student.name;
      }
    }
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
    const Student = require('../models/Student');
    
    // If victimId changed, re-lookup
    if (updateData.victimId && updateData.victimId !== originalIncident.victimId) {
      if (updateData.victimId !== "Unknown") {
        const student = await Student.findOne({ id: updateData.victimId });
        if (student) {
          updateData.victim = {
            studentId: student.id,
            name: student.name,
            fatherName: student.fatherName,
            rollNumber: student.rollNumber,
            department: student.department,
            semester: student.semester,
            email: student.email,
            phone: student.phone,
            profilePicture: student.photo,
            faceRecognitionStatus: "Recognized"
          };
          updateData.victimDept = student.department;
          updateData.victimSemester = student.semester;
        }
      } else {
        updateData.victim = { faceRecognitionStatus: "Unknown", name: "Unknown Person" };
      }
    }
    
    // If harasserId changed, re-lookup
    if (updateData.harasserId && updateData.harasserId !== originalIncident.harasserId) {
      if (updateData.harasserId !== "Unknown") {
        const student = await Student.findOne({ id: updateData.harasserId });
        if (student) {
          updateData.harasser = {
            studentId: student.id,
            name: student.name,
            fatherName: student.fatherName,
            rollNumber: student.rollNumber,
            department: student.department,
            semester: student.semester,
            email: student.email,
            phone: student.phone,
            profilePicture: student.photo,
            faceRecognitionStatus: "Recognized"
          };
          updateData.suspectedPerson = student.name;
        }
      } else {
        updateData.harasser = { faceRecognitionStatus: "Unknown", name: "Unknown Person" };
      }
    }

    const updated = await Incident.findOneAndUpdate({ id: req.params.id }, updateData, { new: true });
    if (!updated) return res.status(404).json({ message: "Incident not found" });

    if (originalIncident && req.body.status && req.body.status !== originalIncident.status) {
      const victimParent = await Parent.findOne({ childStudentId: updated.victimId || (updated.victim && updated.victim.studentId) });
      const harasserParent = await Parent.findOne({ childStudentId: updated.harasserId || (updated.harasser && updated.harasser.studentId) });
      
      const victimName = (updated.victim && updated.victim.name) || updated.victim || 'Unknown';
      const harasserName = (updated.harasser && updated.harasser.name) || updated.suspectedPerson || 'Unknown';

      if (req.body.status === 'Confirmed') {
        // Email to Victim's Parent
        if (victimParent && victimParent.email) {
          const subject = `URGENT: Harassment Incident Confirmed - ${updated.id}`;
          const html = `
            <div style="font-family: sans-serif; padding: 20px;">
              <h2 style="color: #d32f2f;">🚨 Harassment Incident Confirmed</h2>
              <p>Dear <strong>${victimParent.name}</strong>,</p>
              <p>A harassment incident involving your child, <strong>${victimName}</strong>, has been confirmed by the administration.</p>
              
              <div style="background: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <h4 style="margin-top: 0;">Incident Details:</h4>
                <ul style="list-style-type: none; padding: 0;">
                  <li style="margin-bottom: 8px;"><strong>Incident ID:</strong> ${updated.id}</li>
                  <li style="margin-bottom: 8px;"><strong>Type:</strong> ${updated.type}</li>
                  <li style="margin-bottom: 8px;"><strong>Suspected Harasser:</strong> <span style="color: red; font-weight: bold;">${harasserName}</span></li>
                  <li style="margin-bottom: 8px;"><strong>Location:</strong> ${updated.location}</li>
                  <li style="margin-bottom: 8px;"><strong>Date & Time:</strong> ${updated.date} ${updated.time}</li>
                </ul>
              </div>
              
              <p>Please log in to the Parent Portal to view further details and contact the university safety office immediately.</p>
              <br>
              <p>SafeCampus System</p>
            </div>
          `;
          sendEmail(victimParent.email, subject, html);
        }

        // Email to Harasser's Parent
        if (harasserParent && harasserParent.email) {
          const subject = `URGENT: Disciplinary Alert - Harassment Incident Confirmed - ${updated.id}`;
          const html = `
            <div style="font-family: sans-serif; padding: 20px;">
              <h2 style="color: #d32f2f;">🚨 Disciplinary Alert</h2>
              <p>Dear <strong>${harasserParent.name}</strong>,</p>
              <p>We are writing to inform you that your child, <strong>${harasserName}</strong>, has been identified as the harasser in a confirmed incident.</p>
              
              <div style="background: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <h4 style="margin-top: 0;">Incident Details:</h4>
                <ul style="list-style-type: none; padding: 0;">
                  <li style="margin-bottom: 8px;"><strong>Incident ID:</strong> ${updated.id}</li>
                  <li style="margin-bottom: 8px;"><strong>Type:</strong> ${updated.type}</li>
                  <li style="margin-bottom: 8px;"><strong>Victim:</strong> ${victimName}</li>
                  <li style="margin-bottom: 8px;"><strong>Location:</strong> ${updated.location}</li>
                  <li style="margin-bottom: 8px;"><strong>Date & Time:</strong> ${updated.date} ${updated.time}</li>
                </ul>
              </div>
              
              <p>Please contact the university administration office immediately regarding this disciplinary matter.</p>
              <br>
              <p>SafeCampus System</p>
            </div>
          `;
          sendEmail(harasserParent.email, subject, html);
        }
      } else if (req.body.status === 'Resolved') {
        if (victimParent && victimParent.email) {
          const subject = `UPDATE: Incident Resolved & Child is Safe - ${updated.id}`;
          const html = `
            <div style="font-family: sans-serif; padding: 20px;">
              <h2 style="color: #2e7d32;">✅ Incident Resolved & Secure</h2>
              <p>Dear <strong>${victimParent.name}</strong>,</p>
              <p>We are writing to inform you that the incident involving your child, <strong>${victimName}</strong>, has been fully resolved.</p>
              <p><strong>Your child is saved, secure, and under the protection of the campus safety team.</strong></p>
              <p>The situation at <strong>${updated.location}</strong> has been handled by the authorities.</p>
              <br>
              <p>Thank you for your cooperation.</p>
              <p>SafeCampus System</p>
            </div>
          `;
          sendEmail(victimParent.email, subject, html);
        }
      }
    }

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
