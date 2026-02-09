const express = require('express');
const authController = require('../../controllers/authController'); // Fix path if needed
const userController = require('../../controllers/userController'); // For getUser
const validate = require('../../utils/validate');
const authValidation = require('../../validations/auth.validation');
const authMiddleware = require('../../middlewares/auth');

const { authLimiter } = require('../../middlewares/rateLimit');
const { verifyRecaptcha } = require('../../middlewares/recaptcha');

const router = express.Router();

router.post(
    '/register',
    authLimiter,
    verifyRecaptcha,
    validate(authValidation.register),
    authController.register
);
router.post('/login', authLimiter, verifyRecaptcha, validate(authValidation.login), authController.login);
router.post('/logout', authController.logout);
router.post('/forgot-password-request', authLimiter, authController.forgotPasswordRequest);

// Example of how to get current user details
router.get('/me', authMiddleware.protect, authController.getMe, userController.getUser);

// Google OAuth
router.get('/google', authController.googleAuth);
router.get('/google/callback', authController.googleAuthCallback);

module.exports = router;
