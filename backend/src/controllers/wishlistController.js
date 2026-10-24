const Wishlist = require('../models/wishlist');
const Product = require('../models/product');
const asyncHandler = require('../utils/asyncHandler');

// @desc    Get user wishlist
// @route   GET /api/wishlist
// @access  Private
const getWishlist = asyncHandler(async (req, res) => {
  let wishlist = await Wishlist.findOne({ user: req.user._id }).populate({
    path: 'products',
    populate: { path: 'category', select: 'name slug' },
  });

  if (!wishlist) {
    wishlist = await Wishlist.create({ user: req.user._id, products: [] });
  }

  res.json({
    success: true,
    count: wishlist.products.length,
    wishlist: wishlist.products,
  });
});

// @desc    Add product to wishlist
// @route   POST /api/wishlist
// @access  Private
const addToWishlist = asyncHandler(async (req, res) => {
  const { productId } = req.body;

  const product = await Product.findById(productId);
  if (!product) {
    return res.status(404).json({ success: false, message: 'Product not found' });
  }

  let wishlist = await Wishlist.findOne({ user: req.user._id });
  if (!wishlist) {
    wishlist = new Wishlist({ user: req.user._id, products: [] });
  }

  if (!wishlist.products.includes(product._id)) {
    wishlist.products.push(product._id);
    await wishlist.save();
  }

  const populated = await Wishlist.findById(wishlist._id).populate({
    path: 'products',
    populate: { path: 'category', select: 'name slug' },
  });

  res.json({
    success: true,
    message: 'Added to wishlist',
    wishlist: populated.products,
  });
});

// @desc    Remove product from wishlist
// @route   DELETE /api/wishlist/:productId
// @access  Private
const removeFromWishlist = asyncHandler(async (req, res) => {
  const { productId } = req.params;

  let wishlist = await Wishlist.findOne({ user: req.user._id });
  if (wishlist) {
    wishlist.products = wishlist.products.filter(
      (p) => p.toString() !== productId
    );
    await wishlist.save();
  }

  res.json({
    success: true,
    message: 'Removed from wishlist',
  });
});

// @desc    Check if product is wishlisted
// @route   GET /api/wishlist/check/:productId
// @access  Private
const isWishlisted = asyncHandler(async (req, res) => {
  const { productId } = req.params;

  const wishlist = await Wishlist.findOne({ user: req.user._id });
  const isPresent = wishlist ? wishlist.products.some((p) => p.toString() === productId) : false;

  res.json({
    success: true,
    isWishlisted: isPresent,
  });
});

module.exports = {
  getWishlist,
  addToWishlist,
  removeFromWishlist,
  isWishlisted,
};
