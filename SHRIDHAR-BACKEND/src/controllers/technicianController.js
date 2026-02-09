const TechnicianProfile = require('../models/TechnicianProfile');
const User = require('../models/User');
const AppError = require('../utils/AppError');

exports.createProfile = async (req, res, next) => {
    try {
        // 1. Allow 'USER' to create profile (they will be upgraded later)
        if (!['USER', 'TECHNICIAN'].includes(req.user.role)) {
            return next(new AppError('Invalid role to create technician profile.', 403));
        }

        // 2. Prepare Profile Data
        let profileData = {
            bio: req.body.bio,
            skills: req.body.skills,
        };

        // Explicitly prevent self-assignment of roles during registration
        delete req.body.categories;
        delete req.body.services;

        if (req.file) {
            // Multer Cloudinary storage already uploads the file
            profileData.profilePhoto = req.file.path;
        } else if (req.body.profilePhoto) {
            profileData.profilePhoto = req.body.profilePhoto;
        }

        // 3. Upsert Profile
        const profile = await TechnicianProfile.findOneAndUpdate(
            { user: req.user.id },
            {
                $set: profileData,
                $setOnInsert: { user: req.user.id, isProfileCompleted: false }
            },
            { new: true, upsert: true, runValidators: true }
        );

        // 4. Sync profile photo to User model if provided
        if (profileData.profilePhoto) {
            await User.findByIdAndUpdate(req.user.id, { profilePhoto: profileData.profilePhoto });
        }

        // Socket Emission for Admin
        try {
            const socketService = require('../utils/socket');
            socketService.getIo().to('admin-room').emit('technician:created', profile);
        } catch (err) {
            console.error('Socket emission failed:', err.message);
        }

        res.status(201).json({
            status: 'success',
            data: { profile }
        });
    } catch (err) {
        next(err);
    }
};

exports.updateProfile = async (req, res, next) => {
    try {
        const currentProfile = await TechnicianProfile.findOne({ user: req.user.id });

        if (req.file) {
            // Multer already uploaded new file
            req.body.profilePhoto = req.file.path;

            // Delete old photo from Cloudinary if applicable
            const deleteFromCloudinary = require('../utils/cloudinaryDelete');
            if (currentProfile && currentProfile.profilePhoto) {
                // Check if the old photo is different from the new one (it should be)
                await deleteFromCloudinary(currentProfile.profilePhoto);
            }
        }

        // Prevent technicians from editing their own categories/roles or legal agreements
        delete req.body.categories;
        delete req.body.services;
        delete req.body.agreement;
        if (req.body.documents) {
            delete req.body.documents.agreement;
            delete req.body.documents.verificationStatus;
        }

        const profile = await TechnicianProfile.findOneAndUpdate(
            { user: req.user.id },
            req.body,
            { new: true, runValidators: true }
        );

        if (!profile) {
            return next(new AppError('Technician profile not found. Please create one first.', 404));
        }

        // 3. Sync profile photo to User model if updated
        if (req.body.profilePhoto) {
            await User.findByIdAndUpdate(req.user.id, { profilePhoto: req.body.profilePhoto });
        }

        // Socket Emission for Admin
        try {
            const socketService = require('../utils/socket');
            socketService.getIo().to('admin-room').emit('technician:updated', profile);
        } catch (err) {
            console.error('Socket emission failed:', err.message);
        }

        res.status(200).json({
            status: 'success',
            data: { profile }
        });
    } catch (err) {
        next(err);
    }
};

exports.getAllTechnicians = async (req, res, next) => {
    try {
        // Build Query
        const queryObj = { ...req.query };
        const excludedFields = ['page', 'sort', 'limit', 'fields'];
        excludedFields.forEach(el => delete queryObj[el]);

        // Filtering by skills (simple regex partial match or exact)
        if (req.query.skills) {
            // Assume comma separated 'plumber,electrician'
            const skills = req.query.skills.split(',');
            queryObj.skills = { $in: skills };
        }

        // Filtering by rating
        if (req.query.rating) {
            queryObj.avgRating = { $gte: req.query.rating };
        }

        // Always show online first? Or filter by online?
        // queryObj.isOnline = true; // Optional: only show online technicians?

        let query = TechnicianProfile.find(queryObj).populate('user', 'name email');

        // Execute
        const technicians = await query;

        res.status(200).json({
            status: 'success',
            results: technicians.length,
            data: { technicians }
        });
    } catch (err) {
        next(err);
    }
};

