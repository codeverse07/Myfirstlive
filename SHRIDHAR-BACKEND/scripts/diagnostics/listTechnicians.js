const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const User = require(path.join(__dirname, 'src', 'models', 'User'));

dotenv.config();

const listTechnicians = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const technicians = await User.find({ role: 'TECHNICIAN' }).select('name email phone');

        if (technicians.length === 0) {
            console.log('No technicians found in the database.');
        } else {
            console.log('--- Registered Technicians ---');
            technicians.forEach(t => {
                console.log(`Name: ${t.name} | Email: ${t.email}`);
            });
            console.log('------------------------------');
            console.log('Note: Passwords are hashed and cannot be retrieved.');
        }
        process.exit(0);
    } catch (error) {
        console.error('Error fetching technicians:', error);
        process.exit(1);
    }
};

listTechnicians();
