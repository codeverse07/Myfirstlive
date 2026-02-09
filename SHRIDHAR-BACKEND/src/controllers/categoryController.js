const Category = require('../models/Category');
const Service = require('../models/Service');
const AppError = require('../utils/AppError');

exports.getAllCategories = async (req, res, next) => {
    try {
        const categories = await Category.find({}).sort('order');
        console.log(`[DEBUG] CategoryController: Found ${categories.length} categories in DB`);

        // Find corresponding services for each category
        const categoryIds = categories.map(cat => cat._id);
        const services = await Service.find({
            category: { $in: categoryIds },
            isActive: true
        });

        // Merge service info into categories
        const categoriesWithServices = categories.map(category => {
            const service = services.find(s => s.category.toString() === category._id.toString());
            return {
                ...category.toObject(),
                serviceId: service?._id || null,
                hasService: !!service
            };
        });

        res.status(200).json({
            status: 'success',
            results: categoriesWithServices.length,
            data: {
                categories: categoriesWithServices
            }
        });
    } catch (err) {
        next(err);
    }
};

exports.createCategory = async (req, res, next) => {
    try {
        console.log('[DEBUG] createCategory Request Body:', req.body);

        let image = 'https://images.unsplash.com/photo-1581578731548-c64695cc6958'; // Default

        if (req.file) {
            image = req.file.path;
        } else if (req.body.image) {
            image = req.body.image;
        }

        const newCategory = await Category.create({
            ...req.body,
            image
        });

        console.log('[DEBUG] Category Created:', newCategory);

        // Socket Emission for Admin
        try {
            const socketService = require('../utils/socket');
            socketService.getIo().to('admin-room').emit('category:created', newCategory);
        } catch (err) {
            console.error('Socket emission failed:', err.message);
        }

        res.status(201).json({
            status: 'success',
            data: {
                category: newCategory
            }
        });
    } catch (err) {
        console.error('[DEBUG] createCategory Error:', err);
        next(err);
    }
};

exports.getCategory = async (req, res, next) => {
    try {
        const category = await Category.findById(req.params.id);

        if (!category) {
            return next(new AppError('No category found with that ID', 404));
        }

        res.status(200).json({
            status: 'success',
            data: {
                category
            }
        });
    } catch (err) {
        next(err);
    }
};

exports.updateCategory = async (req, res, next) => {
    try {
        if (req.file) {
            req.body.image = req.file.path;
        }

        const category = await Category.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });

        if (!category) {
            return next(new AppError('No category found with that ID', 404));
        }

        // Socket Emission for Admin
        try {
            const socketService = require('../utils/socket');
            socketService.getIo().to('admin-room').emit('category:updated', category);
        } catch (err) {
            console.error('Socket emission failed:', err.message);
        }

        res.status(200).json({
            status: 'success',
            data: {
                category
            }
        });
    } catch (err) {
        next(err);
    }
};

exports.deleteCategory = async (req, res, next) => {
    try {
        const category = await Category.findByIdAndDelete(req.params.id);

        if (!category) {
            return next(new AppError('No category found with that ID', 404));
        }

        // Socket Emission for Admin
        try {
            const socketService = require('../utils/socket');
            socketService.getIo().to('admin-room').emit('category:deleted', { id: req.params.id });
        } catch (err) {
            console.error('Socket emission failed:', err.message);
        }

        res.status(204).json({
            status: 'success',
            data: null
        });
    } catch (err) {
        next(err);
    }
};
