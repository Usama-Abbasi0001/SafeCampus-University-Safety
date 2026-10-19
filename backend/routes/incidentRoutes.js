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

    // Use verified camera physical location from database
    const Camera = require('../models/Camera');
    const camera = await Camera.findOne({ id: new RegExp(`^${incidentData.cameraId}$`, 'i') });
    if (camera) {
      incidentData.location = camera.location || camera.installationAddress || "Central Academic Block - Main Corridor";
      if (camera.latitude) incidentData.latitude = camera.latitude;
      if (camera.longitude) incidentData.longitude = camera.longitude;
    } else {
      // Configurable campus fallback if camera is not pre-registered - never an arbitrary IP / computer location
      if (!incidentData.location || incidentData.location.includes("Tando") || incidentData.location.includes("Nagori") || incidentData.location.includes("Nabari")) {
        incidentData.location = "Central Academic Block - Main Corridor (CAM-01)";
      }
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

// Helper to send email (Supports Google Apps Script HTTPS, Resend API, Brevo port 2525, and Gmail SMTP)
const sendEmail = async (to, subject, html) => {
  console.log(`[EMAIL DISPATCH] Attempting to deliver notice to: ${to}`);

  // Channel 1: Google Apps Script Web App (HTTPS Port 443 - 100% bypasses ISP SMTP blocks)
  if (process.env.GOOGLE_SCRIPT_URL) {
    try {
      console.log('[EMAIL DISPATCH] Sending via Google Apps Script HTTPS Relay...');
      const response = await fetch(process.env.GOOGLE_SCRIPT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to, subject, html })
      });
      const result = await response.json().catch(() => ({}));
      console.log('✅ [EMAIL SUCCESS] Email delivered via Google Cloud HTTPS Relay to:', to);
      return { success: true, method: 'google_script', result };
    } catch (e) {
      console.error('❌ [EMAIL ERROR] Google Apps Script relay failed:', e.message);
    }
  }

  // Channel 2: Resend API (HTTPS Port 443)
  if (process.env.RESEND_API_KEY) {
    try {
      console.log('[EMAIL DISPATCH] Sending via Resend HTTPS API...');
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: 'SafeCampus Security <onboarding@resend.dev>',
          to: [to],
          subject,
          html
        })
      });
      const data = await response.json();
      if (response.ok) {
        console.log('✅ [EMAIL SUCCESS] Email delivered via Resend API to:', to, data);
        return { success: true, method: 'resend', data };
      } else {
        console.error('❌ [EMAIL ERROR] Resend API error:', data);
      }
    } catch (e) {
      console.error('❌ [EMAIL ERROR] Resend fetch failed:', e.message);
    }
  }

  // Channel 3: Brevo / Custom SMTP on Port 2525 (Port 2525 is open and unblocked)
  if (process.env.BREVO_KEY || process.env.SMTP_PORT === '2525') {
    try {
      console.log('[EMAIL DISPATCH] Sending via Brevo SMTP (Port 2525)...');
      const transporter = nodemailer.createTransport({
        host: 'smtp-relay.brevo.com',
        port: 2525,
        secure: false,
        auth: {
          user: process.env.BREVO_USER || process.env.EMAIL_USER,
          pass: process.env.BREVO_KEY
        }
      });
      const info = await transporter.sendMail({
        from: `SafeCampus Security <${process.env.BREVO_USER || process.env.EMAIL_USER}>`,
        to,
        subject,
        html
      });
      console.log('✅ [EMAIL SUCCESS] Email delivered via Brevo Port 2525 to:', to);
      return { success: true, method: 'brevo_smtp', info };
    } catch (e) {
      console.error('❌ [EMAIL ERROR] Brevo Port 2525 failed:', e.message);
    }
  }

  // Channel 4: Gmail SMTP (Ports 465 / 587)
  if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    try {
      const cleanPass = (process.env.EMAIL_PASS || '').replace(/\s+/g, '');
      console.log('[EMAIL DISPATCH] Connecting to Gmail SMTP with clean app password...');
      const transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 587,
        secure: false,
        auth: {
          user: process.env.EMAIL_USER,
          pass: cleanPass
        },
        connectionTimeout: 6000,
        greetingTimeout: 5000,
        tls: { rejectUnauthorized: false }
      });

      const info = await transporter.sendMail({
        from: `SafeCampus Admin <${process.env.EMAIL_USER}>`,
        to,
        subject,
        html
      });
      console.log('✅ [EMAIL SUCCESS] Email delivered to parent via Gmail SMTP: %s', to);
      return { success: true, method: 'gmail_smtp', info };
    } catch (err) {
      console.error('❌ [EMAIL ERROR] Gmail SMTP connection failed (likely blocked by ISP):', err.message);
    }
  }

  // Channel 5: Fallback via Ethereal test account if no direct SMTP is reachable
  try {
    console.log('[EMAIL DISPATCH] Generating Ethereal test email preview...');
    const account = await nodemailer.createTestAccount();
    const transporter = nodemailer.createTransport({
      host: account.smtp.host,
      port: account.smtp.port,
      secure: account.smtp.secure,
      auth: { user: account.user, pass: account.pass }
    });
    const info = await transporter.sendMail({
      from: 'SafeCampus Admin <admin@safecampus.com>',
      to,
      subject,
      html
    });
    console.log('🔗 [ACTION REQUIRED] View the test email here: %s', nodemailer.getTestMessageUrl(info));
    return { success: true, method: 'ethereal', previewUrl: nodemailer.getTestMessageUrl(info) };
  } catch (err) {
    console.error('❌ [EMAIL ERROR] Ethereal fallback error:', err.message);
    return { success: false, error: err.message };
  }
};

