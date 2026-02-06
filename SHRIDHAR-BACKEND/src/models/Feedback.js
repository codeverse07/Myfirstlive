const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: [true, 'Feedback must belong to a user.']
    },
    category: {
        type: String,
        required: [true, 'Please provide a category for your feedback.'],
        enum: ['General', 'Bug Report', 'Feature Request', 'Category Request', 'Technical Issue', 'Other', 'Improvements', 'New Service', 'Grievance'],
        default: 'General'
    },
    message: {
        type: String,
        required: [true, 'Please provide a message.']
    },
    requestedCategoryName: {
        type: String
    },
    status: {
        type: String,
        enum: ['PENDING', 'REVIEWED', 'RESOLVED', 'IGNORED'],
        default: 'PENDING'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
}, {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

const Feedback = mongoose.model('Feedback', feedbackSchema);

module.exports = Feedback;
