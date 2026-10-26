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
  deleteVendorProduct,
  getVendorOrders,
  getVendorOrderById,
  updateVendorOrderStatus,
  getVendorReports,
  getVendorReviews,
  replyToReview,
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
router.delete('/products/:id', approvedVendorOnly, deleteVendorProduct);

// Orders
router.get('/orders', getVendorOrders);
router.get('/orders/:id', getVendorOrderById);
router.put('/orders/:id/status', approvedVendorOnly, updateVendorOrderStatus);

// Reports & Earnings
router.get('/reports', getVendorReports);

// Customer Reviews & Ratings
router.get('/reviews', getVendorReviews);
router.post('/reviews/:id/reply', approvedVendorOnly, replyToReview);

module.exports = router;