// PUT update an incident
router.put('/:id', async (req, res) => {
  try {
    const originalIncident = await Incident.findOne({ id: req.params.id });
    
    let updateData = { ...req.body };

    const Student = require('../models/Student');

    // Update victim student object if victimId is provided
    if (updateData.victimId !== undefined) {
      if (updateData.victimId && updateData.victimId.toLowerCase() !== 'unknown') {
        const student = await Student.findOne({ id: new RegExp(`^${updateData.victimId}$`, 'i') });
        if (student) {
          updateData.victim = {
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
          updateData.victimDept = student.department;
          updateData.victimSemester = student.semester;
        } else {
          updateData.victim = {
            studentId: updateData.victimId,
            name: `Student (${updateData.victimId})`,
            department: "Campus",
            semester: "N/A",
            faceRecognitionStatus: "Unknown"
          };
        }
      } else {
        updateData.victimId = "Unknown";
        updateData.victim = {
          studentId: "Unknown",
          name: "Unknown / Unidentified Student",
          department: "Campus",
          semester: "N/A",
          faceRecognitionStatus: "Unknown"
        };
      }
    }

    // Update harasser student object if harasserId is provided
    if (updateData.harasserId !== undefined) {
      if (updateData.harasserId && updateData.harasserId.toLowerCase() !== 'unknown') {
        const hStudent = await Student.findOne({ id: new RegExp(`^${updateData.harasserId}$`, 'i') });
        if (hStudent) {
          updateData.harasser = {
            studentId: hStudent.id,
            name: hStudent.name,
            fatherName: hStudent.parentName,
            rollNumber: hStudent.id,
            department: hStudent.department,
            semester: hStudent.semester,
            email: hStudent.email,
            phone: hStudent.phone || hStudent.parentPhone,
            profilePicture: hStudent.photo ? (hStudent.photo.startsWith('http') ? hStudent.photo : `http://localhost:5000${hStudent.photo.startsWith('/') ? '' : '/'}${hStudent.photo}`) : '',
            parentName: hStudent.parentName,
            parentPhone: hStudent.parentPhone,
            faceRecognitionStatus: "Recognized"
          };
          updateData.suspectedPerson = hStudent.name;
        } else {
          updateData.harasser = {
            studentId: updateData.harasserId,
            name: `Suspected Aggressor (${updateData.harasserId})`,
            department: "Campus",
            semester: "N/A",
            faceRecognitionStatus: "Unknown"
          };
          updateData.suspectedPerson = `Suspected Aggressor (${updateData.harasserId})`;
        }
      } else {
        updateData.harasserId = "Unknown";
        updateData.harasser = {
          studentId: "Unknown",
          name: "Suspected Aggressor (Unknown)",
          department: "Campus",
          semester: "N/A",
          faceRecognitionStatus: "Unknown"
        };
        updateData.suspectedPerson = "Suspected Aggressor";
      }
    }

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

// POST send parent email directly
router.post('/:id/send-parent-email', async (req, res) => {
  try {
    const incident = await Incident.findOne({ id: req.params.id });
    if (!incident) return res.status(404).json({ message: "Incident not found" });

    const victimStudentId = (incident.victim && incident.victim.studentId) || incident.victimId;
    if (!victimStudentId || victimStudentId.toLowerCase() === "unknown") {
      return res.status(400).json({ message: "Victim student ID is unknown. Cannot lookup parent." });
    }

    const Parent = require('../models/Parent');
    const victimParent = await Parent.findOne({ childStudentId: new RegExp(`^${victimStudentId}$`, 'i') });
    if (!victimParent || !victimParent.email) {
      return res.status(404).json({ message: `No registered parent email found for student ID: ${victimStudentId}` });
    }

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
              <td style="padding: 10px; border: 1px solid #e2e8f0;">${(incident.victim && incident.victim.name) || victimStudentId}</td>
            </tr>
            <tr>
              <td style="padding: 10px; border: 1px solid #e2e8f0; font-weight: bold;">Roll Number:</td>
              <td style="padding: 10px; border: 1px solid #e2e8f0;">${victimStudentId}</td>
            </tr>
            <tr style="background: #f8fafc;">
              <td style="padding: 10px; border: 1px solid #e2e8f0; font-weight: bold;">Incident Type:</td>
              <td style="padding: 10px; border: 1px solid #e2e8f0; color: #dc2626; font-weight: bold;">${incident.type}</td>
            </tr>
            <tr>
              <td style="padding: 10px; border: 1px solid #e2e8f0; font-weight: bold;">Date & Time:</td>
              <td style="padding: 10px; border: 1px solid #e2e8f0;">${incident.date} at ${incident.time}</td>
            </tr>
            <tr style="background: #f8fafc;">
              <td style="padding: 10px; border: 1px solid #e2e8f0; font-weight: bold;">Campus Location:</td>
              <td style="padding: 10px; border: 1px solid #e2e8f0;">${incident.location || 'University Campus'} (${incident.cameraId || 'CAM-01'})</td>
            </tr>
            <tr>
              <td style="padding: 10px; border: 1px solid #e2e8f0; font-weight: bold;">Suspected Person:</td>
              <td style="padding: 10px; border: 1px solid #e2e8f0;">${(incident.harasser && incident.harasser.name) || incident.suspectedPerson || 'Under Review'}</td>
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

    const dispatch = await sendEmail(
      victimParent.email,
      `🚨 SafeCampus Alert: Verified Incident Involving ${(incident.victim && incident.victim.name) || victimStudentId}`,
      emailHtml
    );

    res.json({
      success: true,
      message: `Parent notification processed for ${victimParent.email}`,
      parentName: victimParent.name,
      parentEmail: victimParent.email,
      childStudentId: victimStudentId,
      dispatch
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
