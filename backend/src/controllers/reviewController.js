const Review = require('../models/review');
const Product = require('../models/product');
const asyncHandler = require('../utils/asyncHandler');

// @desc    Get reviews for product
// @route   GET /api/reviews/:productId
// @access  Public
const getReviews = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const reviews = await Review.find({ product: productId }).sort({ createdAt: -1 });

  res.json({
    success: true,
    count: reviews.length,
    reviews,
  });
});

// @desc    Add review
// @route   POST /api/reviews/:productId
// @access  Private
const addReview = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const { rating, title, comment } = req.body;

  const product = await Product.findById(productId);
  if (!product) {
    return res.status(404).json({ success: false, message: 'Product not found' });
  }

  const review = await Review.create({
    product: product._id,
    user: req.user._id,
    userName: req.user.name,
    rating: Number(rating) || 5,
    title: title || '',
    comment: comment || 'Recommended!',
  });

  // Update product average rating
  const allReviews = await Review.find({ product: product._id });
  const total = allReviews.reduce((sum, r) => sum + r.rating, 0);
  product.rating = Number((total / allReviews.length).toFixed(1));
  product.reviewCount = allReviews.length;
  await product.save();

  res.status(201).json({
    success: true,
    review,
    averageRating: product.rating,
    totalReviews: product.reviewCount,
  });
});

// @desc    Delete review (Admin or Author)
// @route   DELETE /api/reviews/:id
// @access  Private
const deleteReview = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const review = await Review.findById(id);

  if (!review) {
    return res.status(404).json({ success: false, message: 'Review not found' });
  }

  if (review.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Not authorized to delete this review' });
  }

  const productId = review.product;
  await review.deleteOne();

  // Update product stats
  const allReviews = await Review.find({ product: productId });
  const product = await Product.findById(productId);
  if (product) {
    if (allReviews.length > 0) {
      const total = allReviews.reduce((sum, r) => sum + r.rating, 0);
      product.rating = Number((total / allReviews.length).toFixed(1));
      product.reviewCount = allReviews.length;
    } else {
      product.rating = 5.0;
      product.reviewCount = 0;
    }
    await product.save();
  }

  res.json({
    success: true,
    message: 'Review deleted',
  });
});

module.exports = {
  getReviews,
  addReview,
  deleteReview,
};
