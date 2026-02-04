const User = require('../models/User');
const TechnicianProfile = require('../models/TechnicianProfile');
const Service = require('../models/Service');
const Booking = require('../models/Booking');
const Review = require('../models/Review');
const Settings = require('../models/Settings');
const AppError = require('../utils/AppError');
const adminService = require('../services/adminService');

exports.getDashboardStats = async (req, res, next) => {
    try {
        // Run aggregation queries in parallel for performance
        const [
            totalUsers,
            totalTechnicians,
            activeTechnicians,
            totalServices,
            totalBookings,
            pendingApprovals,
            todaysBookings
        ] = await Promise.all([
            User.countDocuments({ role: 'USER' }), // Only count regular users? Or all? Let's count regular users.
            User.countDocuments({ role: 'TECHNICIAN' }),
            TechnicianProfile.countDocuments({ isOnline: true }),
            Service.countDocuments(),
            Booking.countDocuments(),
            TechnicianProfile.countDocuments({ 'documents.verificationStatus': 'PENDING' }),
            Booking.countDocuments({
                scheduledAt: {
                    $gte: new Date(new Date().setHours(0, 0, 0, 0)),
                    $lt: new Date(new Date().setHours(23, 59, 59, 999))
                }
            })
        ]);

        res.status(200).json({
            status: 'success',
            data: {
                totalUsers,
                totalTechnicians,
                activeTechnicians,
                totalServices,
                totalBookings,
                pendingApprovals,
                todaysBookings
            }
        });

    } catch (error) {
        next(error);
    }
};

exports.getAllTechnicians = async (req, res, next) => {
    try {
        const { status, limit, page } = req.query;
        const filter = {};

        if (status) {
            filter['documents.verificationStatus'] = status.toUpperCase();
        }

        const technicians = await TechnicianProfile.find(filter)
            .populate('user', 'name email phone isActive') // Important: See user details
            .sort('-createdAt'); // Newest first

        res.status(200).json({
            status: 'success',
            results: technicians.length,
            data: { technicians }
        });
    } catch (error) {
        next(error);
    }
};

exports.approveTechnician = async (req, res, next) => {
    try {
        const technician = await TechnicianProfile.findById(req.params.id);
        if (!technician) return next(new AppError('Technician not found', 404));

        technician.documents.verificationStatus = 'VERIFIED';
        await technician.save();

        // LOG ACTION
        await adminService.logAction({
            adminId: req.user.id,
            action: 'TECHNICIAN_APPROVE',
            targetType: 'TechnicianProfile',
            targetId: technician._id,
            details: { previousStatus: 'PENDING' }
        });

        res.status(200).json({ status: 'success', data: { technician } });
    } catch (error) {
        next(error);
    }
};

exports.rejectTechnician = async (req, res, next) => {
    try {
        const technician = await TechnicianProfile.findById(req.params.id);
        if (!technician) return next(new AppError('Technician not found', 404));

        technician.documents.verificationStatus = 'REJECTED';
        // technician.isOnline = false; // Force offline? Yes.
        await technician.save();

        // LOG ACTION
        await adminService.logAction({
            adminId: req.user.id,
            action: 'TECHNICIAN_REJECT',
            targetType: 'TechnicianProfile',
            targetId: technician._id
        });

        res.status(200).json({ status: 'success', data: { technician } });
    } catch (error) {
        next(error);
    }
};

exports.getAllUsers = async (req, res, next) => {
    try {
        const { role, isActive, search } = req.query;
        const filter = {};

        if (role) filter.role = role.toUpperCase();
        if (isActive !== undefined) filter.isActive = isActive === 'true';

        if (search) {
            filter.$or = [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } }
            ];
        }

        const users = await User.find(filter).select('-password');

        res.status(200).json({
            status: 'success',
            results: users.length,
            data: { users }
        });
    } catch (error) {
        next(error);
    }
};

exports.toggleUserStatus = async (req, res, next) => {
    try {
        const { isActive } = req.body; // Expect boolean
        const user = await User.findById(req.params.id);

        if (!user) return next(new AppError('User not found', 404));

        // Prevent disabling yourself (Admin)
        if (user._id.toString() === req.user.id) {
            return next(new AppError('You cannot disable your own admin account', 400));
        }

        user.isActive = isActive;
        await user.save({ validateBeforeSave: false }); // Skip validation just in case

        // LOG ACTION
        await adminService.logAction({
            adminId: req.user.id,
            action: isActive ? 'USER_ENABLE' : 'USER_DISABLE',
            targetType: 'User',
            targetId: user._id
        });

        res.status(200).json({ status: 'success', data: { user } });
    } catch (error) {
        next(error);
    }
};

