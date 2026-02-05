const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');

// Load env
dotenv.config();

const Category = require('./src/models/Category');

async function checkCategories() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const categories = await Category.find({});
        console.log('--- CATEGORIES IN DB ---');
        console.log(JSON.stringify(categories, null, 2));
        console.log('------------------------');
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkCategories();
