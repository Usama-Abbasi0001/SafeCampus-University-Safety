const mongoose = require('mongoose');
require('dotenv').config();
const Incident = require('./models/Incident');
const Camera = require('./models/Camera');

const incidents = [];

const cameras = [];

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
