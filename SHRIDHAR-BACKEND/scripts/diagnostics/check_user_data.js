const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./src/models/User');
const Booking = require('./src/models/Booking');
const Service = require('./src/models/Service');
const Category = require('./src/models/Category');

dotenv.config();

const checkData = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('DB Connected');

        const user = await User.findOne({ email: 'user@reservice.com' });
        if (!user) {
            console.log('User not found');
            process.exit(0);
        }

        console.log('User ID:', user._id);

        const bookings = await Booking.find({ customer: user._id }).populate('service').populate('category');
        console.log('Bookings count:', bookings.length);

        bookings.forEach(b => {
            console.log(`ID: ${b._id}, Status: ${b.status}, Service: ${b.service?.title}, Category: ${b.category?.name || b.category}`);
        });

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

checkData();
