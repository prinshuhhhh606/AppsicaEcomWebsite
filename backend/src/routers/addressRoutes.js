const express = require('express');
const router = express.Router();
const {
  getAddresses,
  addAddress,
  updateAddress,
  deleteAddress,
  setDefault,
} = require('../controllers/addressController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/', getAddresses);
router.post('/', addAddress);
router.put('/:id', updateAddress);
router.delete('/:id', deleteAddress);
router.put('/:id/default', setDefault);

module.exports = router;
