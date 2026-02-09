const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const User = require(path.join(__dirname, 'src', 'models', 'User'));

dotenv.config();

const checkUser = async () => {
    try {
        console.log('Connecting to DB...');
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected.');

        const user = await User.findOne({ email: 'owner@reservice.com' });
        if (user) {
            console.log('User Found:');
            console.log('ID:', user._id);
            console.log('Name:', user.name);
            console.log('Email:', user.email);
            console.log('Role:', user.role);
            // We cannot see the password as it is hashed, but we can verify role.
        } else {
            console.log('User owner@reservice.com NOT found in database.');
        }
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

checkUser();
