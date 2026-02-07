const User = require('../models/User');
const TechnicianProfile = require('../models/TechnicianProfile');
const Service = require('../models/Service');
const Booking = require('../models/Booking');
const Review = require('../models/Review');
const Settings = require('../models/Settings');

const AppError = require('../utils/AppError');
const adminService = require('../services/adminService');

exports.createTechnician = async (req, res, next) => {
    try {
        const { name, email, password, phone, bio, skills } = req.body;

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return next(new AppError('User with this email already exists', 400));
        }

        // Create user with TECHNICIAN role
        const user = await User.create({
            name,
            email,
            password,
            phone,
            role: 'TECHNICIAN',
            isTechnicianOnboarded: true
        });

        // Create technician profile
        const technicianProfile = await TechnicianProfile.create({
            user: user._id,
            bio: bio || '',
            skills: skills || [],
            documents: {
                verificationStatus: 'PENDING'
            }
        });

        // Populate user data in response
        await technicianProfile.populate('user', 'name email phone');

        res.status(201).json({
            status: 'success',
            data: {
                user,
                profile: technicianProfile
            }
        });
    } catch (error) {
        next(error);
    }
};

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
            todaysBookings,
            revenueResult
        ] = await Promise.all([
            User.countDocuments({ role: 'USER' }),
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
            }),
            Booking.aggregate([
                { $match: { status: 'COMPLETED' } },
                { $group: { _id: null, total: { $sum: { $ifNull: ['$finalAmount', '$price'] } } } }
            ])
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
                todaysBookings,
                totalRevenue: revenueResult[0]?.total || 0
            }
        });

    } catch (error) {
        next(error);
    }
};

exports.getAllTechnicians = async (req, res, next) => {
    try {
        const { status, limit, page, category } = req.query;
        const filter = {};

        if (status) {
            filter['documents.verificationStatus'] = status.toUpperCase();
        }

        if (req.query.isOnline !== undefined) {
            filter.isOnline = req.query.isOnline === 'true';
        }

        if (category) {
            // Find technicians who have this category in their list
            filter.categories = category;
        }

        // Pagination
        const pageNum = parseInt(page) || 1;
        const limitNum = parseInt(limit) || 10;
        const skip = (pageNum - 1) * limitNum;

        const technicians = await TechnicianProfile.find(filter)
            .populate('user', 'name email phone isActive') // Important: See user details
            .populate('categories', 'name') // Populate category names
            .sort('-createdAt')
            .skip(skip)
            .limit(limitNum);

        const total = await TechnicianProfile.countDocuments(filter);

        res.status(200).json({
            status: 'success',
            results: technicians.length,
            total,
            totalPages: Math.ceil(total / limitNum),
            currentPage: pageNum,
            data: { technicians }
        });
    } catch (error) {
        next(error);
    }
};

