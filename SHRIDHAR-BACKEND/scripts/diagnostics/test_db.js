const mongoose = require('mongoose');
require('dotenv').config({ path: 'SHRIDHAR-BACKEND/.env' });

const testDb = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB connection successful');
        const categories = await mongoose.connection.db.collection('categories').countDocuments();
        console.log('Categories count:', categories);
        process.exit(0);
    } catch (err) {
        console.error('MongoDB connection error:', err);
        process.exit(1);
    }
};

testDb();
