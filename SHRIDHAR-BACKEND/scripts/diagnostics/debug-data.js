const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

const User = require('./src/models/User');
const TechnicianProfile = require('./src/models/TechnicianProfile');
const Service = require('./src/models/Service');
const Category = require('./src/models/Category');

const debugData = async () => {
    try {
        console.log('Connecting to DB...');
        if (!process.env.MONGO_URI) {
            throw new Error('MONGO_URI is undefined');
        }
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected.');

        const userCount = await User.countDocuments();
        const techCount = await TechnicianProfile.countDocuments();
        const serviceCount = await Service.countDocuments();
        const categoryCount = await Category.countDocuments();

        console.log('--- DB COUNTS ---');
        console.log(`Users: ${userCount}`);
        console.log(`Technicians: ${techCount}`);
        console.log(`Services: ${serviceCount}`);
        console.log(`Categories: ${categoryCount}`);

        const admin = await User.findOne({ role: 'ADMIN' });
        if (admin) {
            console.log('Admin found:', admin.email);
        } else {
            console.log('No Admin found!');
        }

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

debugData();
