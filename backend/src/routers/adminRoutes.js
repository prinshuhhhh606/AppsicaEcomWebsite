const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { adminOnly } = require('../middleware/adminMiddleware');

const adminController = require('../controllers/adminController');
const productController = require('../controllers/productController');
const categoryController = require('../controllers/categoryController');
const orderController = require('../controllers/orderController');
const customerController = require('../controllers/customerController');
const paymentController = require('../controllers/paymentController');
const bannerController = require('../controllers/bannerController');
const couponController = require('../controllers/couponController');
const shippingController = require('../controllers/shippingController');
const vendorController = require('../controllers/vendorController');

// All admin routes require authentication and admin role (RBAC)
router.use(protect, adminOnly);

// 1. Dashboard
router.get('/dashboard', adminController.getDashboardStats);

// 2. Products & Moderation
router.get('/products', productController.getAllForAdmin);
router.post('/products', productController.create);
router.put('/products/:id', productController.update);
router.delete('/products/:id', productController.delete);
router.put('/products/:id/approval', adminController.moderateProduct);

// 3. Categories
router.get('/categories', categoryController.getAll);
router.post('/categories', categoryController.create);
router.put('/categories/:id', categoryController.update);
router.delete('/categories/:id', categoryController.delete);

// 4. Orders (Admin Lifecycle Management)
router.get('/orders', orderController.getAllOrders);
router.put('/orders/:id/status', orderController.updateStatus);
router.put('/orders/:id/tracking', orderController.updateTracking);
router.put('/orders/:id/verify-payment', orderController.verifyPayment);
router.post('/orders/:id/refund', orderController.processRefund);

// 5. Customers (Users)
router.get('/customers', customerController.getCustomers);
router.get('/customers/:id', customerController.getCustomerById);
router.put('/customers/:id/status', adminController.updateCustomerStatus);

// 6. Payments
router.get('/payments', paymentController.getAll);
router.post('/payments/:paymentId/refund', paymentController.refund);

// 7. Vendors & Vendor Applications
router.get('/vendors', vendorController.getAllVendorsForAdmin);
router.put('/vendors/:id/status', vendorController.updateVendorStatusByAdmin);

// 8. Commissions & Payouts
router.get('/payouts', adminController.getPayouts);
router.post('/payouts', adminController.createPayout);
router.put('/payouts/:id', adminController.updatePayoutStatus);

// 9. Returns, Refunds & Disputes
router.get('/returns', adminController.getReturnRequests);
router.put('/returns/:id/status', adminController.updateReturnStatus);

// 10. Banners & Content
router.get('/banners', bannerController.getBanners);
router.post('/banners', bannerController.createBanner);
router.put('/banners/:id', bannerController.updateBanner);
router.delete('/banners/:id', bannerController.deleteBanner);

// 11. Coupons & Promotions
router.get('/coupons', couponController.getCoupons);
router.post('/coupons', couponController.createCoupon);
router.put('/coupons/:id', couponController.updateCoupon);
router.delete('/coupons/:id', couponController.deleteCoupon);

// 12. Shipping Zones & Courier Logistics
router.get('/shipping', shippingController.getShippingZones);
router.post('/shipping', shippingController.createShippingZone);
router.put('/shipping/:id', shippingController.updateShipping);
router.delete('/shipping/:id', shippingController.deleteShippingZone);

// 13. System Audit Logs
router.get('/audit-logs', adminController.getAuditLogs);

// 14. Admin Notifications
router.get('/notifications', adminController.getAdminNotifications);
router.put('/notifications/read-all', adminController.markAllNotificationsRead);

// 15. System Settings & Global Commission
router.get('/settings', adminController.getSystemSettings);
router.put('/settings', adminController.updateSystemSettings);

// 16. Reports & CSV Export Data
router.get('/reports', adminController.getReportsData);

// 17. Delivery Fleet & Assignment
router.get('/delivery-partners', adminController.getAllDeliveryPartners);
router.put('/delivery-partners/:id/status', adminController.updateDeliveryPartnerStatus);
router.put('/orders/:id/assign-delivery', adminController.assignOrderDelivery);
router.get('/delivery-earnings', adminController.getDeliveryEarningsLedger);

module.exports = router;
