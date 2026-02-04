const Service = require('../models/Service');
const AppError = require('../utils/AppError');

exports.createService = async (req, res, next) => {
    try {
        let headerImage = 'default-service.jpg';

        if (req.file) {
            const cloudinary = require('cloudinary').v2;
            cloudinary.config({
                cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
                api_key: process.env.CLOUDINARY_API_KEY,
                api_secret: process.env.CLOUDINARY_API_SECRET
            });

            const result = await cloudinary.uploader.upload(req.file.path, {
                folder: 'services',
                use_filename: true
            });

            headerImage = result.secure_url;

            // Cleanup local file
            const fs = require('fs');
            fs.unlinkSync(req.file.path);
        } else if (req.body.headerImage) {
            // Fallback if they sent a URL string (though UI shouldn't allow mixed if file input is used)
            headerImage = req.body.headerImage;
        }

        // 1. Create service
        const newService = await Service.create({
            ...req.body,
            headerImage,
            technician: req.user.id
        });

        // 2. Add service to Technician Profile
        const TechnicianProfile = require('../models/TechnicianProfile');
        await TechnicianProfile.findOneAndUpdate(
            { user: req.user.id },
            { $push: { services: newService._id } }
        );

        res.status(201).json({
            status: 'success',
            data: { service: newService }
        });
    } catch (err) {
        next(err);
    }
};

exports.getAllServices = async (req, res, next) => {
    try {
        // Build Query
        const queryObj = { ...req.query };
        const excludedFields = ['page', 'sort', 'limit', 'fields', 'search'];
        excludedFields.forEach(el => delete queryObj[el]);

        // Search feature
        if (req.query.search) {
            queryObj.title = { $regex: req.query.search, $options: 'i' };
        }

        // Category feature (Case Insensitive)
        if (req.query.category && req.query.category !== 'All') {
            queryObj.category = { $regex: `^${req.query.category}$`, $options: 'i' };
        } else if (req.query.category === 'All') {
            delete queryObj.category;
        }

        // Visibility Guard: ONLY show services from ACTIVE technicians who are NOT REJECTED
        const User = require('../models/User');
        const TechnicianProfile = require('../models/TechnicianProfile');

        // 1. Get all active technician user IDs
        const activeTechUsers = await User.find({ role: 'TECHNICIAN', isActive: true }).select('_id');
        const activeTechUserIds = activeTechUsers.map(t => t._id);

        // 2. Get all REJECTED or OFFLINE technician user IDs
        const invalidProfiles = await TechnicianProfile.find({
            user: { $in: activeTechUserIds },
            $or: [
                { 'documents.verificationStatus': 'REJECTED' },
                { isOnline: false }
            ]
        }).select('user');
        const invalidUserIds = invalidProfiles.map(p => p.user.toString());

        // 3. Allowed technicians = Active - (Rejected + Offline)
        const allowedTechIds = activeTechUserIds.filter(id => !invalidUserIds.includes(id.toString()));

        if (queryObj.technician) {
            // If filtering by specific tech, ensure that tech is allowed
            const mongoose = require('mongoose');
            let techFilterId = queryObj.technician;
            if (typeof techFilterId === 'string') techFilterId = new mongoose.Types.ObjectId(techFilterId);

            if (!allowedTechIds.some(id => id.toString() === techFilterId.toString())) {
                return res.status(200).json({ status: 'success', results: 0, data: { services: [] } });
            }
            queryObj.technician = techFilterId;
        } else {
            queryObj.technician = { $in: allowedTechIds };
        }

        let query = Service.find(queryObj)
            .select('title category price image headerImage rating reviewCount isActive createdAt') // Select only needed service fields
            .populate({
                path: 'technician',
                select: 'name email profilePhoto isActive location', // Select only needed technician fields
                populate: {
                    path: 'technicianProfile',
                    select: 'isOnline avgRating totalJobs location categoryRatings' // Select only needed profile fields
                }
            });

        // Sorting
        if (req.query.sort) {
            query = query.sort(req.query.sort);
        } else {
            query = query.sort('-createdAt');
        }

        let services = await query;

        // Inject Category-Specific Rating into the Service Object
        services = services.map(doc => {
            const service = doc.toObject();
            if (service.technician && service.technician.technicianProfile) {
                const profile = service.technician.technicianProfile;
                // Find rating for this service's category
                const categoryStats = profile.categoryRatings?.find(
                    r => r.category && r.category.toLowerCase() === service.category.toLowerCase()
                );

                if (categoryStats) {
                    service.rating = categoryStats.avgRating;
                    service.reviewCount = categoryStats.count;
                } else {
                    service.rating = 0; // Default to 0 ("New") if no specific reviews
                    service.reviewCount = 0;
                }
            }
            return service;
        });

        res.status(200).json({
            status: 'success',
            results: services.length,
            data: { services }
        });
    } catch (err) {
        next(err);
    }
};

