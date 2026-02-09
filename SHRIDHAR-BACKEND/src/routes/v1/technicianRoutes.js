const express = require('express');
const technicianController = require('../../controllers/technicianController');
const authMiddleware = require('../../middlewares/auth');
const validate = require('../../utils/validate');
const technicianValidation = require('../../validations/technician.validation');
const upload = require('../../middlewares/upload');
const reviewRouter = require('./reviewRoutes');

const router = express.Router();

// Mount review router
router.use('/:technicianId/reviews', reviewRouter);

// Protected routes (Specific routes must come before generic params like /:id)
router.get('/me', authMiddleware.protect, authMiddleware.restrictTo('TECHNICIAN'), technicianController.getMyProfile);

// Public routes (Discovery)
router.get('/', validate(technicianValidation.getTechnicians), technicianController.getAllTechnicians);
router.get('/:id', technicianController.getTechnician);

// Protected routes (Management)
router.use(authMiddleware.protect);

router.post('/documents',
    authMiddleware.restrictTo('USER', 'TECHNICIAN'),
    upload.fields([
        { name: 'aadharCard', maxCount: 1 },
        { name: 'panCard', maxCount: 1 },
        { name: 'resume', maxCount: 1 }
    ]),
    technicianController.uploadDocuments
);

router.post(
    '/profile',
    authMiddleware.restrictTo('USER', 'TECHNICIAN'),
    upload.single('profilePhoto'),
    validate(technicianValidation.createProfile),
    technicianController.createProfile
);

router.patch(
    '/profile',
    authMiddleware.restrictTo('TECHNICIAN'),
    upload.single('profilePhoto'),
    validate(technicianValidation.updateProfile),
    technicianController.updateProfile
);

router.patch(
    '/status',
    authMiddleware.restrictTo('TECHNICIAN'),
    technicianController.updateStatus
);

router.patch(
    '/request-reset',
    authMiddleware.restrictTo('TECHNICIAN'),
    technicianController.requestPasswordReset
);

module.exports = router;
