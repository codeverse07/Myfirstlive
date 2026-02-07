const express = require('express');
const reviewController = require('../../controllers/reviewController');
const authMiddleware = require('../../middlewares/auth');
const validate = require('../../utils/validate');
const reviewValidation = require('../../validations/review.validation');

// mergeParams: true allows us to access parameters from parent routers 
// (e.g. /bookings/:bookingId/reviews and /workers/:workerId/reviews)
const router = express.Router({ mergeParams: true });

// Protect all routes
router.use(authMiddleware.protect);

router
    .route('/')
    .post(
        authMiddleware.restrictTo('USER'),
        validate(reviewValidation.createReview),
        reviewController.createReview
    )
    .get(reviewController.getTechnicianReviews)
    .patch(
        authMiddleware.restrictTo('USER'),
        reviewController.updateReview
    );

router.get('/all', authMiddleware.restrictTo('ADMIN'), reviewController.getAllReviews);
router.delete('/:id', authMiddleware.restrictTo('ADMIN'), reviewController.deleteReview); // New Admin Delete Route

router.get('/technician/:technicianId', reviewController.getTechnicianReviews);

module.exports = router;
