const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./src/models/User');
const TechnicianProfile = require('./src/models/TechnicianProfile');

dotenv.config();

const db = process.env.MONGO_URI;

console.log('Using URI:', db ? db.substring(0, 20) + '...' : 'UNDEFINED');

mongoose.connect(db)
    .then(async () => {
        console.log('DB connected successfully');

        const technicians = await TechnicianProfile.find().populate('user');
        console.log(`Found ${technicians.length} technician profiles`);

        technicians.forEach(t => {
            console.log(`- Tech: ${t.user?.name} (${t.user?.email})`);
            console.log(`  Reset Requested: ${t.user?.passwordResetRequested}`);
            console.log(`  Verification Status: ${t.documents?.verificationStatus}`);
        });

        const resetUsers = await User.find({ passwordResetRequested: true });
        console.log(`\nFound ${resetUsers.length} users with passwordResetRequested: true`);
        resetUsers.forEach(u => {
            console.log(`- User: ${u.name} (${u.email}), Role: ${u.role}`);
        });

        process.exit();
    })
    .catch(err => {
        console.error(err);
        process.exit(1);
    });
