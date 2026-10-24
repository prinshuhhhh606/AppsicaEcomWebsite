const express = require('express');
const router = express.Router();
const {
  getCheckoutSummary,
  applyCoupon,
  removeCoupon,
  getDeliveryOptions,
  placeOrder,
} = require('../controllers/checkoutController');
const { protect, optionalAuth } = require('../middleware/authMiddleware');

// Public calculations for cart & checkout preview
router.post('/summary', optionalAuth, getCheckoutSummary);
router.post('/coupon', applyCoupon);
router.delete('/coupon', removeCoupon);
router.get('/delivery', getDeliveryOptions);

// Order placement strictly requires authenticated customer
router.post('/place-order', protect, placeOrder);
router.post('/', protect, placeOrder);

module.exports = router;
