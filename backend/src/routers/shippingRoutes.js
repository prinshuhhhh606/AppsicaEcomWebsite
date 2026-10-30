const express = require('express');
const router = express.Router();
const shippingCourierController = require('../controllers/shippingCourierController');
const { protect } = require('../middleware/authMiddleware');
const { adminOnly } = require('../middleware/adminMiddleware');
const { vendorOnly } = require('../middleware/vendorMiddleware');

// Public endpoints
router.post('/serviceability', shippingCourierController.checkServiceability);
router.post('/calculate-rate', shippingCourierController.calculateRate);
router.get('/track/:awb', shippingCourierController.trackAwb);
router.post('/webhook/:provider', shippingCourierController.handleWebhook);

// Admin endpoints
router.post('/admin/test-connection', protect, adminOnly, shippingCourierController.testCourierConnection);
router.get('/admin/shipments', protect, adminOnly, shippingCourierController.getAdminShipments);
router.post('/admin/retry/:orderId', protect, adminOnly, shippingCourierController.adminRetryBooking);

// Seller/Vendor endpoints
router.post('/vendor/retry/:orderId', protect, vendorOnly, shippingCourierController.vendorRetryBooking);

module.exports = router;
