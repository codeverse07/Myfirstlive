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

exports.updateMe = async (req, res, next) => {
    try {
        // 1) Create error if user POSTs password data
        if (req.body.password || req.body.passwordConfirm) {
            return next(new AppError('This route is not for password updates. Please use /update-password.', 400));
        }

        // 2) Filtered out unwanted field names that are not allowed to be updated
        // STRICTLY allow 'name', 'email' and new profile fields
        // STRICTLY allow 'name', 'email' and new profile fields including profilePhoto (for avatars)
        const filteredBody = filterObj(req.body, 'name', 'email', 'phone', 'address', 'location', 'profilePhoto');

        if (req.file) {
            const cloudinary = require('cloudinary').v2;
            cloudinary.config({
                cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
                api_key: process.env.CLOUDINARY_API_KEY,
                api_secret: process.env.CLOUDINARY_API_SECRET
            });

            const result = await cloudinary.uploader.upload(req.file.path, {
                folder: 'users',
                use_filename: true
            });

            filteredBody.profilePhoto = result.secure_url;

            // Cleanup local file
            const fs = require('fs');
            fs.unlinkSync(req.file.path);

            // Delete old image
            const currentUser = await User.findById(req.user.id);
            if (currentUser.profilePhoto) {
                const deleteFromCloudinary = require('../utils/cloudinaryDelete');
                await deleteFromCloudinary(currentUser.profilePhoto);
            }

            // Note: Users didn't have local uploads explicitly in the previous code snippet for updateMe
            // It just said: if (req.file) filteredBody.profilePhoto = req.file.filename;
            // which implies it was saving the filename but where? 
            // Ah, User model usually has a default, or it was being served via static path middleware I didn't see fully for users.
            // Assuming it's similar cleanup if needed or just moving forward with Cloudinary.
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
