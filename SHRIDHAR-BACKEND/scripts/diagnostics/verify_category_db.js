const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Category = require('./src/models/Category');

// Load environment variables
dotenv.config();

const verifyCategoryCreation = async () => {
    try {
        console.log('Connecting to:', process.env.MONGO_URI);
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB');

        const testCategoryName = `Test Category ${Date.now()}`;
        console.log(`Creating category: ${testCategoryName}`);

        const newCategory = await Category.create({
            name: testCategoryName,
            description: 'This is a test category created via script',
            price: 500,
            image: 'https://via.placeholder.com/150'
        });

        console.log('✅ Category Created Successfully via Mongoose:');
        console.log(newCategory);

        // Verify by finding it
        const foundCategory = await Category.findById(newCategory._id);
        if (foundCategory) {
            console.log('✅ Verification: Category found in DB!');
        } else {
            console.error('❌ Verification: Category NOT found in DB!');
        }

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await mongoose.disconnect();
        console.log('🔌 Disconnected from MongoDB');
    }
};

verifyCategoryCreation();
