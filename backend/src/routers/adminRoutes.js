const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { adminOnly } = require('../middleware/adminMiddleware');

const { getDashboardStats } = require('../controllers/adminController');
const productController = require('../controllers/productController');
const categoryController = require('../controllers/categoryController');
const orderController = require('../controllers/orderController');
const customerController = require('../controllers/customerController');
const paymentController = require('../controllers/paymentController');
const bannerController = require('../controllers/bannerController');
const couponController = require('../controllers/couponController');
const shippingController = require('../controllers/shippingController');

// All admin routes require authentication and admin role
router.use(protect, adminOnly);

// Dashboard
router.get('/dashboard', getDashboardStats);

// Products
router.post('/products', productController.create);
router.put('/products/:id', productController.update);
router.delete('/products/:id', productController.delete);

// Categories
router.post('/categories', categoryController.create);
router.put('/categories/:id', categoryController.update);
router.delete('/categories/:id', categoryController.delete);

// Orders (Admin Management)
router.get('/orders', orderController.getAllOrders);
router.put('/orders/:id/status', orderController.updateStatus);
router.put('/orders/:id/tracking', orderController.updateTracking);
router.put('/orders/:id/verify-payment', orderController.verifyPayment);
router.post('/orders/:id/refund', orderController.processRefund);

// Customers
router.get('/customers', customerController.getCustomers);
router.get('/customers/:id', customerController.getCustomerById);

// Payments
router.get('/payments', paymentController.getAll);
router.post('/payments/:paymentId/refund', paymentController.refund);

// Banners
router.get('/banners', bannerController.getBanners);
router.post('/banners', bannerController.createBanner);
router.put('/banners/:id', bannerController.updateBanner);
router.delete('/banners/:id', bannerController.deleteBanner);

// Coupons
router.get('/coupons', couponController.getCoupons);
router.post('/coupons', couponController.createCoupon);
router.put('/coupons/:id', couponController.updateCoupon);
router.delete('/coupons/:id', couponController.deleteCoupon);

// Shipping
router.get('/shipping', shippingController.getShippingZones);
router.post('/shipping', shippingController.createShippingZone);
router.put('/shipping/:id', shippingController.updateShipping);
router.delete('/shipping/:id', shippingController.deleteShippingZone);

module.exports = router;
