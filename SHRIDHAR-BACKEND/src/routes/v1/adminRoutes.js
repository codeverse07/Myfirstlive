const express = require('express');
const adminController = require('../../controllers/adminController');
const { protect, restrictTo } = require('../../middlewares/auth');

const router = express.Router();

// CRITICAL: All admin routes are protected and restricted to ADMIN strictly
router.use(protect);
router.use(restrictTo('ADMIN'));

router.get('/dashboard-stats', adminController.getDashboardStats);

// --- USER MANAGEMENT ---
router.get('/users', adminController.getAllUsers);
router.patch('/users/:id/status', adminController.toggleUserStatus); // Body: { isActive: boolean }

// --- TECHNICIAN MANAGEMENT ---
router.get('/technicians', adminController.getAllTechnicians);
router.post('/technicians', require('../../middlewares/upload').single('agreement'), adminController.createTechnician);
router.patch('/technicians/:id/approve', adminController.approveTechnician);
router.patch('/technicians/:id/reject', adminController.rejectTechnician);
router.patch('/technicians/:id/profile', require('../../middlewares/upload').single('profilePhoto'), adminController.updateTechnicianProfile);
router.patch('/technicians/:id/reset-password', adminController.fulfillPasswordReset);
router.delete('/technicians/:id', adminController.deleteTechnician);



// --- SERVICE MANAGEMENT ---
router.get('/services', adminController.getAllServices);
router.patch('/services/:id/status', adminController.toggleServiceStatus);

// --- BOOKING MANAGEMENT ---
router.get('/bookings', adminController.getAllBookings);
router.patch('/bookings/:id/cancel', adminController.cancelBooking);
router.patch('/bookings/:id/assign', adminController.assignTechnician); // Body: { technicianId: string }

// --- GLOBAL SETTINGS ---
router.get('/settings', adminController.getSettings);
router.patch('/settings', adminController.updateSettings);

// --- REVIEW MODERATION ---
router.delete('/reviews/:id', adminController.deleteReview);

// Placeholder for future modules
// router.use('/users', userModRoutes);

module.exports = router;
