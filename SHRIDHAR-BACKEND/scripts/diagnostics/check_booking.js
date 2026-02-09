const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Booking = require('./src/models/Booking');

dotenv.config();

const checkBooking = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const b = await Booking.findById('698742ba2322a3d97b51065d').lean();
        console.log(JSON.stringify(b, null, 2));
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

checkBooking();
