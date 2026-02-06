const Category = require('../models/Category');
const AppError = require('../utils/AppError');

exports.getAllCategories = async (req, res, next) => {
    try {
        // Add caching headers for categories (they change rarely)
        res.set({
            'Cache-Control': 'public, max-age=1800', // 30 minutes cache
            'ETag': Date.now().toString(),
        });

        const categories = await Category.find({ isActive: true }).sort('order');

        res.status(200).json({
            status: 'success',
            results: categories.length,
            data: {
                categories
            }
        });
    } catch (err) {
        next(err);
    }
};

exports.createCategory = async (req, res, next) => {
    try {
        const newCategory = await Category.create(req.body);

        res.status(201).json({
            status: 'success',
            data: {
                category: newCategory
            }
        });
    } catch (err) {
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
        const category = await Category.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });

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

exports.deleteCategory = async (req, res, next) => {
    try {
        const category = await Category.findByIdAndDelete(req.params.id);

        if (!category) {
            return next(new AppError('No category found with that ID', 404));
        }

        res.status(204).json({
            status: 'success',
            data: null
        });
    } catch (err) {
        next(err);
    }
};
