const mongoose = require('mongoose');
const TechnicianProfile = require('./TechnicianProfile');

const reviewSchema = new mongoose.Schema({
    review: {
        type: String,
        required: [true, 'Review cannot be empty!']
    },
    rating: {
        type: Number,
        min: 1,
        max: 5,
        required: [true, 'Rating is required']
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    booking: {
        type: mongoose.Schema.ObjectId,
        ref: 'Booking',
        required: [true, 'Review must belong to a booking.'],
        unique: true // One review per booking
    },
    technician: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: [true, 'Review must belong to a technician.']
    },
    customer: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: [true, 'Review must belong to a customer.']
    },
    category: {
        type: String,
        required: [true, 'Review must belong to a category.']
    }
}, {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// reviewSchema.index({ booking: 1 }, { unique: true }); // Already indexed by unique: true in field definition
reviewSchema.index({ technician: 1 });

// Static method to calculate average rating
reviewSchema.statics.calcAverageRatings = async function (technicianUserId) {
    // 1. Calculate Overall Stats
    const stats = await this.aggregate([
        {
            $match: { technician: technicianUserId }
        },
        {
            $group: {
                _id: '$technician',
                nRating: { $sum: 1 },
                avgRating: { $avg: '$rating' }
            }
        }
    ]);

    // 2. Calculate Category-Specific Stats
    const categoryStats = await this.aggregate([
        {
            $match: { technician: technicianUserId }
        },
        {
            $group: {
                _id: '$category',
                nRating: { $sum: 1 },
                avgRating: { $avg: '$rating' }
            }
        }
    ]);

    // Format category ratings
    const categoryRatings = categoryStats.map(stat => ({
        category: stat._id,
        avgRating: Math.round(stat.avgRating * 10) / 10,
        count: stat.nRating
    }));

    if (stats.length > 0) {
        await TechnicianProfile.findOneAndUpdate(
            { user: technicianUserId },
            {
                avgRating: Math.round(stats[0].avgRating * 10) / 10,
                totalJobs: stats[0].nRating,
                categoryRatings: categoryRatings
            }
        );
    } else {
        await TechnicianProfile.findOneAndUpdate(
            { user: technicianUserId },
            {
                avgRating: 0, // Reset to 0 when no reviews
                totalJobs: 0,
                categoryRatings: []
            }
        );
    }
};

// findOneAnd is used for findOneAndDelete
reviewSchema.post(/^findOneAnd/, async function (doc) {
    if (doc) {
        await doc.constructor.calcAverageRatings(doc.technician);
    }
});

reviewSchema.post('save', function () {
    // this points to current review
    this.constructor.calcAverageRatings(this.technician);
});

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;
