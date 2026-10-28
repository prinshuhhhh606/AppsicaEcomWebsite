const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { deliveryOnly, approvedDeliveryOnly } = require('../middleware/deliveryMiddleware');
const deliveryController = require('../controllers/deliveryController');

// 1. Public Auth Routes
router.post('/register', deliveryController.register);
router.post('/login', deliveryController.login);

// All subsequent routes require authentication and delivery partner role
router.use(protect, deliveryOnly);

// 2. Profile & Status (allowed even if pending approval to view status)
router.get('/profile', deliveryController.getProfile);
router.put('/profile', deliveryController.updateProfile);
router.get('/notifications', deliveryController.getNotifications);
router.put('/notifications/read-all', deliveryController.markAllNotificationsRead);

// 3. Operational Delivery Routes (Require approved status)
router.use(approvedDeliveryOnly);

// Availability & Live Tracking
router.put('/toggle-availability', deliveryController.toggleAvailability);
router.put('/location', deliveryController.updateLocation);

// Dashboard
router.get('/dashboard', deliveryController.getDashboardStats);

// Orders & Lifecycle
router.get('/assigned-orders', deliveryController.getAssignedOrders);
router.get('/order/:id', deliveryController.getOrderDetails);
router.put('/order/:id/accept', deliveryController.acceptAssignment);
router.put('/order/:id/reject', deliveryController.rejectAssignment);
router.put('/order/:id/arrive-pickup', deliveryController.arriveAtPickup);
router.put('/order/:id/confirm-pickup', deliveryController.confirmPickup);
router.put('/order/:id/pickup-exception', deliveryController.reportPickupException);
router.put('/order/:id/out-for-delivery', deliveryController.startOutForDelivery);
router.put('/order/:id/verify-otp', deliveryController.verifyOtpAndDeliver);
router.put('/order/:id/delivery-failed', deliveryController.recordDeliveryFailed);

// History & Earnings
router.get('/history', deliveryController.getDeliveryHistory);
router.get('/earnings', deliveryController.getEarnings);

module.exports = router;
