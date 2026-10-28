const Cart = require('../models/cart');
const Product = require('../models/product');
const asyncHandler = require('../utils/asyncHandler');

// Helper to calculate totals
const formatCartResponse = (cart) => {
  const items = cart.items.map((item) => {
    const isAvailable = Boolean(item.product && !item.product.isArchived && item.product.isActive !== false);
    return {
      _id: item._id,
      productId: item.product?._id || item.product,
      product: item.product,
      quantity: item.quantity,
      price: item.price,
      variant: item.variant,
      subtotal: item.price * item.quantity,
      isAvailable,
    };
  });

  const availableItems = items.filter((i) => i.isAvailable !== false);
  const cartTotal = availableItems.reduce((sum, item) => sum + item.subtotal, 0);
  const cartCount = availableItems.reduce((sum, item) => sum + item.quantity, 0);

  return {
    _id: cart._id,
    items,
    cartTotal,
    cartCount,
    delivery: cartTotal >= 999 || cartTotal === 0 ? 0 : 79,
  };
};

// @desc    Get user cart
// @route   GET /api/cart
// @access  Private
const getCart = asyncHandler(async (req, res) => {
  let cart = await Cart.findOne({ user: req.user._id }).populate({
    path: 'items.product',
    select: 'name price originalPrice images stock category isActive isArchived',
    populate: { path: 'category', select: 'name slug' },
  });

  if (!cart) {
    cart = await Cart.create({ user: req.user._id, items: [] });
  }

  res.json({
    success: true,
    cart: formatCartResponse(cart),
  });
});

// @desc    Add item to cart
// @route   POST /api/cart
// @access  Private
const addToCart = asyncHandler(async (req, res) => {
  const { productId, quantity = 1, variant } = req.body;

  const product = await Product.findById(productId);
  if (!product || product.isArchived) {
    return res.status(404).json({ success: false, message: 'Product not found or has been discontinued' });
  }

  if (product.isActive === false) {
    return res.status(400).json({
      success: false,
      message: 'This product has been temporarily deactivated by the seller and cannot be added to cart.',
    });
  }

  if (product.vendor && product.vendorStatus !== 'approved') {
    return res.status(400).json({
      success: false,
      message: 'This product is currently undergoing moderation and cannot be purchased yet.',
    });
  }

  let cart = await Cart.findOne({ user: req.user._id });
  if (!cart) {
    cart = new Cart({ user: req.user._id, items: [] });
  }

  const existingItemIndex = cart.items.findIndex(
    (item) => item.product.toString() === productId && item.variant === (variant || null)
  );

  const addQty = Math.max(1, Number(quantity));

  if (existingItemIndex > -1) {
    cart.items[existingItemIndex].quantity += addQty;
  } else {
    cart.items.push({
      product: product._id,
      quantity: addQty,
      price: product.price,
      variant: variant || null,
    });
  }

  await cart.save();

  const populated = await Cart.findById(cart._id).populate({
    path: 'items.product',
    select: 'name price originalPrice images stock category',
    populate: { path: 'category', select: 'name slug' },
  });

  res.json({
    success: true,
    message: 'Item added to cart',
    cart: formatCartResponse(populated),
  });
});

// @desc    Update item quantity in cart
// @route   PUT /api/cart/:itemId
// @access  Private
const updateQuantity = asyncHandler(async (req, res) => {
  const { itemId } = req.params;
  const { quantity } = req.body;

  const cart = await Cart.findOne({ user: req.user._id });
  if (!cart) {
    return res.status(404).json({ success: false, message: 'Cart not found' });
  }

  const itemIndex = cart.items.findIndex(
    (item) => item._id.toString() === itemId || item.product.toString() === itemId
  );

  if (itemIndex === -1) {
    return res.status(404).json({ success: false, message: 'Item not in cart' });
  }

  const newQty = Number(quantity);
  if (newQty <= 0) {
    cart.items.splice(itemIndex, 1);
  } else {
    cart.items[itemIndex].quantity = newQty;
  }

  await cart.save();

  const populated = await Cart.findById(cart._id).populate({
    path: 'items.product',
    select: 'name price originalPrice images stock category',
  });

  res.json({
    success: true,
    message: 'Cart updated',
    cart: formatCartResponse(populated),
  });
});

// @desc    Remove item from cart
// @route   DELETE /api/cart/:itemId
// @access  Private
const removeItem = asyncHandler(async (req, res) => {
  const { itemId } = req.params;

  const cart = await Cart.findOne({ user: req.user._id });
  if (!cart) {
    return res.status(404).json({ success: false, message: 'Cart not found' });
  }

  cart.items = cart.items.filter(
    (item) => item._id.toString() !== itemId && item.product.toString() !== itemId
  );

  await cart.save();

  const populated = await Cart.findById(cart._id).populate({
    path: 'items.product',
    select: 'name price originalPrice images stock category',
  });

  res.json({
    success: true,
    message: 'Item removed from cart',
    cart: formatCartResponse(populated),
  });
});

// @desc    Clear entire cart
// @route   DELETE /api/cart
// @access  Private
const clearCart = asyncHandler(async (req, res) => {
  const cart = await Cart.findOne({ user: req.user._id });
  if (cart) {
    cart.items = [];
    await cart.save();
  }

  res.json({
    success: true,
    message: 'Cart cleared',
    cart: { items: [], cartTotal: 0, cartCount: 0, delivery: 0 },
  });
});

module.exports = {
  getCart,
  addToCart,
  updateQuantity,
  removeItem,
  clearCart,
};
