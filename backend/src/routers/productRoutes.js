const express = require('express');
const router = express.Router();
const {
  getAll,
  getById,
  getByCategory,
  search,
  getFeatured,
  getReviews,
  addReview,
} = require('../controllers/productController');
const { protect } = require('../middleware/authMiddleware');

router.get('/', getAll);
router.get('/featured', getFeatured);
router.get('/search', search);
router.get('/category/:slug', getByCategory);
router.get('/:id', getById);
router.get('/:id/reviews', getReviews);
router.post('/:id/reviews', protect, addReview);

module.exports = router;
