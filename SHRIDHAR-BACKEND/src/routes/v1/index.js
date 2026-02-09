const express = require('express');
const router = express.Router();

const authRoutes = require('./authRoutes');
const userRoutes = require('./userRoutes');
const technicianRoutes = require('./technicianRoutes');
const serviceRoutes = require('./serviceRoutes');
const bookingRoutes = require('./bookingRoutes');
const notificationRoutes = require('./notificationRoutes');
const adminRoutes = require('./adminRoutes');
const categoryRoutes = require('./categoryRoutes');
const aiRoutes = require('./aiRoutes');
const adminController = require('../../controllers/adminController');
const reasonRoutes = require('./reasonRoutes'); // Added reasonRoutes

router.get('/health', (req, res) => {
    res.status(200).json({ status: 'OK', message: 'Server is healthy' });
});

router.get('/maintenance-status', adminController.getSettings);

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/technicians', technicianRoutes);
router.use('/services', serviceRoutes);
router.use('/bookings', bookingRoutes);
router.use('/categories', categoryRoutes);
router.use('/reviews', require('./reviewRoutes'));
router.use('/ai', aiRoutes);
router.use('/reasons', reasonRoutes); // Added reasons route

// --- ENABLED ENDPOINTS ---
router.use('/notifications', notificationRoutes);
router.use('/admin', adminRoutes);
router.use('/feedbacks', require('./feedbackRoutes'));
router.use('/payments', require('./paymentRoutes'));
router.use('/settings', require('./settingsRoutes')); // Added public settings route
router.use('/heroes', require('./heroRoutes'));

module.exports = router;
