const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { vendorOnly, approvedVendorOnly } = require('../middleware/vendorMiddleware');

const {
  registerVendor,
  loginVendor,
  getProfile,
  updateProfile,
  getDashboardStats,
  getVendorProducts,
  getVendorProductById,
  createVendorProduct,
  updateVendorProduct,
  toggleVendorProductStatus,
  deleteVendorProduct,
  getVendorOrders,
  getVendorOrderById,
  updateVendorOrderStatus,
  getAvailableDeliveryPartners,
  assignVendorOrderDelivery,
  getVendorReports,
  getVendorReviews,
  replyToReview,
  getVendorNotifications,
  markAllVendorNotificationsRead,
} = require('../controllers/vendorController');

// Public Vendor Routes
router.post('/register', registerVendor);
router.post('/login', loginVendor);

// Protected Vendor Routes (Require authentication & vendor or admin role)
router.use(protect, vendorOnly);

// Profile
router.get('/profile', getProfile);
router.put('/profile', updateProfile);

// Dashboard
router.get('/dashboard', getDashboardStats);

// Products
router.get('/products', getVendorProducts);
router.get('/products/:id', getVendorProductById);
router.post('/products', approvedVendorOnly, createVendorProduct);
router.put('/products/:id', approvedVendorOnly, updateVendorProduct);
router.patch('/products/:id/toggle-status', approvedVendorOnly, toggleVendorProductStatus);
router.delete('/products/:id', approvedVendorOnly, deleteVendorProduct);

// Orders & Fulfillment
router.get('/orders', getVendorOrders);
router.get('/orders/:id', getVendorOrderById);
router.put('/orders/:id/status', approvedVendorOnly, updateVendorOrderStatus);
router.get('/delivery-partners', approvedVendorOnly, getAvailableDeliveryPartners);
router.put('/orders/:id/assign-delivery', approvedVendorOnly, assignVendorOrderDelivery);

// Reports & Earnings
router.get('/reports', getVendorReports);

// Customer Reviews & Ratings
router.get('/reviews', getVendorReviews);
router.post('/reviews/:id/reply', approvedVendorOnly, replyToReview);

// Vendor Notifications
router.get('/notifications', getVendorNotifications);
router.put('/notifications/read-all', markAllVendorNotificationsRead);

module.exports = router;
