const mongoose = require('mongoose');
const Booking = require('../models/Booking');
const Service = require('../models/Service');
const Review = require('../models/Review');
const Reason = require('../models/Reason');
const TechnicianProfile = require('../models/TechnicianProfile');
const AppError = require('../utils/AppError');
const notificationService = require('../services/notificationService');
const socketService = require('../utils/socket'); // Import Socket Service

// Helper to generate 6-digit Happy Pin
const generateHappyPin = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

exports.createBooking = async (req, res, next) => {
    try {
        const { categoryId, serviceId, scheduledAt, notes } = req.body;
        const Category = require('../models/Category');

        let finalCategoryId = categoryId;
        let finalServiceId = serviceId;

        // 1. Resolve Service and Category
        console.log('[DEBUG] createBooking Payload:', req.body);
        if (serviceId) {
            const serviceDoc = await Service.findById(serviceId);
            if (!serviceDoc) {
                console.error('[DEBUG] Service not found:', serviceId);
                return next(new AppError('Service not found', 404));
            }

            // Case-insensitive lookup for robustness
            // IMPROVEMENT: Check if serviceDoc.category is already an Object ID
            if (mongoose.Types.ObjectId.isValid(serviceDoc.category)) {
                finalCategoryId = serviceDoc.category;
            } else {
                const categoryDoc = await Category.findOne({
                    name: { $regex: new RegExp(`^${serviceDoc.category}$`, 'i') }
                });
                if (categoryDoc) finalCategoryId = categoryDoc._id;
            }
            finalServiceId = serviceId;
        } else if (categoryId) {
            // Fallback: Check if categoryId is actually a service ID
            const potentialService = await Service.findById(categoryId);
            if (potentialService) {
                finalServiceId = categoryId;
                // Same check here
                if (mongoose.Types.ObjectId.isValid(potentialService.category)) {
                    finalCategoryId = potentialService.category;
                } else {
                    const categoryDoc = await Category.findOne({
                        name: { $regex: new RegExp(`^${potentialService.category}$`, 'i') }
                    });
                    if (categoryDoc) finalCategoryId = categoryDoc._id;
                }
            } else {
                // It might be a real category ID
                finalCategoryId = categoryId;
            }
        }

        console.log('[DEBUG] Resolved IDs:', { finalServiceId, finalCategoryId });

        if (!finalCategoryId) {
            return next(new AppError('A valid category or service must be provided (Category Resolution Failed)', 400));
        }

        // 2. Check if category exists AND is active
        const category = await Category.findById(finalCategoryId);
        if (!category || !category.isActive) {
            return next(new AppError('Category not found or not active', 404));
        }

        const coordinates = req.body.coordinates; // Expecting [lng, lat]

        // Helper to format location
        const formatLocation = (loc) => {
            if (!loc) return undefined;
            if (typeof loc === 'string' && loc.trim() !== '') {
                return { type: 'Point', coordinates: [0, 0], address: loc };
            }
            if (typeof loc === 'object' && loc.address) {
                return {
                    type: 'Point',
                    coordinates: loc.coordinates || [0, 0],
                    address: loc.address
                };
            }
            return undefined;
        };

        const bookingData = {
            customer: req.user.id,
            category: finalCategoryId,
            service: finalServiceId,
            price: req.body.price || category.price || 0,
            scheduledAt,
            notes,
            referenceImage: req.file ? req.file.path : undefined, // Cloudinary URL
            location: {
                type: 'Point',
                coordinates: coordinates || [0, 0],
                address: req.body.address || req.body.pickupLocation
            },
            pickupLocation: formatLocation(req.body.pickupLocation),
            dropLocation: formatLocation(req.body.dropLocation),
            status: 'PENDING',
            technician: null // Explicitly no technician at booking time
        };

        let booking = await Booking.create(bookingData);

        // Populate for immediate frontend use
        booking = await Booking.findById(booking._id)
            .populate('category', 'name price image icon')
            .populate('customer', 'name email phone profilePhoto');

        // Socket Emission for Admin & Customer
        try {
            const io = socketService.getIo();
            io.to('admin-room').emit('booking:created', booking);

            // Emit to Customer
            if (booking.customer) {
                const customerId = booking.customer._id || booking.customer;
                io.to(`user:${customerId}`).emit('booking:created', booking);
            }
        } catch (err) {
            console.error('Socket emission failed:', err.message);
        }

        res.status(201).json({
            status: 'success',
            data: {
                booking
            }
        });
    } catch (error) {
        next(error);
    }
};

exports.getAllBookings = async (req, res, next) => {
    try {
        const { status } = req.query;
        const filter = {};

        // Filter by user role context
        if (req.user.role === 'TECHNICIAN') {
            filter.technician = req.user._id;
        } else {
            filter.customer = req.user.id;
        }

        if (status) {
            filter.status = status;
        }

        // Sorting Logic: Technician + Pending = Earliest First. Everyone else = Newest First.
        let sortStr = '-createdAt';
        if (req.user.role === 'TECHNICIAN' && status === 'PENDING') {
            sortStr = 'scheduledAt'; // Ascending (Earliest first)
        }

        const bookings = await Booking.find(filter)
            .populate('category', 'name price image icon')
            .populate('customer', 'name email phone location profilePhoto')
            .populate('technician', 'name email phone profilePhoto')
            .populate('review')
            .sort(sortStr);

        // Security: Hide Happy Pin from Technician
        if (req.user.role === 'TECHNICIAN') {
            bookings.forEach(b => b.securityPin = undefined);
        }

        res.status(200).json({
            status: 'success',
            results: bookings.length,
            data: {
                bookings
            }
        });
    } catch (error) {
        next(error);
    }
};

