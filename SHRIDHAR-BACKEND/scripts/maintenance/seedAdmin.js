const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const User = require(path.join(__dirname, 'src', 'models', 'User'));

dotenv.config();

const seedAdmin = async () => {
    try {
        console.log('Attempting to connect to DB...');
        if (!process.env.MONGO_URI) {
            throw new Error('MONGODB_URI is undefined in .env');
        }
        await mongoose.connect(process.env.MONGO_URI);
        console.log('DB Connected for Seeding...');

        const adminExists = await User.findOne({ role: 'ADMIN' });
        if (adminExists) {
            console.log('Admin already exists:', adminExists.email);
            process.exit(0);
        }

        const admin = await User.create({
            name: 'Super Admin',
                email: 'admin@shridhar.com',
                password: 'adminpassword123',
            role: 'ADMIN',
            phone: '0000000000',
            isTechnicianOnboarded: true
        });

        console.log('Admin Created Successfully!');
        console.log('Email: admin@shridhar.com');
        console.log('Password: adminpassword123');
        process.exit(0);
    } catch (error) {
        console.error('Error seeding admin:', error);
        process.exit(1);
    }
};

seedAdmin();
