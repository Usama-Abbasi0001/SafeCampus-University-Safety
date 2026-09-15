const mongoose = require('mongoose');
require('dotenv').config();
const fs = require('fs');
const Student = require('./models/Student');

mongoose.connect(process.env.MONGO_URI)
.then(async () => {
  console.log('✅ Connected to MongoDB Atlas for seeding');
  
  try {
    const data = JSON.parse(fs.readFileSync('../students_data.json', 'utf-8'));
    
    // Clear existing to avoid duplicate key errors if run multiple times
    await Student.deleteMany({});
    
    // Insert new
    await Student.insertMany(data);
    
    console.log('🎉 Successfully inserted 50 students!');
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
