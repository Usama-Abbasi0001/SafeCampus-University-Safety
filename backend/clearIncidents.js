require('dotenv').config();
const mongoose = require('mongoose');
const Incident = require('./models/Incident');

mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    await Incident.deleteMany({});
    console.log("✅ All old incidents have been successfully cleared from the database!");
    process.exit(0);
  })
  .catch(err => {
    console.error("❌ Error clearing incidents:", err);
    process.exit(1);
  });
