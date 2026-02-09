// One-time script to create services for existing categories
const mongoose = require('mongoose');
const Category = require('./src/models/Category');
const Service = require('./src/models/Service');

require('dotenv').config({ path: './.env' });

async function createMissingServices() {
    try {
        await mongoose.connect(process.env.DATABASE);
        console.log('Connected to MongoDB');

        // Get all categories
        const categories = await Category.find({ isActive: true });
        console.log(`Found ${categories.length} categories`);

        // Get all existing services
        const services = await Service.find({});
        const serviceCategories = services.map(s => s.category);

        let createdCount = 0;

        for (const category of categories) {
            if (!serviceCategories.includes(category.name)) {
                console.log(`Creating service for category: ${category.name}`);
                
                await Service.create({
                    title: category.name,
                    description: category.description || `Professional ${category.name} service`,
                    category: category.name,
                    price: category.price || 0,
                    originalPrice: category.originalPrice,
                    headerImage: category.image,
                    isActive: category.isActive,
                });
                
                createdCount++;
                console.log(`✅ Created service for: ${category.name}`);
            } else {
                console.log(`⏭️  Service already exists for: ${category.name}`);
            }
        }

        console.log(`\n🎉 Created ${createdCount} new services`);
        process.exit(0);

    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

createMissingServices();