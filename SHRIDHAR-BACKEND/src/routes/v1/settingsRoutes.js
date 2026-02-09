const express = require('express');
const adminController = require('../../controllers/adminController');

const router = express.Router();

router.get('/public', adminController.getPublicSettings);

module.exports = router;
