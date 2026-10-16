const mongoose = require('mongoose');
require('dotenv').config();

async function cleanExceptReal() {
  await mongoose.connect(process.env.MONGO_URI);
  const Student = mongoose.model('Student', new mongoose.Schema({}, { strict: false }));
  const Parent = mongoose.model('Parent', new mongoose.Schema({}, { strict: false }));
  const Incident = mongoose.model('Incident', new mongoose.Schema({}, { strict: false }));

  // Keep student 2k22-cs-46 (Owais Ahmed)
  const delStudents = await Student.deleteMany({ id: { $not: /^2k22-cs-46$/i } });
  console.log('✅ Deleted dummy students count:', delStudents.deletedCount);

  // Keep parent owaisahmed11feb@gmail.com (Ishtiaq Ahmed Arian)
  const delParents = await Parent.deleteMany({ email: { $ne: 'owaisahmed11feb@gmail.com' } });
  console.log('✅ Deleted dummy parents count:', delParents.deletedCount);

  // Clear dummy incidents
  const delIncidents = await Incident.deleteMany({});
  console.log('✅ Deleted dummy incidents count:', delIncidents.deletedCount);

  const remainingStudents = await Student.find({}).lean();
  console.log('\nRemaining Students in DB (' + remainingStudents.length + '):');
  console.log(remainingStudents.map(s => ({ id: s.id, name: s.name, email: s.email, parentName: s.parentName, photo: s.photo })));

  const remainingParents = await Parent.find({}).lean();
  console.log('\nRemaining Parents in DB (' + remainingParents.length + '):');
  console.log(remainingParents.map(p => ({ id: p._id, name: p.name, email: p.email, child: p.childStudentId })));

  await mongoose.disconnect();
}

cleanExceptReal().catch(console.error);
