const express = require('express');
const router = express.Router();
const { getBanners } = require('../controllers/bannerController');

// @route   GET /api/banners
// @desc    Get all active banners for storefront
// @access  Public
router.get('/', getBanners);

module.exports = router;
