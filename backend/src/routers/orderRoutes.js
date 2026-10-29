const express = require('express');
const router = express.Router();
const {
  getMyOrders,
  getById,
  cancelOrder,
  trackOrder,
  requestReturn,
} = require('../controllers/orderController');
const { protect, optionalAuth } = require('../middleware/authMiddleware');

// All customer order endpoints require authentication & ownership verification
router.get('/', protect, getMyOrders);
router.get('/my-orders', protect, getMyOrders);
router.get('/:id', optionalAuth, getById);
router.get('/:id/track', optionalAuth, trackOrder);
router.put('/:id/cancel', protect, cancelOrder);
router.post('/:id/return', protect, requestReturn);

module.exports = router;
