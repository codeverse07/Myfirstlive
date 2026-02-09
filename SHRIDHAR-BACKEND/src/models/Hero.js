const mongoose = require('mongoose');

const heroSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Title is required'],
        trim: true
    },
    subtitle: {
        type: String,
        trim: true
    },
    image: {
        type: String,
        required: [true, 'Image URL is required']
    },
    serviceId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Service',
        default: null
    },
    isActive: {
        type: Boolean,
        default: true
    },
    order: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true
});

const Hero = mongoose.model('Hero', heroSchema);

module.exports = Hero;
