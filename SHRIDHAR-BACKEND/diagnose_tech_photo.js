const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const User = require(path.join(__dirname, 'src', 'models', 'User'));
const Booking = require(path.join(__dirname, 'src', 'models', 'Booking'));

dotenv.config();

const diagnose = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('--- USER DATA ---');
        const user = await User.findOne({ email: 'vansh@gmail.com' });
        if (user) {
            console.log('User ID:', user._id);
            console.log('Name:', user.name);
            console.log('profilePhoto:', user.profilePhoto);
        } else {
            console.log('User not found');
        }

        console.log('\n--- RECENT BOOKINGS FOR THIS TECH ---');
        if (user) {
            const bookings = await Booking.find({ technician: user._id })
                .sort('-createdAt')
                .limit(5)
                .populate('technician', 'name profilePhoto');

            bookings.forEach(b => {
                console.log('Booking ID:', b._id);
                console.log('Status:', b.status);
                console.log('Tech Name:', b.technician?.name);
                console.log('Tech profilePhoto:', b.technician?.profilePhoto);
                console.log('-----------------');
            });
        }

        await mongoose.connection.close();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

diagnose();
