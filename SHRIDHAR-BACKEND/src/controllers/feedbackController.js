const Feedback = require('../models/Feedback');
const AppError = require('../utils/AppError');

exports.createFeedback = async (req, res, next) => {
    try {
        // If it's a category request, ensure requestedCategoryName is present if category is 'Category Request'
        if (req.body.category === 'Category Request' && !req.body.requestedCategoryName) {
            return next(new AppError('Please specify the category name you want to request.', 400));
        }

        const newFeedback = await Feedback.create({
            user: req.user.id,
            category: req.body.category,
            message: req.body.message,
            requestedCategoryName: req.body.requestedCategoryName
        });

        // Socket Emission for Admin
        try {
            const socketService = require('../utils/socket');
            socketService.getIo().to('admin-room').emit('feedback:created', newFeedback);
        } catch (err) {
            console.error('Socket emission failed:', err.message);
        }

        res.status(201).json({
            status: 'success',
            data: {
                feedback: newFeedback
            }
        });
    } catch (err) {
        next(err);
    }
};

exports.getAllFeedback = async (req, res, next) => {
    try {
        const feedbacks = await Feedback.find()
            .populate({
                path: 'user',
                select: 'name email phone profilePhoto role'
            })
            .sort('-createdAt');

        res.status(200).json({
            status: 'success',
            results: feedbacks.length,
            data: {
                feedbacks
            }
        });
    } catch (err) {
        next(err);
    }
};

exports.updateFeedbackStatus = async (req, res, next) => {
    try {
        const feedback = await Feedback.findByIdAndUpdate(req.params.id, {
            status: req.body.status
        }, {
            new: true,
            runValidators: true
        });

        if (!feedback) {
            return next(new AppError('No feedback found with that ID', 404));
        }

        // Socket Emission for Admin
        try {
            const socketService = require('../utils/socket');
            socketService.getIo().to('admin-room').emit('feedback:updated', feedback);
        } catch (err) {
            console.error('Socket emission failed:', err.message);
        }

        res.status(200).json({
            status: 'success',
            data: {
                feedback
            }
        });
    } catch (err) {
        next(err);
    }
};

exports.deleteFeedback = async (req, res, next) => {
    try {
        const feedback = await Feedback.findByIdAndDelete(req.params.id);

        if (!feedback) {
            return next(new AppError('No feedback found with that ID', 404));
        }

        // Socket Emission for Admin
        try {
            const socketService = require('../utils/socket');
            socketService.getIo().to('admin-room').emit('feedback:deleted', { id: req.params.id });
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
