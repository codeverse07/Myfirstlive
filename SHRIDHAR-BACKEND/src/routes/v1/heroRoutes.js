const express = require('express');
const heroController = require('../../controllers/heroController');
const authMiddleware = require('../../middlewares/auth');

const router = express.Router();

// Public route to get active hero slides
router.get('/public', heroController.getPublicHeroes);

// Protect all routes after this middleware
router.use(authMiddleware.protect);
router.use(authMiddleware.restrictTo('ADMIN'));

router.get('/', heroController.getAllHeroes);
router.post('/', heroController.createHero);
router.patch('/:id', heroController.updateHero);
router.delete('/:id', heroController.deleteHero);

module.exports = router;
