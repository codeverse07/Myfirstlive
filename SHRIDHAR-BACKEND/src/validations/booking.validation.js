const Joi = require('joi');

const createBooking = {
    body: Joi.object().keys({
        categoryId: Joi.string().allow('').optional(),
        serviceId: Joi.string().allow('').optional(), // Allow serviceId
        scheduledAt: Joi.date().greater('now').required().messages({
            'date.base': 'Scheduled date must be a valid date',
            'date.greater': 'Scheduled date must be in the future',
            'any.required': 'Scheduled date is required'
        }),
        notes: Joi.string().max(500).allow('').optional(),
        coordinates: Joi.array().items(Joi.number()).length(2).optional(),
        address: Joi.string().allow('').optional(),
        pickupLocation: Joi.string().allow('').optional(),
        dropLocation: Joi.string().allow('').optional(),
        price: Joi.number().optional() // Allow price to be passed
    })
};

const updateBookingStatus = {
    params: Joi.object().keys({
        bookingId: Joi.string().required()
    }),
    body: Joi.object().keys({
        status: Joi.string().valid('ACCEPTED', 'REJECTED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED').required(),
        finalAmount: Joi.number().optional(),
        extraReason: Joi.string().allow('').optional(),
        technicianNote: Joi.string().max(1000).allow('').optional(),
        securityPin: Joi.string().allow('').optional(),
        partImages: Joi.any().optional(), // Allow file fields if they leak into body
        billImage: Joi.any().optional()
    }).unknown(true) // Allow unknown fields (like potential multer artifacts)
};

const getBooking = {
    params: Joi.object().keys({
        bookingId: Joi.string().required()
    })
};

module.exports = {
    createBooking,
    updateBookingStatus,
    getBooking
};
