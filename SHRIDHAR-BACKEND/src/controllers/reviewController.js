const Review = require('../models/Review');
const Booking = require('../models/Booking');
const AppError = require('../utils/AppError');

const notificationService = require('../services/notificationService');

exports.createReview = async (req, res, next) => {
    try {
        const { rating, technicianRating, review } = req.body;
        const { bookingId } = req.params;

        // 1. Check if booking exists
        const booking = await Booking.findById(bookingId).populate('service').populate('category');
        if (!booking) {
            return next(new AppError('No booking found with that ID', 404));
        }

        // 2. Check if user is the customer
        if (booking.customer.toString() !== req.user.id) {
            return next(new AppError('You are not authorized to review this booking', 403));
        }

        // 3. Check if booking is COMPLETED
        if (booking.status !== 'COMPLETED') {
            return next(new AppError('You can only review completed bookings', 400));
        }

        // 4. Create Review
        const newReview = await Review.create({
            review,
            rating, // Service Rating
            technicianRating, // Technician Rating
            booking: bookingId,
            customer: req.user.id,
            technician: booking.technician,
            category: booking.category?.name || booking.category?.toString() || 'General',
            service: booking.service?._id || booking.service || bookingId // Fallback to bookingId if service is missing in DB
        });

        // 5. Notify Technician
        await notificationService.send({
            recipient: booking.technician,
            type: 'NEW_REVIEW',
            title: 'New Review Received! ⭐',
            message: `You received a ${rating}-star review: "${review.substring(0, 50)}${review.length > 50 ? '...' : ''}"`,
            data: {
                reviewId: newReview._id,
                bookingId: booking._id,
                rating
            }
        });

        // Socket Emission for Admin
        try {
            const socketService = require('../utils/socket');
            socketService.getIo().to('admin-room').emit('review:created', newReview);
        } catch (err) {
            console.error('Socket emission failed:', err.message);
        }

        res.status(201).json({
            status: 'success',
            data: { review: newReview }
        });

    } catch (err) {
        // Handle Duplicate Review (Unique Index)
        if (err.code === 11000) {
            return next(new AppError('You have already reviewed this booking', 400));
        }
        next(err);
    }
};

exports.getTechnicianReviews = async (req, res, next) => {
    try {
        const reviews = await Review.find({ technician: req.params.technicianId })
            .populate('customer', 'name profilePhoto')
            .sort('-createdAt');

        res.status(200).json({
            status: 'success',
            results: reviews.length,
            data: { reviews }
        });
    } catch (err) {
        next(err);
    }
};

exports.getAllReviews = async (req, res, next) => {
    try {
        const reviews = await Review.find()
            .populate('customer', 'name profilePhoto')
            .populate('technician', 'name')
            .populate('booking', 'status scheduledAt')
            .sort('-createdAt');

        res.status(200).json({
            status: 'success',
            results: reviews.length,
            data: { reviews }
        });
    } catch (err) {
        next(err);
    }
};

exports.updateReview = async (req, res, next) => {
    try {
        const { rating, technicianRating, review } = req.body;

        // 1. Find review belonging to this booking
        const existingReview = await Review.findOne({ booking: req.params.bookingId });

        if (!existingReview) {
            return next(new AppError('No review found for this booking', 404));
        }

        // 2. Ensure current user is the author
        if (existingReview.customer.toString() !== req.user.id) {
            return next(new AppError('You update only your own reviews', 403));
        }

        // 3. Update fields
        if (rating) existingReview.rating = rating;
        if (technicianRating) existingReview.technicianRating = technicianRating;
        if (review) existingReview.review = review;

        // 4. Save (Triggers static calcAverageRatings via post-save hook)
        await existingReview.save();

        // Socket Emission for Admin
        try {
            const socketService = require('../utils/socket');
            socketService.getIo().to('admin-room').emit('review:updated', existingReview);
        } catch (err) {
            console.error('Socket emission failed:', err.message);
        }

        res.status(200).json({
            status: 'success',
            data: { review: existingReview }
        });
    } catch (err) {
        next(err);
    }
};

exports.deleteReview = async (req, res, next) => {
    try {
        const review = await Review.findByIdAndDelete(req.params.id);

        if (!review) {
            return next(new AppError('No review found with that ID', 404));
        }

        // Socket Emission for Admin
        try {
            const socketService = require('../utils/socket');
            socketService.getIo().to('admin-room').emit('review:deleted', { id: req.params.id });
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
