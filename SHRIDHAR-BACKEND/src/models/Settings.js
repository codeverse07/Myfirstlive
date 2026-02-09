const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
    showWallet: {
        type: Boolean,
        default: false
    },
    showReferralBanner: {
        type: Boolean,
        default: false
    },
    maintenanceMode: {
        type: Boolean,
        default: false
    },
    maintenanceMessage: {
        type: String,
        default: 'Our server is currently undergoing maintenance. We will be back soon!'
    },
    maintenanceEndTime: {
        type: Date,
        default: null
    },
    serviceablePincodes: {
        type: [String],
        default: ['845438'] // Default Pincode
    },
    // Singleton pattern enforcement
    isGlobal: {
        type: Boolean,
        default: true,
        unique: true
    }
}, {
    timestamps: true
});

const Settings = mongoose.model('Settings', settingsSchema);

module.exports = Settings;
