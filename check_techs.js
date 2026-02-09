const mongoose = require('mongoose');
require('dotenv').config({ path: 'SHRIDHAR-BACKEND/.env' });

const checkTechs = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const techs = await mongoose.connection.db.collection('users').find({ role: 'TECHNICIAN' }).toArray();
        console.log('Technicians found:', techs.map(t => ({ name: t.name, role: t.role, email: t.email })));
        process.exit(0);
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
};

checkTechs();
