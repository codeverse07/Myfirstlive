const mongoose = require('mongoose');
const TechnicianProfile = require('./SHRIDHAR-BACKEND/src/models/TechnicianProfile');
const Category = require('./SHRIDHAR-BACKEND/src/models/Category');
require('dotenv').config({ path: './SHRIDHAR-BACKEND/.env' });

async function check() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to DB');

        const techs = await TechnicianProfile.find().populate('user', 'name').populate('categories', 'name');
        console.log(`Found ${techs.length} technicians`);

        techs.forEach(t => {
            console.log(`Tech: ${t.user?.name || t.name}`);
            console.log(` - Categories: ${t.categories?.map(c => c.name).join(', ') || 'NONE'}`);
            console.log(` - Skills: ${t.skills?.join(', ') || 'NONE'}`);
            console.log('---');
        });

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

check();