exports.getService = async (req, res, next) => {
    try {
        let service = await Service.findById(req.params.id).populate({
            path: 'technician',
            select: 'name email profilePhoto isActive phone',
            populate: { path: 'technicianProfile', select: 'isOnline avgRating totalJobs location documents categoryRatings' }
        });

        if (!service) {
            return next(new AppError('No service found with that ID', 404));
        }

        // Hide service if technician is inactive (Blocked)
        if (service.technician && service.technician.isActive === false) {
            return next(new AppError('This service is currently unavailable as the provider account is inactive.', 403));
        }

        // Hide service if technician is REJECTED
        if (service.technician?.technicianProfile?.documents?.verificationStatus === 'REJECTED') {
            return next(new AppError('This service is unavailable as the provider is under review or rejected.', 403));
        }

        // Inject Category Rating
        const serviceObj = service.toObject();
        if (serviceObj.technician && serviceObj.technician.technicianProfile) {
            const profile = serviceObj.technician.technicianProfile;
            const categoryStats = profile.categoryRatings?.find(
                r => r.category && r.category.toLowerCase() === serviceObj.category.toLowerCase()
            );

            if (categoryStats) {
                serviceObj.rating = categoryStats.avgRating;
                serviceObj.reviewCount = categoryStats.count;
            } else {
                serviceObj.rating = 0;
                serviceObj.reviewCount = 0;
            }
            service = serviceObj;
        }

        res.status(200).json({
            status: 'success',
            data: { service }
        });
    } catch (err) {
        next(err);
    }
};

exports.updateService = async (req, res, next) => {
    try {
        const service = await Service.findById(req.params.id);

        if (!service) {
            return next(new AppError('No service found with that ID', 404));
        }

        // Check ownership
        if (service.technician.toString() !== req.user.id) {
            return next(new AppError('You are not authorized to update this service', 403));
        }

        // Check if new image is being uploaded
        if (req.file) {
            const cloudinary = require('cloudinary').v2;
            cloudinary.config({
                cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
                api_key: process.env.CLOUDINARY_API_KEY,
                api_secret: process.env.CLOUDINARY_API_SECRET
            });

            const result = await cloudinary.uploader.upload(req.file.path, {
                folder: 'services',
                use_filename: true
            });

            req.body.headerImage = result.secure_url;

            // Cleanup local file
            const fs = require('fs');
            fs.unlinkSync(req.file.path);

            // Delete old image from Cloudinary
            const deleteFromCloudinary = require('../utils/cloudinaryDelete');
            if (service.headerImage) {
                await deleteFromCloudinary(service.headerImage);
            }
        }

        const updatedService = await Service.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });

        res.status(200).json({
            status: 'success',
            data: { service: updatedService }
        });
    } catch (err) {
        next(err);
    }
};

exports.deleteService = async (req, res, next) => {
    try {
        const service = await Service.findById(req.params.id);

        if (!service) {
            return next(new AppError('No service found with that ID', 404));
        }

        // Check ownership (or Admin)
        if (service.technician.toString() !== req.user.id && req.user.role !== 'ADMIN') {
            return next(new AppError('You are not authorized to delete this service', 403));
        }

        // 2. Remove service from Technician Profile
        const TechnicianProfile = require('../models/TechnicianProfile');
        await TechnicianProfile.findOneAndUpdate(
            { user: req.user.id },
            { $pull: { services: req.params.id } }
        );

        // 3. Delete image from Cloudinary
        const deleteFromCloudinary = require('../utils/cloudinaryDelete');
        if (service.headerImage) {
            await deleteFromCloudinary(service.headerImage);
        }

        await Service.findByIdAndDelete(req.params.id);

        res.status(204).json({
            status: 'success',
            data: null
        });
    } catch (err) {
        next(err);
    }
};
