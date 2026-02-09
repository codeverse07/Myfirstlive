const mongoose = require('mongoose');

const technicianProfileSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Technician profile must belong to a user.'],
        unique: true
    },
    profilePhoto: {
        type: String,
        default: 'default.jpg'
    },
    employeeId: {
        type: String,
        unique: true,
        sparse: true,
        trim: true,
        set: v => v === "" ? undefined : v
    },
    bio: {
        type: String,
        maxlength: [500, 'Bio cannot be more than 500 characters']
    },
    skills: [{
        type: String,
        trim: true
    }],
    categories: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category'
    }],
    services: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Service'
    }],
    status: {
        type: String,
        enum: ['ONLINE', 'OFFLINE', 'BUSY'],
        default: 'OFFLINE'
    },
    isOnline: {
        type: Boolean,
        default: false
    },
    avgRating: {
        type: Number,
        default: 0,
        min: [0, 'Rating must be above 0'],
        max: [5, 'Rating must be below 5.0'],
        set: val => Math.round(val * 10) / 10
    },
    totalJobs: {
        type: Number,
        default: 0
    },
    reviewCount: {
        type: Number,
        default: 0
    },
    categoryRatings: [{
        category: String,
        avgRating: Number,
        count: Number
    }],
    location: {
        // GeoJSON for future location features
        type: {
            type: String,
            default: 'Point',
            enum: ['Point']
        },
        coordinates: [Number],
        address: String
    },
    documents: {
        aadharCard: String,
        panCard: String,
        resume: String,
        agreement: String,
        verificationStatus: {
            type: String,
            enum: ['PENDING', 'VERIFIED', 'REJECTED'],
            default: 'PENDING'
        }
    },
    isProfileCompleted: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

technicianProfileSchema.index({ skills: 1 });
technicianProfileSchema.index({ isOnline: 1 });
// technicianProfileSchema.index({ user: 1 }); // Already indexed by unique: true

const TechnicianProfile = mongoose.model('TechnicianProfile', technicianProfileSchema);

module.exports = TechnicianProfile;
