const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const bcrypt = require('bcryptjs');

dotenv.config();

const User = require('./src/models/User');
const TechnicianProfile = require('./src/models/TechnicianProfile');
const Category = require('./src/models/Category');
const Service = require('./src/models/Service');
const Booking = require('./src/models/Booking');
const Review = require('./src/models/Review');
const Notification = require('./src/models/Notification');
const ActivityLog = require('./src/models/ActivityLog');
const Settings = require('./src/models/Settings');

const resetDB = async () => {
    try {
        console.log('Connecting to database...');
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB.');

        // 1. Flush all collections
        console.log('Flushing existing data...');
        const collections = await mongoose.connection.db.collections();
        for (let collection of collections) {
            await collection.deleteMany({});
            console.log(`Cleared collection: ${collection.collectionName}`);
        }

        // 2. Seed Admin
        console.log('Seeding Admin account...');
        await User.create({
            name: 'System Admin',
            email: 'admin@reservice.com',
            password: 'Admin@123',
            role: 'ADMIN',
            phone: '1234567890',
            isActive: true
        });

        // 3. Seed User
        console.log('Seeding User account...');
        await User.create({
            name: 'Regular User',
            email: 'user@reservice.com',
            password: 'User@123',
            role: 'USER',
            phone: '1122334455',
            isActive: true
        });

        // 4. Seed Technician
        console.log('Seeding Technician account...');
        const techUser = await User.create({
            name: 'Expert Technician',
            email: 'tech@reservice.com',
            password: 'Tech@123',
            role: 'TECHNICIAN',
            phone: '9988776655',
            isActive: true,
            isTechnicianOnboarded: true
        });

        // 5. Create Technician Profile
        console.log('Creating Technician Profile...');
        await TechnicianProfile.create({
            user: techUser._id,
            bio: 'Expert in all home repairs with 10 years of experience.',
            skills: ['Plumbing', 'Electrical'],
            isOnline: true,
            documents: {
                verificationStatus: 'VERIFIED'
            }
        });

        // 6. Seed a sample Category (Crucial for UI)
        console.log('Seeding sample Category...');
        await Category.create({
            name: 'AC Repair',
            description: 'Expert AC repair and maintenance services.',
            icon: 'Zap',
            image: 'https://images.unsplash.com/photo-1581092160562-40aa08e78837?auto=format&fit=crop&q=80&w=600',
            color: 'blue',
            isActive: true
        });

        // 7. Seed sample Settings
        console.log('Seeding default Settings...');
        await Settings.create({
            isGlobal: true,
            maintenanceMode: false
        });

        console.log('-----------------------------------');
        console.log('DATABASE RESET AND SEEDING COMPLETE');
        console.log('-----------------------------------');
        console.log('Admin: admin@reservice.com / Admin@123');
        console.log('User: user@reservice.com / User@123');
        console.log('Technician: tech@reservice.com / Tech@123');
        console.log('-----------------------------------');

        process.exit(0);
    } catch (error) {
        console.error('ERROR DURING RESET:', error);
        process.exit(1);
    }
};

resetDB();
