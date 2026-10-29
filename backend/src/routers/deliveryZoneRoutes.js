const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { vendorOnly } = require('../middleware/vendorMiddleware');
const {
  getSellerDeliveryZones,
  createDeliveryZone,
  updateDeliveryZone,
  deleteDeliveryZone,
  getSellerStoreLocation,
  updateSellerStoreLocation,
  checkEligibility,
} = require('../controllers/deliveryZoneController');

// Public availability check endpoint
router.post('/check-eligibility', checkEligibility);

// Seller/Vendor protected endpoints
router.use(protect, vendorOnly);

router.get('/my-zones', getSellerDeliveryZones);
router.post('/', createDeliveryZone);
router.put('/store-location', updateSellerStoreLocation);
router.get('/store-location', getSellerStoreLocation);
router.put('/:id', updateDeliveryZone);
router.delete('/:id', deleteDeliveryZone);

module.exports = router;

