const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const User = require(path.join(__dirname, 'src', 'models', 'User'));

dotenv.config();

const resetPassword = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const email = 'technician@reservice.com';
        const newPassword = 'password123';

        const user = await User.findOne({ email });
        if (!user) {
            console.log(`User ${email} not found.`);
            // if not found, create one
            await User.create({
                name: 'Default Technician',
                email,
                password: newPassword,
                phone: '1234567890',
                role: 'TECHNICIAN',
                isTechnicianOnboarded: true
            });
            console.log(`Created new technician: ${email} with password: ${newPassword}`);
        } else {
            user.password = newPassword;
            await user.save();
            console.log(`Password reset for ${email} to: ${newPassword}`);
        }
        process.exit(0);
    } catch (error) {
        console.error('Error resetting password:', error);
        process.exit(1);
    }
};

resetPassword();
