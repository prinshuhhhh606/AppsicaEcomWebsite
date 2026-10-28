const express = require('express');
const router = express.Router();
const {
  initiate,
  verify,
  verifyAndCreateOrder,
  getStatus,
} = require('../controllers/paymentController');
const { optionalAuth, protect } = require('../middleware/authMiddleware');

router.post('/initiate', optionalAuth, initiate);
router.post('/verify', optionalAuth, verify);
router.post('/verify-and-create-order', protect, verifyAndCreateOrder);
router.get('/:paymentId', getStatus);

module.exports = router;
