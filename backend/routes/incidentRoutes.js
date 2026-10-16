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

    // Lookup student records
    const Student = require('../models/Student');
    
    // Victim lookup
    let victimObj = {
      studentId: incidentData.victimId || "UNKNOWN",
      name: "Unknown / Unidentified Student",
      department: incidentData.victimDept || "Campus",
      semester: incidentData.victimSemester || "N/A",
      faceRecognitionStatus: incidentData.victimId && incidentData.victimId !== "Unknown" ? "Recognized" : "Unknown"
    };

    if (incidentData.victimId && incidentData.victimId !== "Unknown") {
      const student = await Student.findOne({ id: new RegExp(`^${incidentData.victimId}$`, 'i') });
      if (student) {
        victimObj = {
          studentId: student.id,
          name: student.name,
          fatherName: student.parentName,
          rollNumber: student.id,
          department: student.department,
          semester: student.semester,
          email: student.email,
          phone: student.phone || student.parentPhone,
          profilePicture: student.photo ? (student.photo.startsWith('http') ? student.photo : `http://localhost:5000${student.photo.startsWith('/') ? '' : '/'}${student.photo}`) : '',
          parentName: student.parentName,
          parentPhone: student.parentPhone,
          faceRecognitionStatus: "Recognized"
        };
      }
    }
    incidentData.victim = victimObj;

    // Harasser lookup
    let harasserObj = {
      studentId: incidentData.harasserId || "UNKNOWN",
      name: incidentData.suspectedPerson || "Suspected Aggressor",
      department: "Campus",
      semester: "N/A",
      faceRecognitionStatus: incidentData.harasserId && incidentData.harasserId !== "Unknown" ? "Recognized" : "Unknown"
    };

    if (incidentData.harasserId && incidentData.harasserId !== "Unknown") {
      const harasserStudent = await Student.findOne({ id: new RegExp(`^${incidentData.harasserId}$`, 'i') });
      if (harasserStudent) {
        harasserObj = {
          studentId: harasserStudent.id,
          name: harasserStudent.name,
          fatherName: harasserStudent.parentName,
          rollNumber: harasserStudent.id,
          department: harasserStudent.department,
          semester: harasserStudent.semester,
          email: harasserStudent.email,
          phone: harasserStudent.phone || harasserStudent.parentPhone,
          profilePicture: harasserStudent.photo ? (harasserStudent.photo.startsWith('http') ? harasserStudent.photo : `http://localhost:5000${harasserStudent.photo.startsWith('/') ? '' : '/'}${harasserStudent.photo}`) : '',
          parentName: harasserStudent.parentName,
          parentPhone: harasserStudent.parentPhone,
          faceRecognitionStatus: "Recognized"
        };
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

    const updated = await Incident.findOneAndUpdate({ id: req.params.id }, updateData, { new: true });
    if (!updated) return res.status(404).json({ message: "Incident not found" });

    // Notification emails to parents when confirmed
    const Parent = require('../models/Parent');
    if (originalIncident && req.body.status && req.body.status === "Confirmed" && originalIncident.status !== "Confirmed") {
      const victimStudentId = (updated.victim && updated.victim.studentId) || updated.victimId;
      console.log(`[INCIDENT CONFIRMED] Searching parent for victim studentId: ${victimStudentId}`);

      if (victimStudentId) {
        const victimParent = await Parent.findOne({ childStudentId: new RegExp(`^${victimStudentId}$`, 'i') });
        if (victimParent && victimParent.email) {
          console.log(`[INCIDENT CONFIRMED] Sending email to victim parent: ${victimParent.email} (${victimParent.name})`);
          const emailHtml = `
            <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
              <div style="background-color: #dc2626; color: #ffffff; padding: 18px 24px; text-align: center;">
                <h2 style="margin: 0; font-size: 20px;">🚨 SafeCampus Urgent Incident Notice</h2>
              </div>
              <div style="padding: 24px;">
                <p style="font-size: 15px; color: #1e293b;">Dear <strong>${victimParent.name}</strong>,</p>
                <p style="font-size: 14px; color: #475569; line-height: 1.6;">
                  This is an official automated notification from SafeCampus University Security. 
                  A safety incident involving your child has been verified and confirmed by campus security:
                </p>
                
                <table style="width: 100%; border-collapse: collapse; margin: 18px 0; font-size: 13px;">
                  <tr style="background: #f8fafc;">
                    <td style="padding: 10px; border: 1px solid #e2e8f0; font-weight: bold; width: 35%;">Student Name:</td>
                    <td style="padding: 10px; border: 1px solid #e2e8f0;">${(updated.victim && updated.victim.name) || victimStudentId}</td>
                  </tr>
                  <tr>
                    <td style="padding: 10px; border: 1px solid #e2e8f0; font-weight: bold;">Roll Number:</td>
                    <td style="padding: 10px; border: 1px solid #e2e8f0;">${victimStudentId}</td>
                  </tr>
                  <tr style="background: #f8fafc;">
                    <td style="padding: 10px; border: 1px solid #e2e8f0; font-weight: bold;">Incident Type:</td>
                    <td style="padding: 10px; border: 1px solid #e2e8f0; color: #dc2626; font-weight: bold;">${updated.type}</td>
                  </tr>
                  <tr>
                    <td style="padding: 10px; border: 1px solid #e2e8f0; font-weight: bold;">Date & Time:</td>
                    <td style="padding: 10px; border: 1px solid #e2e8f0;">${updated.date} at ${updated.time}</td>
                  </tr>
                  <tr style="background: #f8fafc;">
                    <td style="padding: 10px; border: 1px solid #e2e8f0; font-weight: bold;">Campus Location:</td>
                    <td style="padding: 10px; border: 1px solid #e2e8f0;">${updated.location || 'University Campus'} (${updated.cameraId || 'CAM-01'})</td>
                  </tr>
                  <tr>
                    <td style="padding: 10px; border: 1px solid #e2e8f0; font-weight: bold;">Suspected Person:</td>
                    <td style="padding: 10px; border: 1px solid #e2e8f0;">${(updated.harasser && updated.harasser.name) || 'Under Campus Disciplinary Review'}</td>
                  </tr>
                  <tr style="background: #f8fafc;">
                    <td style="padding: 10px; border: 1px solid #e2e8f0; font-weight: bold;">Status:</td>
                    <td style="padding: 10px; border: 1px solid #e2e8f0; color: #dc2626; font-weight: bold;">Confirmed by Campus Security Officer</td>
                  </tr>
                </table>

                <p style="font-size: 13px; color: #475569; line-height: 1.5;">
                  Our security administration has secured the photographic evidence and initiated university safety protocols. 
                  Please log in to your SafeCampus Parent Portal for real-time case updates.
                </p>
                <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #e2e8f0; text-align: center;">
                  <p style="font-size: 11px; color: #94a3b8; margin: 0;">SafeCampus Automated Security Intelligence • University Campus Safety Network</p>
                </div>
              </div>
            </div>
          `;

          sendEmail(
            victimParent.email,
            `🚨 SafeCampus Alert: Verified Incident Involving ${(updated.victim && updated.victim.name) || victimStudentId}`,
            emailHtml
          );
        } else {
          console.log(`[INCIDENT CONFIRMED] No registered parent found for victim studentId: ${victimStudentId}`);
        }
      }
    }

    // Real-time broadcast to both Admin and Parent dashboards
    if (req.io) {
      req.io.emit('incident_updated', updated);
      req.io.emit('parent_alert', {
        childStudentId: (updated.victim && updated.victim.studentId) || updated.victimId,
        incident: updated
      });
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
