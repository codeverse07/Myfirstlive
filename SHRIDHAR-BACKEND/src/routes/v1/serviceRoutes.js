const express = require('express');
const serviceController = require('../../controllers/serviceController');
const authMiddleware = require('../../middlewares/auth');
const validate = require('../../utils/validate');
const serviceValidation = require('../../validations/service.validation');

const router = express.Router();

// Public Routes
router.get('/', validate(serviceValidation.getServices), serviceController.getAllServices);
router.get('/:id', serviceController.getService);

// Protected Routes
router.use(authMiddleware.protect);

router.post(
    '/',
    authMiddleware.restrictTo('TECHNICIAN', 'ADMIN'),
    require('../../middlewares/upload').single('headerImage'),
    validate(serviceValidation.createService),
    serviceController.createService
);

router.patch(
    '/:id',
    authMiddleware.restrictTo('TECHNICIAN', 'ADMIN'),
    validate(serviceValidation.updateService),
    serviceController.updateService
);

router.delete(
    '/:id',
    authMiddleware.restrictTo('TECHNICIAN', 'ADMIN'),
    serviceController.deleteService
);

module.exports = router;