exports.getBooking = async (req, res, next) => {
    try {
        const booking = await Booking.findById(req.params.bookingId)
            .populate('category', 'name price image icon')
            .populate('customer', 'name email phone profilePhoto')
            .populate('technician', 'name email phone profilePhoto')
            .populate('review');

        if (!booking) {
            return next(new AppError('No booking found with that ID', 404));
        }

        // Security: Ensure user is related to this booking
        const isCustomer = booking.customer._id.toString() === req.user.id;
        const isTechnician = booking.technician._id.toString() === req.user.id;
        const isAdmin = req.user.role === 'ADMIN';

        if (!isCustomer && !isTechnician && !isAdmin) {
            return next(new AppError('You do not have permission to view this booking', 403));
        }

        // Security: Hide Happy Pin from Technician
        if (isTechnician) {
            booking.securityPin = undefined;
        }

        res.status(200).json({
            status: 'success',
            data: {
                booking
            }
        });
    } catch (error) {
        next(error);
    }
};

exports.updateBookingStatus = async (req, res, next) => {
    try {
        const { status } = req.body;
        const booking = await Booking.findById(req.params.bookingId).populate('category');

        if (!booking) {
            return next(new AppError('No booking found with that ID', 404));
        }

        const isTechnician = booking.technician?.toString() === req.user.id;
        const isCustomer = booking.customer?.toString() === req.user.id;
        const isAdmin = req.user.role === 'ADMIN';

        // State Machine Logic
        if (status === 'CANCELLED') {
            // NEW RULE: Technician cannot cancel once they accept or start work
            if (isTechnician && ['ACCEPTED', 'IN_PROGRESS'].includes(booking.status)) {
                return next(new AppError('Technicians cannot cancel a job once it is accepted or in progress. Please contact administrator.', 400));
            }

            // IDOR PROTECTION: Ensure requester is User, Assigned Tech, or Admin
            if (!isAdmin && !isCustomer && !isTechnician) {
                return next(new AppError('You do not have permission to cancel this booking', 403));
            }

            // Both can cancel if pending, assigned, accepted OR IN_PROGRESS
            // Admin can always cancel
            if (!isAdmin && !['PENDING', 'ASSIGNED', 'ACCEPTED', 'IN_PROGRESS'].includes(booking.status)) {
                return next(new AppError('Cannot cancel booking at this stage', 400));
            }
            // Notification target logic
            const recipient = isCustomer ? booking.technician : booking.customer;
            if (recipient) {
                await notificationService.send({
                    recipient,
                    type: 'BOOKING_CANCELLED',
                    title: 'Booking Cancelled',
                    message: `Booking for ${booking.category?.name || 'Unknown Category'} was cancelled`,
                    data: { bookingId: booking._id }
                });
            }
            booking.securityPin = undefined; // Nullify pin on cancel
            booking.status = 'CANCELLED'; // EXPLICITLY SET STATUS FOR PERSISTENCE
        }
        else if (['ACCEPTED', 'REJECTED'].includes(status)) {
            // Only Technician can accept/reject (Admin generally shouldn't interfere here unless re-assigning, which is a different flow)
            if (!isTechnician && !isAdmin) return next(new AppError('Only technician can accept/reject', 403));

            if (!isAdmin && !['PENDING', 'ASSIGNED'].includes(booking.status)) return next(new AppError('Can only update pending or assigned bookings', 400));

            // Notify Customer
            await notificationService.send({
                recipient: booking.customer,
                type: `BOOKING_${status}`,
                title: `Booking ${status === 'REJECTED' ? 'Assignment Update' : status}`,
                message: status === 'REJECTED'
                    ? `The assigned technician was unavailable. We are finding a new expert for you.`
                    : `Your booking for ${booking.category?.name || 'Unknown Category'} was ${status.toLowerCase()}`,
                data: { bookingId: booking._id }
            });

            // Notify Admin
            console.log(`[INFO] Technician ${req.user.name} ${status.toLowerCase()} booking ${booking._id}`);

            // Logic for status transition
            if (status === 'REJECTED') {
                booking.status = 'PENDING';
                booking.technician = null;
            } else {
                booking.status = 'ACCEPTED';
                if (!booking.securityPin) {
                    booking.securityPin = generateHappyPin();
                }
            }
        }
        else if (['IN_PROGRESS', 'COMPLETED'].includes(status)) {
            // Only Technician or Admin can progress
            if (!isTechnician && !isAdmin) return next(new AppError('Only technician can update progress', 403));

            const isValidFlow =
                (booking.status === 'ACCEPTED' && status === 'IN_PROGRESS') ||
                (booking.status === 'IN_PROGRESS' && status === 'COMPLETED') ||
                isAdmin; // Admin can jump

            if (!isValidFlow) return next(new AppError(`Invalid status transition from ${booking.status} to ${status}`, 400));

            // Logic for COMPLETED status
            if (status === 'COMPLETED') {
                const { securityPin, finalAmount, extraReason, technicianNote } = req.body;

                console.log('[DEBUG] Completion Request:', {
                    body: req.body,
                    filesCount: req.files?.length || 0
                });

                // 1. Verify Happy Pin (Required for Technician, OR if Pin is provided by Admin)
                const isPinRequired = !isAdmin || (isAdmin && securityPin);
                if (isPinRequired) {
                    const inputPin = securityPin ? String(securityPin).trim() : '';
                    const storedPin = booking.securityPin ? String(booking.securityPin).trim() : '';

                    if (!inputPin || inputPin !== storedPin) {
                        return next(new AppError('Invalid Happy Pin provided.', 400));
                    }
                }

                // 2. Enforce Work Photos (Compulsory) - Skip for Admin
                if (!isAdmin && (!req.files || req.files.length === 0) && (!booking.partImages || booking.partImages.length === 0)) {
                    return next(new AppError('At least one photo of the completed work is required', 400));
                }

                // 3. Set Completion Fields
                booking.finalAmount = finalAmount ? Number(finalAmount) : booking.price;
                booking.technicianNote = technicianNote;
                booking.completedAt = Date.now();

                // Validation: Only require extraReason if finalAmount is strictly greater than original price
                const isPriceIncreased = Math.round(Number(booking.finalAmount)) > Math.round(Number(booking.price));

                if (isPriceIncreased) {
                    if (!extraReason || !extraReason.trim()) {
                        return next(new AppError('Reason for extra charges is required when price is increased', 400));
                    }
                    booking.extraReason = extraReason;
                } else {
                    booking.extraReason = undefined;
                }

                if (req.files && req.files.length > 0) {
                    booking.partImages = req.files.map(file => file.path);
                }
                booking.securityPin = undefined;

                // Update Technician Stats & Status
                if (booking.technician) {
                    await TechnicianProfile.findOneAndUpdate(
                        { user: booking.technician },
                        {
                            $inc: { totalJobs: 1 },
                            $set: { status: 'ONLINE' } // Job done, now available
                        }
                    );
                }
            }

            await notificationService.send({
                recipient: booking.customer,
                type: `BOOKING_${status}`,
                title: `Booking Update: ${(status || '').replace('_', ' ')}`,
                message: `Status update for ${booking.category?.name || 'Unknown Category'}: ${status}`,
                data: { bookingId: booking._id }
            });

            // CRITICAL FIX: Explicitly update the status on the booking object
            booking.status = status;
        }
        else {
            return next(new AppError('Invalid status provided', 400));
        }

        // --- ATOMIC UPDATE (Bypasses Validation for legacy data) ---
        const updatePayload = {
            status: booking.status,
            technician: booking.technician,
            securityPin: booking.securityPin,
            finalAmount: booking.finalAmount,
            technicianNote: booking.technicianNote,
            completedAt: booking.completedAt,
            extraReason: booking.extraReason,
            partImages: booking.partImages
        };

        const updatedBooking = await Booking.findByIdAndUpdate(
            req.params.bookingId,
            { $set: updatePayload },
            { new: true, runValidators: false }
        ).populate('category customer technician review');

        console.log(`[DEBUG] Status Update Success: ${updatedBooking._id} (${status})`);

        // Socket Emission for Admin & Technician
        try {
            const io = socketService.getIo();
            io.to('admin-room').emit('booking:updated', updatedBooking);

            // Also emit to specific technician if assigned
            if (updatedBooking.technician) {
                const techId = updatedBooking.technician._id || updatedBooking.technician;
                io.to(`user:${techId}`).emit('booking:updated', updatedBooking);
            }

            // Emit to Customer
            if (updatedBooking.customer) {
                const customerId = updatedBooking.customer._id || updatedBooking.customer;
                io.to(`user:${customerId}`).emit('booking:updated', updatedBooking);
            }
        } catch (err) {
            console.error('Socket emission failed:', err.message);
        }

        res.status(200).json({
            status: 'success',
            data: {
                booking: updatedBooking
            }
        });

    } catch (error) {
        next(error);
    }
};

exports.getTechnicianStats = async (req, res, next) => {
    try {

        const stats = await Booking.aggregate([
            {
                $match: {
                    technician: req.user._id,
                    status: 'COMPLETED'
                }
            },
            {
                $group: {
                    _id: null,
                    totalEarnings: { $sum: { $ifNull: ['$finalAmount', '$price'] } },
                    completedJobs: { $sum: 1 }
                }
            }
        ]);


        res.status(200).json({
            status: 'success',
            data: {
                stats: stats.length > 0 ? stats[0] : { totalEarnings: 0, completedJobs: 0 }
            }
        });
    } catch (error) {
        console.error('STATS AGGREGATION ERROR:', error);
        next(error);
    }
};
