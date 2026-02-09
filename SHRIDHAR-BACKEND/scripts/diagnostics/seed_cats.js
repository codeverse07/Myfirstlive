const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

const Category = require('./src/models/Category');

const defaultCategories = [
    { name: 'Cleaning', icon: 'Sparkles', color: 'bg-blue-100 text-blue-600', order: 1 },
    { name: 'Plumbing', icon: 'Droplets', color: 'bg-indigo-100 text-indigo-600', order: 2 },
    { name: 'Electrician', icon: 'Zap', color: 'bg-yellow-100 text-yellow-600', order: 3 },
    { name: 'Carpentry', icon: 'Hammer', color: 'bg-orange-100 text-orange-600', order: 4 },
    { name: 'Salon', icon: 'Scissors', color: 'bg-pink-100 text-pink-600', order: 5 },
    { name: 'Appliance Repair', icon: 'Wrench', color: 'bg-red-100 text-red-600', order: 6 },
    { name: 'Pest Control', icon: 'Bug', color: 'bg-emerald-100 text-emerald-600', order: 7 },
    { name: 'Shifting', icon: 'Truck', color: 'bg-slate-100 text-slate-600', order: 8 }
];

const seedCategories = async () => {
    try {
        console.log('Connecting to DB...');
        await mongoose.connect(process.env.MONGO_URI);

        console.log('Clearing existing categories...');
        await Category.deleteMany({});

        console.log('Seeding default categories...');
        await Category.insertMany(defaultCategories);

        console.log('Categories Seeded Successfully!');
        process.exit(0);
    } catch (error) {
        console.error('Error seeding categories:', error);
        process.exit(1);
    }
};

seedCategories();
