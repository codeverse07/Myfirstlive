const express = require('express');
const feedbackController = require('../../controllers/feedbackController');
const { protect, restrictTo } = require('../../middlewares/auth');

const router = express.Router();

// All feedback routes are protected
router.use(protect);

router.post('/', feedbackController.createFeedback);

// Public route for all authenticated users to view feedbacks
router.get('/', feedbackController.getAllFeedback);

// Admin only routes for managing feedback
router.use(restrictTo('ADMIN'));
router.patch('/:id/status', feedbackController.updateFeedbackStatus);
router.delete('/:id', feedbackController.deleteFeedback);

module.exports = router;