exports.getAllServices = async (req, res, next) => {
    try {
        const { isActive, category, search } = req.query;
        const filter = {};

        if (isActive !== undefined) filter.isActive = isActive === 'true';
        if (category) filter.category = category;

        if (search) {
            filter.title = { $regex: search, $options: 'i' };
        }

        const services = await Service.find(filter)
            .populate('technician', 'name email')
            .sort('-createdAt');

        res.status(200).json({
            status: 'success',
            results: services.length,
            data: { services }
        });
    } catch (error) {
        next(error);
    }
};

exports.toggleServiceStatus = async (req, res, next) => {
    try {
        const { isActive } = req.body; // Expect boolean
        const service = await Service.findById(req.params.id);

        if (!service) return next(new AppError('Service not found', 404));

        service.isActive = isActive;
        await service.save();

        // LOG ACTION
        await adminService.logAction({
            adminId: req.user.id,
            action: 'SERVICE_TOGGLE',
            targetType: 'Service',
            targetId: service._id,
            details: { newStatus: isActive }
        });

        res.status(200).json({ status: 'success', data: { service } });
    } catch (error) {
        next(error);
    }
};

exports.getAllBookings = async (req, res, next) => {
    try {
        const { status, limit, page } = req.query;
        const filter = {};

        if (status) filter.status = status.toUpperCase();

        const bookings = await Booking.find(filter)
            .populate('customer', 'name email')
            .populate('technician', 'name email phone')
            .populate('service', 'title price')
            .sort('-createdAt');

        res.status(200).json({
            status: 'success',
            results: bookings.length,
            data: { bookings }
        });
    } catch (error) {
        next(error);
    }
};

exports.cancelBooking = async (req, res, next) => {
    try {
        const booking = await Booking.findById(req.params.id);

        if (!booking) return next(new AppError('Booking not found', 404));

        if (booking.status === 'CANCELLED' || booking.status === 'COMPLETED') {
            return next(new AppError(`Cannot cancel a booking that is already ${booking.status}`, 400));
        }

        const previousStatus = booking.status;
        booking.status = 'CANCELLED';
        await booking.save({ validateBeforeSave: false });

        // LOG ACTION
        await adminService.logAction({
            adminId: req.user.id,
            action: 'BOOKING_CANCEL',
            targetType: 'Booking',
            targetId: booking._id,
            details: { previousStatus, reason: 'Admin Force Cancel' }
        });

        res.status(200).json({ status: 'success', data: { booking } });
    } catch (error) {
        next(error);
    }
};

// --- GLOBAL SETTINGS ---
exports.getSettings = async (req, res, next) => {
    try {
        let settings = await Settings.findOne({ isGlobal: true });

        if (!settings) {
            settings = await Settings.create({ isGlobal: true });
        }

        res.status(200).json({
            status: 'success',
            data: { settings }
        });
    } catch (error) {
        next(error);
    }
};

exports.updateSettings = async (req, res, next) => {
    try {
        const settings = await Settings.findOneAndUpdate(
            { isGlobal: true },
            req.body,
            { new: true, runValidators: true, upsert: true }
        );

        // LOG ACTION
        await adminService.logAction({
            adminId: req.user.id,
            action: 'SETTINGS_UPDATE',
            targetType: 'Settings',
            targetId: settings._id,
            details: req.body
        });

        res.status(200).json({
            status: 'success',
            data: { settings }
        });
    } catch (error) {
        next(error);
    }
};

// --- REVIEW MODERATION ---
exports.deleteReview = async (req, res, next) => {
    try {
        const review = await Review.findByIdAndDelete(req.params.id);

        if (!review) {
            return next(new AppError('No review found with that ID', 404));
        }

        // Ratings are recalculated automatically via Review.js post middleware

        // LOG ACTION
        await adminService.logAction({
            adminId: req.user.id,
            action: 'REVIEW_DELETE',
            targetType: 'Review',
            targetId: req.params.id,
            details: { technicianId: review.technician }
        });

        res.status(204).json({
            status: 'success',
            data: null
        });
    } catch (error) {
        next(error);
    }
};

