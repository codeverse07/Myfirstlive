const express = require('express');
const userController = require('../../controllers/userController');
const authController = require('../../controllers/authController');
const authMiddleware = require('../../middlewares/auth');
const validate = require('../../utils/validate');
const userValidation = require('../../validations/user.validation');

const router = express.Router();

const upload = require('../../middlewares/upload');

// Protect all routes after this middleware
router.use(authMiddleware.protect);

router.patch('/updatePassword', authController.updatePassword);

// Duplicate endpoint removed - use /auth/me instead
router.patch('/update-me', upload.single('profilePhoto'), validate(userValidation.updateMe), userController.updateMe);
router.delete('/delete-me', userController.deleteMe);

module.exports = router;
