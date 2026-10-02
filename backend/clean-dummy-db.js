const mongoose = require('mongoose');
require('dotenv').config();
const Incident = require('./models/Incident');

mongoose.connect(process.env.MONGO_URI)
.then(async () => {
  console.log('✅ Connected to MongoDB to clean dummy incidents');
  try {
    const res = await Incident.deleteMany({ id: { $in: ["INC-2024-0047", "INC-2024-0046", "INC-2024-0045", "INC-2024-0044", "INC-2024-0043", "INC-2024-0042"] } });
    console.log(`Deleted ${res.deletedCount} dummy incidents.`);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
});
