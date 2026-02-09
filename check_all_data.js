const mongoose = require('mongoose');
require('dotenv').config({ path: 'SHRIDHAR-BACKEND/.env' });

const checkData = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const cats = await mongoose.connection.db.collection('categories').find({}).toArray();
        const services = await mongoose.connection.db.collection('services').find({}).toArray();
        console.log('Categories:', cats.map(c => c.name));
        console.log('Services:', services.map(s => s.title));
        process.exit(0);
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
};

checkData();
