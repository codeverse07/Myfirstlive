const Joi = require('joi');

const createReview = {
    body: Joi.object().keys({
        rating: Joi.number().min(1).max(5).required(),
        technicianRating: Joi.number().min(1).max(5).required(),
        review: Joi.string().required()
    })
};

const getReviews = {
    params: Joi.object().keys({
        workerId: Joi.string().required(),
        bookingId: Joi.string()
    })
};

module.exports = {
    createReview,
    getReviews
};
