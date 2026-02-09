const Joi = require('joi');

const register = {
    body: Joi.object().keys({
        email: Joi.string().required().email(),
        password: Joi.string().required().min(8),
        name: Joi.string().required(),
        role: Joi.string().valid('USER', 'TECHNICIAN').default('USER'),
        passwordConfirm: Joi.string().valid(Joi.ref('password')).required().messages({ 'any.only': 'Passwords must match' }),
        phone: Joi.string().allow('', null), // Allow phone, make optional or required based on pref. Form sends it.
        pincode: Joi.string().required().messages({ 'any.required': 'Pincode is required' }),
        address: Joi.string().allow('', null),
        recaptchaToken: Joi.string()
    }),
};

const login = {
    body: Joi.object().keys({
        email: Joi.string().required(),
        password: Joi.string().required(),
        recaptchaToken: Joi.string(),
        role: Joi.string().valid('USER', 'TECHNICIAN', 'ADMIN'),
        rememberMe: Joi.boolean()
    }),
};

module.exports = {
    register,
    login,
};
