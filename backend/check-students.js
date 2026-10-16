const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI).then(async () => {
  const Student = require('./models/Student');
  const all = await Student.find();
  const withPhoto = all.filter(s => s.photo && s.photo.trim().length > 0);
  console.log(`Total students: ${all.length}`);
  console.log(`Students with photo: ${withPhoto.length}`);
  console.log(JSON.stringify(withPhoto.map(s => ({ id: s.id, name: s.name, photo: s.photo, email: s.email })), null, 2));
  process.exit(0);
}).catch(err => {
  console.error(err);
  process.exit(1);
});
