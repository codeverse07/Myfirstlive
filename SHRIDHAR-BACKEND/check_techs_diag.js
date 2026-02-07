const mongoose = require('mongoose');
const TechnicianProfile = require('./src/models/TechnicianProfile');
const Category = require('./src/models/Category');
const User = require('./src/models/User');
require('dotenv').config();

async function check() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to DB');

        const techs = await TechnicianProfile.find().populate('user', 'name').populate('categories', 'name');
        console.log(`Found ${techs.length} technicians`);

        techs.forEach(t => {
            console.log(`Tech: ${t.user?.name || t.name} (${t._id})`);
            console.log(` - Categories: ${t.categories?.map(c => c.name).join(', ') || 'NONE'}`);
            console.log(` - Skills: ${t.skills?.join(', ') || 'NONE'}`);
            console.log('---');
        });

        const categories = await Category.find();
        console.log('Available Categories:');
        categories.forEach(c => console.log(` - ${c.name} (${c._id})`));

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

check();
