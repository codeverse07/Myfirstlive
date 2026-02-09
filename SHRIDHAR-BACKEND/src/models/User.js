const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please tell us your name!'],
        trim: true
    },
    email: {
        type: String,
        required: [true, 'Please provide your email'],
        unique: true,
        lowercase: true,
        trim: true,
        match: [
            /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
            'Please provide a valid email address'
        ]
    },
    googleId: {
        type: String,
        unique: true,
        sparse: true,
        select: false
    },
    password: {
        type: String,
        required: [function () { return !this.googleId; }, 'Please provide a password'],
        minlength: 8,
        select: false
    },
    role: {
        type: String,
        enum: ['USER', 'TECHNICIAN', 'ADMIN'],
        default: 'USER'
    },
    profilePhoto: {
        type: String,
        default: 'default.jpg'
    },
    phone: {
        type: String,
        trim: true
    },
    address: {
        type: String,
        trim: true
    },
    pincode: {
        type: String,
        trim: true,
        maxlength: 6
    },
    location: {
        // GeoJSON
        type: {
            type: String,
            default: 'Point',
            enum: ['Point']
        },
        coordinates: {
            type: [Number],
            default: [0, 0]
        },
        address: String,
        description: String
    },
    status: {
        type: String,
        enum: ['ACTIVE', 'INACTIVE', 'SUSPENDED'],
        default: 'ACTIVE'
    },
    isActive: {
        type: Boolean,
        default: true
    },
    isTechnicianOnboarded: {
        type: Boolean,
        default: false
    },
    isOnline: {
        type: Boolean,
        default: false
    },
    passwordResetRequested: {
        type: Boolean,
        default: false
    },
    passwordResetRequestedAt: {
        type: Date
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
}, {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

userSchema.virtual('technicianProfile', {
    ref: 'TechnicianProfile',
    localField: '_id',
    foreignField: 'user',
    justOne: true
});

userSchema.virtual('services', {
    ref: 'Service',
    localField: '_id',
    foreignField: 'technician'
});

userSchema.index({ location: '2dsphere' });

// Encrypt password before save
userSchema.pre('save', async function () {
    if (!this.isModified('password')) return;

    this.password = await bcrypt.hash(this.password, 12);
});

// Method to check password
userSchema.methods.correctPassword = async function (candidatePassword, userPassword) {
    return await bcrypt.compare(candidatePassword, userPassword);
};

const User = mongoose.model('User', userSchema);

module.exports = User;
