const express = require('express');
const router = express.Router();
const {
  initiate,
  verify,
  getStatus,
} = require('../controllers/paymentController');
const { optionalAuth } = require('../middleware/authMiddleware');

router.post('/initiate', optionalAuth, initiate);
router.post('/verify', optionalAuth, verify);
router.get('/:paymentId', getStatus);

module.exports = router;
