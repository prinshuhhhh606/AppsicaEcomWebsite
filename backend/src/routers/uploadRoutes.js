const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { handleSingleUpload, handleMultipleUpload } = require('../middleware/uploadMiddleware');
const uploadController = require('../controllers/uploadController');

// All upload operations require authentication
router.use(protect);

// Single image upload
router.post('/single', handleSingleUpload('image'), uploadController.uploadSingle);

// Multiple image upload (up to 10 images)
router.post('/multiple', handleMultipleUpload('images', 10), uploadController.uploadMultiple);

module.exports = router;