exports.getTechnician = async (req, res, next) => {
    try {
        const technician = await TechnicianProfile.findById(req.params.id).populate('user', 'name email');

        if (!technician) {
            return next(new AppError('No technician found with that ID', 404));
        }

        res.status(200).json({
            status: 'success',
            data: { technician }
        });
    } catch (err) {
        next(err);
    }
};
exports.uploadDocuments = async (req, res, next) => {
    try {
        if (!req.files || !req.files.aadharCard || !req.files.panCard) {
            return next(new AppError('Aadhaar Card and PAN Card are mandatory for verification.', 400));
        }

        const updateData = {
            'documents.verificationStatus': 'PENDING'
        };

        // Multer Cloudinary storage already uploaded files
        if (req.files.aadharCard) {
            updateData['documents.aadharCard'] = req.files.aadharCard[0].path;
        }
        if (req.files.panCard) {
            updateData['documents.panCard'] = req.files.panCard[0].path;
        }
        if (req.files.resume) {
            updateData['documents.resume'] = req.files.resume[0].path;
        }

        // 3. Update Profile
        const profile = await TechnicianProfile.findOneAndUpdate(
            { user: req.user.id },
            {
                $set: {
                    ...updateData,
                    isProfileCompleted: true
                }
            },
            { new: true, runValidators: true }
        );

        if (!profile) {
            return next(new AppError('Technician profile not found', 404));
        }

        // 4. Update User onboarding status and ROLE
        await User.findByIdAndUpdate(req.user.id, {
            isTechnicianOnboarded: true,
            role: 'TECHNICIAN'
        });

        // Socket Emission for Admin
        try {
            const socketService = require('../utils/socket');
            socketService.getIo().to('admin-room').emit('technician:updated', profile);
        } catch (err) {
            console.error('Socket emission failed:', err.message);
        }

        res.status(200).json({
            status: 'success',
            data: { profile }
        });
    } catch (error) {
        next(error);
    }
};

exports.getMyProfile = async (req, res, next) => {
    try {
        const profile = await TechnicianProfile.findOne({ user: req.user.id })
            .populate('user', 'name email phone profilePhoto')
            .populate('categories');

        if (!profile) {
            return res.status(200).json({
                status: 'success',
                data: { profile: null }
            });
        }

        res.status(200).json({
            status: 'success',
            data: { profile }
        });
    } catch (err) {
        next(err);
    }
};

exports.updateStatus = async (req, res, next) => {
    try {
        const { isOnline } = req.body;
        if (typeof isOnline !== 'boolean') {
            return next(new AppError('isOnline must be a boolean', 400));
        }

        // NEW RULE: Block going offline if any job is IN_PROGRESS
        if (isOnline === false) {
            const Booking = require('../models/Booking');
            const activeJobs = await Booking.countDocuments({
                technician: req.user.id,
                status: 'IN_PROGRESS'
            });

            if (activeJobs > 0) {
                return next(new AppError('Cannot go offline while you have active jobs in progress. Please complete them first.', 400));
            }
        }

        const profile = await TechnicianProfile.findOneAndUpdate(
            { user: req.user.id },
            { isOnline },
            { new: true }
        );

        if (!profile) return next(new AppError('Profile not found', 404));

        // Socket Emission for Admin
        try {
            const socketService = require('../utils/socket');
            socketService.getIo().to('admin-room').emit(profile.isOnline ? 'technician:online' : 'technician:offline', { technicianId: profile._id });
        } catch (err) {
            console.error('Socket emission failed:', err.message);
        }

        res.status(200).json({
            status: 'success',
            data: { isOnline: profile.isOnline }
        });
    } catch (err) {
        next(err);
    }
};

exports.requestPasswordReset = async (req, res, next) => {
    try {
        await User.findByIdAndUpdate(req.user.id, {
            passwordResetRequested: true,
            passwordResetRequestedAt: Date.now()
        });

        res.status(200).json({
            status: 'success',
            message: 'Password reset request submitted to administrator.'
        });
    } catch (err) {
        next(err);
    }
};
