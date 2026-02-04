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
