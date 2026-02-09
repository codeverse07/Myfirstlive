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
        required: [true, 'Service rating is required']
    },
    technicianRating: {
        type: Number,
        min: 1,
        max: 5,
        required: [true, 'Technician rating is required']
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
    },
    service: {
        type: mongoose.Schema.ObjectId,
        ref: 'Service',
        required: [true, 'Review must belong to a service.']
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
                avgRating: { $avg: '$technicianRating' }
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
                avgRating: { $avg: '$technicianRating' }
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
                reviewCount: stats[0].nRating,
                totalJobs: stats[0].nRating, // Keeping for backward compatibility if used elsewhere as review count
                categoryRatings: categoryRatings
            }
        );
    } else {
        await TechnicianProfile.findOneAndUpdate(
            { user: technicianUserId },
            {
                avgRating: 0,
                reviewCount: 0,
                totalJobs: 0,
                categoryRatings: []
            }
        );
    }
    // 3. Update Service-Specific Rating (New Feature)
    // We also need to aggregate by service to update the Service document
    if (this.service) { // Ensure current review instance has service ID or pass it
        // Note: 'this' in static method does not have instance fields.
        // We need the service ID. In post save, we have it.
        // But here we rely on the match stage.
        // Let's change the strategy: aggregation should group by service if possible,
        // OR we run a separate aggregation for the specific service ID if provided.
    }
};

reviewSchema.statics.calcServiceRating = async function (serviceId) {
    const stats = await this.aggregate([
        {
            $match: { service: serviceId }
        },
        {
            $group: {
                _id: '$service',
                nRating: { $sum: 1 },
                avgRating: { $avg: '$rating' }
            }
        }
    ]);

    const Service = require('./Service');
    if (stats.length > 0) {
        const updatedService = await Service.findByIdAndUpdate(serviceId, {
            rating: Math.round(stats[0].avgRating * 10) / 10,
            reviewCount: stats[0].nRating
        }, { new: true });

        // Emit socket event for real-time rating update
        try {
            const socketService = require('../utils/socket');
            socketService.getIo().emit('service:updated', updatedService);
        } catch (err) {
            console.error('Socket emission failed in calcServiceRating:', err.message);
        }
    } else {
        const updatedService = await Service.findByIdAndUpdate(serviceId, {
            rating: 0,
            reviewCount: 0
        }, { new: true });

        try {
            const socketService = require('../utils/socket');
            socketService.getIo().emit('service:updated', updatedService);
        } catch (err) {
            console.error('Socket emission failed in calcServiceRating:', err.message);
        }
    }
};

// findOneAnd is used for findOneAndDelete
reviewSchema.post(/^findOneAnd/, async function (doc) {
    if (doc) {
        await doc.constructor.calcAverageRatings(doc.technician);
        if (doc.service) await doc.constructor.calcServiceRating(doc.service);
    }
});

reviewSchema.post('save', function () {
    // this points to current review
    this.constructor.calcAverageRatings(this.technician);
    if (this.service) this.constructor.calcServiceRating(this.service);
});

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;