exports.approveTechnician = async (req, res, next) => {
    try {
        const { categoryIds } = req.body; // Expecting Array of Strings
        const technician = await TechnicianProfile.findById(req.params.id);
        if (!technician) return next(new AppError('Technician not found', 404));

        if (!categoryIds || !Array.isArray(categoryIds) || categoryIds.length === 0) {
            return next(new AppError('At least one category (Skill) must be assigned to approve.', 400));
        }

        // Validate Categories exist? (Optional but good)
        // const Category = require('../models/Category');
        // const count = await Category.countDocuments({ _id: { $in: categoryIds } });
        // if (count !== categoryIds.length) ...

        technician.categories = categoryIds;
        technician.documents.verificationStatus = 'VERIFIED';
        await technician.save();

        // LOG ACTION
        await adminService.logAction({
            adminId: req.user.id,
            action: 'TECHNICIAN_APPROVE',
            targetType: 'TechnicianProfile',
            targetId: technician._id,
            details: { previousStatus: 'PENDING', assignedCategories: categoryIds }
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

exports.deleteTechnician = async (req, res, next) => {
    try {
        const technician = await TechnicianProfile.findById(req.params.id);
        if (!technician) return next(new AppError('Technician not found', 404));

        // Delete associated User?
        // Usually good practice to keep the User but maybe mark as deleted, 
        // OR if the user requested "Permanently Delete", we might delete both.
        // For now, let's delete the Profile and perhaps the User if it's a technician-only account.
        // Assuming we just want to remove the technician role/profile.

        // Strategy: Delete TechnicianProfile, and potentially delete User if we want full cleanup.
        // Let's delete both for a "hard delete".

        await TechnicianProfile.findByIdAndDelete(req.params.id);

        if (technician.user) {
            const user = await User.findById(technician.user);
            // Verify it is indeed a technician before deleting user to avoid accidents if they have dual roles (though not current arch)
            if (user && user.role === 'TECHNICIAN') {
                await User.findByIdAndDelete(technician.user);
            }
        }

        // LOG ACTION
        await adminService.logAction({
            adminId: req.user.id,
            action: 'TECHNICIAN_DELETE',
            targetType: 'TechnicianProfile',
            targetId: req.params.id
        });

        res.status(204).json({ status: 'success', data: null });
    } catch (error) {
        next(error);
    }
};

exports.updateTechnicianProfile = async (req, res, next) => {
    try {
        const { bio, skills, employeeId, name, phone, address, categories } = req.body;
        const technician = await TechnicianProfile.findById(req.params.id);

        if (!technician) return next(new AppError('Technician not found', 404));

        // Update Profile fields
        if (bio !== undefined) technician.bio = bio;
        if (skills !== undefined) technician.skills = Array.isArray(skills) ? skills : skills.split(',').map(s => s.trim());
        if (employeeId !== undefined) technician.employeeId = employeeId;
        if (categories !== undefined) {
            technician.categories = Array.isArray(categories) ? categories : categories.split(',').map(c => c.trim()).filter(Boolean);
        }
        if (address !== undefined) {
            if (!technician.location) technician.location = { type: 'Point', coordinates: [0, 0] };
            technician.location.address = address;
        }

        let profilePhotoUrl = null;
        if (req.file) {
            profilePhotoUrl = req.file.path;
            technician.profilePhoto = profilePhotoUrl;
        }

        await technician.save();

        // Update User fields if provided
        if (name || phone || profilePhotoUrl) {
            const user = await User.findById(technician.user);
            if (user) {
                if (name) user.name = name;
                if (phone) user.phone = phone;
                if (profilePhotoUrl) user.profilePhoto = profilePhotoUrl;
                await user.save({ validateBeforeSave: false });
            }
        }

        // Populate and return
        await technician.populate('user', 'name email phone isActive');
        await technician.populate('categories', 'name');

        res.status(200).json({
            status: 'success',
            data: { technician }
        });
    } catch (error) {
        next(error);
    }
};

exports.getAllUsers = async (req, res, next) => {
    try {
        const { role, isActive, search, limit, page } = req.query;
        const filter = {};

        if (role) filter.role = role.toUpperCase();
        if (isActive !== undefined) filter.isActive = isActive === 'true';

        if (search) {
            filter.$or = [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } }
            ];
        }

        // Pagination
        const pageNum = parseInt(page) || 1;
        const limitNum = parseInt(limit) || 10;
        const skip = (pageNum - 1) * limitNum;

        const users = await User.find(filter)
            .select('-password')
            .sort('-createdAt')
            .skip(skip)
            .limit(limitNum);

        const total = await User.countDocuments(filter);

        res.status(200).json({
            status: 'success',
            results: users.length,
            total,
            totalPages: Math.ceil(total / limitNum),
            currentPage: pageNum,
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
            .populate('customer', 'name email phone profilePhoto')
            .populate({
                path: 'technician',
                select: 'name email phone profilePhoto',
                populate: {
                    path: 'technicianProfile',
                    select: 'location'
                }
            })
            .populate('category', 'name price')
            .populate('review')
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


// --- WORK ASSIGNMENT ---

exports.assignTechnician = async (req, res, next) => {
    try {
        const { technicianId } = req.body;
        const booking = await Booking.findById(req.params.id);

        if (!booking) return next(new AppError('No booking found with that ID', 404));

        if (['CANCELLED', 'COMPLETED'].includes(booking.status)) {
            return next(new AppError(`Cannot assign technician to a ${booking.status.toLowerCase()} booking`, 400));
        }

        const oldTechnicianId = booking.technician;
        const notificationService = require('../services/notificationService');

        if (!technicianId) {
            // UNASSIGN Logic
            booking.technician = undefined;
            booking.status = 'PENDING';
            await booking.save({ validateBeforeSave: false });

            if (oldTechnicianId) {
                await notificationService.send({
                    recipient: oldTechnicianId,
                    type: 'BOOKING_REMOVED',
                    title: 'Job Unassigned',
                    message: `Booking (ID: ${booking._id}) has been removed from your assignments by an administrator.`,
                    data: { bookingId: booking._id }
                });
            }

            const updatedBooking = await Booking.findById(booking._id)
                .populate('customer', 'name email phone')
                .populate('category', 'name price');

            return res.status(200).json({ status: 'success', data: { booking: updatedBooking } });
        }

        // Update technician (Assignment or Reassignment)
        booking.technician = technicianId;
        booking.status = 'ASSIGNED'; // Reset status to ASSIGNED for the new technician to accept

        await booking.save({ validateBeforeSave: false });

        // Notify New Technician
        await notificationService.send({
            recipient: technicianId,
            type: 'BOOKING_ASSIGNED',
            title: 'New Job Assigned',
            message: `You have been assigned to a booking (ID: ${booking._id})`,
            data: { bookingId: booking._id }
        });

        // Notify Old Technician (if exists and different)
        if (oldTechnicianId && oldTechnicianId.toString() !== technicianId) {
            await notificationService.send({
                recipient: oldTechnicianId,
                type: 'BOOKING_REMOVED',
                title: 'Job Re-assigned',
                message: `Booking (ID: ${booking._id}) has been re-assigned to another technician.`,
                data: { bookingId: booking._id }
            });
        }

        const updatedBooking = await Booking.findById(booking._id)
            .populate('customer', 'name email phone')
            .populate('technician', 'name email phone')
            .populate('category', 'name price');

        res.status(200).json({
            status: 'success',
            data: { booking: updatedBooking }
        });
    } catch (err) {
        next(err);
    }
};
