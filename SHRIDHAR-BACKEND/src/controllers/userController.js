const User = require('../models/User');
const AppError = require('../utils/AppError');

// Helper to filter allowed fields
const filterObj = (obj, ...allowedFields) => {
    const newObj = {};
    Object.keys(obj).forEach(el => {
        if (allowedFields.includes(el)) newObj[el] = obj[el];
    });
    return newObj;
};

exports.getAllUsers = async (req, res, next) => {
    try {
        const users = await User.find();
        res.status(200).json({
            status: 'success',
            results: users.length,
            data: { users }
        });
    } catch (err) {
        next(err);
    }
};

exports.getUser = async (req, res, next) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return next(new AppError('No user found with that ID', 404));
        }
        res.status(200).json({
            status: 'success',
            data: { user }
        });
    } catch (err) {
        next(err);
    }
};

const Settings = require('../models/Settings');

// ... (existing imports)

exports.updateMe = async (req, res, next) => {
    try {
        // 1) Create error if user POSTs password data
        if (req.body.password || req.body.passwordConfirm) {
            return next(new AppError('This route is not for password updates. Please use /update-password.', 400));
        }

        // 2) Validate Pincode if provided AND different from current
        if (req.body.pincode && req.body.pincode !== req.user.pincode) {
            const settings = await Settings.findOne({ isGlobal: true });
            const allowedPincodes = (settings && settings.serviceablePincodes && settings.serviceablePincodes.length > 0)
                ? settings.serviceablePincodes
                : ['845438']; // Default fallback

            const cleanProvided = req.body.pincode.toString().trim();
            const isAllowed = allowedPincodes.some(p => p.toString().trim() === cleanProvided);

            if (!isAllowed) {
                return next(new AppError(`Service not available in your location (${cleanProvided}). We only serve: ${allowedPincodes.join(', ')}`, 400));
            }
        }

        // 3) Filtered out unwanted field names that are not allowed to be updated
        // STRICTLY allow 'name', 'email' and new profile fields
        const filteredBody = filterObj(req.body, 'name', 'email', 'phone', 'address', 'location', 'profilePhoto', 'pincode');

        if (req.file) {
            // Multer Cloudinary storage already uploads the file
            filteredBody.profilePhoto = req.file.path;

            // Delete old image
            const currentUser = await User.findById(req.user.id);
            if (currentUser.profilePhoto) {
                const deleteFromCloudinary = require('../utils/cloudinaryDelete');
                // Check if old photo is different (it should be)
                await deleteFromCloudinary(currentUser.profilePhoto);
            }
        }

        // 3) Update user document
        const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {
            new: true,
            runValidators: true
        });

        // 4) Sync to TechnicianProfile if user is a technician
        if (updatedUser.role === 'TECHNICIAN' && filteredBody.profilePhoto) {
            const TechnicianProfile = require('../models/TechnicianProfile');
            await TechnicianProfile.findOneAndUpdate(
                { user: req.user.id },
                { profilePhoto: filteredBody.profilePhoto }
            );
        }

        res.status(200).json({
            status: 'success',
            data: { user: updatedUser }
        });
    } catch (err) {
        next(err);
    }
};

exports.deleteMe = async (req, res, next) => {
    try {
        await User.findByIdAndUpdate(req.user.id, { isActive: false });
        res.status(204).json({
            status: 'success',
            data: null
        });
    } catch (err) {
        next(err);
    }
};
