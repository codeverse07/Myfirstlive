const Service = require('../models/Service');
const AppError = require('../utils/AppError');

exports.createService = async (req, res, next) => {
    try {
        let headerImage = 'default-service.jpg';

        if (req.file) {
            // Multer Cloudinary storage already uploads the file
            headerImage = req.file.path;
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

        // 2. Add service to Technician Profile (Only for Technicians)
        if (req.user.role === 'TECHNICIAN') {
            const TechnicianProfile = require('../models/TechnicianProfile');
            await TechnicianProfile.findOneAndUpdate(
                { user: req.user.id },
                { $push: { services: newService._id } }
            );
        }

        // Socket Emission for Admin
        try {
            const socketService = require('../utils/socket');
            socketService.getIo().to('admin-room').emit('service:created', newService);
        } catch (err) {
            console.error('Socket emission failed:', err.message);
        }

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
        // Add caching headers for better performance
        res.set({
            'Cache-Control': 'public, max-age=300', // 5 minutes cache
            'ETag': Date.now().toString(), // Simple ETag for cache validation
        });

        // Build Query
        const queryObj = { ...req.query };
        const excludedFields = ['page', 'sort', 'limit', 'fields', 'search', 'minRating', 'maxPrice', 'minPrice', 'maxRating'];
        excludedFields.forEach(el => delete queryObj[el]);

        // Search feature
        if (req.query.search) {
            queryObj.title = { $regex: req.query.search, $options: 'i' };
        }

        // Category feature
        if (req.query.category && req.query.category !== 'All') {
            queryObj.category = req.query.category;
        } else if (req.query.category === 'All') {
            delete queryObj.category;
        }

        // Price filtering
        if (req.query.minPrice || req.query.maxPrice) {
            queryObj.price = {};
            if (req.query.minPrice && !isNaN(req.query.minPrice)) queryObj.price.$gte = Number(req.query.minPrice);
            if (req.query.maxPrice && !isNaN(req.query.maxPrice)) queryObj.price.$lte = Number(req.query.maxPrice);

            // If the object is empty after NaN checks, delete it
            if (Object.keys(queryObj.price).length === 0) delete queryObj.price;
        }

        // Visibility Guard: Show services from ACTIVE technicians/admins or Global services
        const User = require('../models/User');
        const TechnicianProfile = require('../models/TechnicianProfile');

        // 1. Get all active potential service providers (TECHNICIAN or ADMIN)
        const activeProviders = await User.find({
            role: { $in: ['TECHNICIAN', 'ADMIN'] },
            isActive: true
        }).select('_id role');

        const activeProviderIds = activeProviders.map(u => u._id);

        // 2. Get REJECTED or OFFLINE technician IDs to exclude (Admins don't have TechnicianProfiles to check)
        const invalidProfiles = await TechnicianProfile.find({
            user: { $in: activeProviderIds },
            $or: [
                { 'documents.verificationStatus': 'REJECTED' }
            ]
        }).select('user');

        const invalidUserIds = invalidProfiles.map(p => p.user.toString());

        // 3. Allowed IDs = Active Providers - Invalid Technicians
        const allowedProviderIds = activeProviderIds.filter(id => !invalidUserIds.includes(id.toString()));

        if (queryObj.technician) {
            const mongoose = require('mongoose');
            let techFilterId = queryObj.technician;
            try {
                if (typeof techFilterId === 'string') techFilterId = new mongoose.Types.ObjectId(techFilterId);

                // If filtering by specific technician, they must be allowed
                if (!allowedProviderIds.some(id => id.toString() === techFilterId.toString())) {
                    return res.status(200).json({ status: 'success', results: 0, data: { services: [] } });
                }
                queryObj.technician = techFilterId;
            } catch (err) {
                return res.status(200).json({ status: 'success', results: 0, data: { services: [] } });
            }
        } else {
            // Allow if technician is in allowed list OR if technician field represents a global service (null/undefined check handled by query logic)
            // Ideally global services have technician: null or undefined.
            // We use an $or query to allow specific technicians OR global services
            const technicianFilter = { $in: allowedProviderIds };

            // If we want to strictly show only valid services:
            // Services must either belong to an allowed provider OR have no provider (if we support global services)
            // But usually 'technician' field is ref 'User'.

            // We will filter services where technician is in allowed list OR technician is not set (Global)
            // However, typical mongoose query for this matches active documents.

            // Since we can't easily do an $or inside the main queryObj if other fields are there without complex logic,
            // we will stick to the allowed list, but we MUST ensure Admins are in it.
            // AND we should explicitly allow null technician if that is how global services are stored.

            queryObj.$or = [
                { technician: { $in: allowedProviderIds } },
                { technician: { $exists: false } },
                { technician: null }
            ];
        }

        // Debug log to identify query issues
        console.log('Final Service Query Object:', JSON.stringify(queryObj, null, 2));

        // Pagination
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 12;
        const skip = (page - 1) * limit;

        let query = Service.find(queryObj)
            .select('title category price image headerImage rating reviewCount isActive createdAt description')
            .populate('category', 'name icon') // Populate Category
            .populate({
                path: 'technician',
                select: 'name email profilePhoto isActive location',
                populate: {
                    path: 'technicianProfile',
                    select: 'isOnline avgRating totalJobs location categoryRatings'
                }
            });

        // Sorting
        if (req.query.sort) {
            query = query.sort(req.query.sort);
        } else {
            query = query.sort('-createdAt');
        }

        // Apply pagination early to count total based on queryObj
        const total = await Service.countDocuments(queryObj);
        query = query.skip(skip).limit(limit);

        let services = await query;

        // Inject Category-Specific Rating & Filter by minRating
        const minRating = Number(req.query.minRating) || 0;

        // Legacy category rating injection removed. Now using service-specific ratings from DB.
        // services = services.map(...) -> Removed

        // Filter by minRating if applicable (since rating is dynamic)
        if (minRating > 0) {
            services = services.filter(s => s.rating >= minRating);
        }

        const totalPages = Math.ceil(total / limit);

        res.status(200).json({
            status: 'success',
            results: services.length,
            total,
            page,
            limit,
            totalPages,
            data: { services }
        });
    } catch (err) {
        next(err);
    }
};

exports.getService = async (req, res, next) => {
    try {
        // Add caching headers for individual service
        res.set({
            'Cache-Control': 'public, max-age=600', // 10 minutes cache for individual services
            'ETag': Date.now().toString(),
        });

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
        const isOwner = service.technician && service.technician.toString() === req.user.id;
        if (!isOwner && req.user.role !== 'ADMIN') {
            return next(new AppError('You are not authorized to update this service', 403));
        }

        // Check if new image is being uploaded
        if (req.file) {
            // Multer Cloudinary storage already uploads the file
            req.body.headerImage = req.file.path;

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

        // Socket Emission for Admin
        try {
            const socketService = require('../utils/socket');
            socketService.getIo().to('admin-room').emit('service:updated', updatedService);
        } catch (err) {
            console.error('Socket emission failed:', err.message);
        }

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
        const isOwner = service.technician && service.technician.toString() === req.user.id;
        if (!isOwner && req.user.role !== 'ADMIN') {
            return next(new AppError('You are not authorized to delete this service', 403));
        }

        // 2. Remove service from Technician Profile (Only if user has a profile)
        if (req.user.role === 'TECHNICIAN') {
            const TechnicianProfile = require('../models/TechnicianProfile');
            await TechnicianProfile.findOneAndUpdate(
                { user: req.user.id },
                { $pull: { services: req.params.id } }
            );
        }

        // 3. Delete image from Cloudinary
        const deleteFromCloudinary = require('../utils/cloudinaryDelete');
        if (service.headerImage) {
            await deleteFromCloudinary(service.headerImage);
        }

        await Service.findByIdAndDelete(req.params.id);

        // Socket Emission for Admin
        try {
            const socketService = require('../utils/socket');
            socketService.getIo().to('admin-room').emit('service:deleted', { id: req.params.id });
        } catch (err) {
            console.error('Socket emission failed:', err.message);
        }

        res.status(204).json({
            status: 'success',
            data: null
        });
    } catch (err) {
        next(err);
    }
};
