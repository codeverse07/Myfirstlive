const Joi = require('joi');

const createBooking = {
    body: Joi.object().keys({
        serviceId: Joi.string().required().messages({
            'string.empty': 'Service ID is required',
            'any.required': 'Service ID is required'
        }),
        scheduledAt: Joi.date().greater('now').required().messages({
            'date.base': 'Scheduled date must be a valid date',
            'date.greater': 'Scheduled date must be in the future',
            'any.required': 'Scheduled date is required'
        }),
        notes: Joi.string().max(500).allow('').optional(),
        coordinates: Joi.array().items(Joi.number()).length(2).optional(),
        address: Joi.string().allow('').optional(),
        pickupLocation: Joi.string().allow('').optional(),
        dropLocation: Joi.string().allow('').optional()
    })
};

const updateBookingStatus = {
    params: Joi.object().keys({
        bookingId: Joi.string().required()
    }),
    body: Joi.object().keys({
        status: Joi.string().valid('ACCEPTED', 'REJECTED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED').required()
    })
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
