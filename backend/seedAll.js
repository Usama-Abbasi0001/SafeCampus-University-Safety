const mongoose = require('mongoose');
require('dotenv').config();
const Incident = require('./models/Incident');
const Camera = require('./models/Camera');

const incidents = [
  {
    id: "INC-2024-0047",
    type: "Verbal Harassment",
    victim: "Ayesha Khan",
    victimId: "STU-2024-001",
    victimDept: "Computer Science",
    victimSemester: "6th",
    suspectedPerson: "Unknown (Male, ~25 yrs)",
    date: "2024-12-14",
    time: "11:32 AM",
    location: "CS Block Ground Floor",
    cameraId: "CAM-001",
    aiConfidence: 94,
    status: "Under Review",
    evidenceImage: "https://images.unsplash.com/photo-1577495508048-b635879837f1?w=600&h=350&fit=crop&auto=format",
    notes: "AI detected aggressive gestures and raised voice pattern. Victim showed signs of distress.",
  },
  {
    id: "INC-2024-0046",
    type: "Physical Contact",
    victim: "Fatima Ahmed",
    victimId: "STU-2024-002",
    victimDept: "Software Engineering",
    victimSemester: "4th",
    suspectedPerson: "Ali Hassan (External)",
    date: "2024-12-13",
    time: "02:15 PM",
    location: "Library Entrance",
    cameraId: "CAM-003",
    aiConfidence: 87,
    status: "Confirmed",
    evidenceImage: "https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=600&h=350&fit=crop&auto=format",
    notes: "Physical contact detected. Suspect grabbed victim's arm. CCTV footage secured.",
  },
  {
    id: "INC-2024-0045",
    type: "Stalking",
    victim: "Zara Malik",
    victimId: "STU-2024-003",
    victimDept: "Information Technology",
    victimSemester: "2nd",
    suspectedPerson: "Unknown (Male, ~20 yrs)",
    date: "2024-12-13",
    time: "09:47 AM",
    location: "Cafeteria",
    cameraId: "CAM-004",
    aiConfidence: 76,
    status: "New",
    evidenceImage: "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=600&h=350&fit=crop&auto=format",
    notes: "Suspect followed victim through multiple locations over 45 minutes.",
  },
  {
    id: "INC-2024-0044",
    type: "Verbal Harassment",
    victim: "Sara Hussain",
    victimId: "STU-2024-004",
    victimDept: "Computer Science",
    victimSemester: "8th",
    suspectedPerson: "Bilal Ahmed (STU-2023-089)",
    date: "2024-12-12",
    time: "04:05 PM",
    location: "CS Block First Floor",
    cameraId: "CAM-002",
    aiConfidence: 91,
    status: "Resolved",
    evidenceImage: "https://images.unsplash.com/photo-1606761568499-6d2451b23c66?w=600&h=350&fit=crop&auto=format",
    notes: "Suspect identified and disciplinary action taken. Case resolved.",
  },
  {
    id: "INC-2024-0043",
    type: "Threatening Behavior",
    victim: "Nadia Iqbal",
    victimId: "STU-2024-005",
    victimDept: "Software Engineering",
    victimSemester: "6th",
    suspectedPerson: "Unknown (Male, ~30 yrs)",
    date: "2024-12-11",
    time: "01:20 PM",
    location: "Library Entrance",
    cameraId: "CAM-003",
    aiConfidence: 83,
    status: "New",
    evidenceImage: "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=600&h=350&fit=crop&auto=format",
    notes: "Threatening gestures detected near library. Victim reported feeling unsafe.",
  },
  {
    id: "INC-2024-0042",
    type: "Cyberbullying",
    victim: "Maria Baig",
    victimId: "STU-2024-006",
    victimDept: "Information Technology",
    victimSemester: "4th",
    suspectedPerson: "Unknown",
    date: "2024-12-10",
    time: "07:00 PM",
    location: "Online / Campus Network",
    cameraId: "N/A",
    aiConfidence: 72,
    status: "Rejected",
    evidenceImage: "https://images.unsplash.com/photo-1563986768609-322da13575f3?w=600&h=350&fit=crop&auto=format",
    notes: "Incident flagged for online harassment. Investigation pending IT department review.",
  },
];

const cameras = [
  {
    id: "CAM-001",
    name: "CS Block Ground Floor",
    location: "Computer Science Block, Ground Floor, Corridor A",
    status: "Active",
    aiDetection: true,
    detectedPersons: 12,
    lastActive: "Live",
    feed: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=640&h=360&fit=crop&auto=format",
  },
  {
    id: "CAM-002",
    name: "CS Block First Floor",
    location: "Computer Science Block, First Floor, Corridor B",
    status: "Active",
    aiDetection: true,
    detectedPersons: 8,
    lastActive: "Live",
    feed: "https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=640&h=360&fit=crop&auto=format",
  },
  {
    id: "CAM-003",
    name: "Library Entrance",
    location: "Main Library, Front Entrance",
    status: "Active",
    aiDetection: true,
    detectedPersons: 23,
    lastActive: "Live",
    feed: "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=640&h=360&fit=crop&auto=format",
  },
  {
    id: "CAM-004",
    name: "Cafeteria",
    location: "Main Cafeteria, Central Area",
    status: "Active",
    aiDetection: true,
    detectedPersons: 47,
    lastActive: "Live",
    feed: "https://images.unsplash.com/photo-1567521464027-f127ff144326?w=640&h=360&fit=crop&auto=format",
  },
  {
    id: "CAM-005",
    name: "Admin Block",
    location: "Administrative Building, Reception",
    status: "Maintenance",
    aiDetection: false,
    detectedPersons: 0,
    lastActive: "2 hours ago",
    feed: "https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=640&h=360&fit=crop&auto=format",
  },
  {
    id: "CAM-006",
    name: "Parking Area",
    location: "Main Parking Lot, Gate 1",
    status: "Active",
    aiDetection: true,
    detectedPersons: 6,
    lastActive: "Live",
    feed: "https://images.unsplash.com/photo-1506521781263-d8422e82f27a?w=640&h=360&fit=crop&auto=format",
  },
];

mongoose.connect(process.env.MONGO_URI)
.then(async () => {
  console.log('✅ Connected to MongoDB Atlas for seeding Incidents & Cameras');
  
  try {
    await Incident.deleteMany({});
    await Incident.insertMany(incidents);
    console.log('🎉 Successfully inserted Incidents!');

    await Camera.deleteMany({});
    await Camera.insertMany(cameras);
    console.log('🎉 Successfully inserted Cameras!');
    
    process.exit();
  } catch (err) {
    console.error('❌ Error seeding data:', err);
    process.exit(1);
  }
})
.catch(err => {
  console.error('❌ Database connection error:', err);
  process.exit(1);
});
