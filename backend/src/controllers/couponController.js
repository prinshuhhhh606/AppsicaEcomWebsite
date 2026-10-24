const Coupon = require('../models/coupon');
const asyncHandler = require('../utils/asyncHandler');

// @desc    Get all coupons (Admin)
// @route   GET /api/admin/coupons
// @access  Private/Admin
const getCoupons = asyncHandler(async (req, res) => {
  const coupons = await Coupon.find({}).sort({ createdAt: -1 });

  res.json({
    success: true,
    count: coupons.length,
    coupons,
  });
});

// @desc    Create coupon
// @route   POST /api/admin/coupons
// @access  Private/Admin
const createCoupon = asyncHandler(async (req, res) => {
  const { code, discountType, discountValue, minOrderAmount, maxDiscount, expiryDate, isActive, usageLimit } = req.body;

  if (!code || !discountValue) {
    return res.status(400).json({ success: false, message: 'Coupon code and discount value are required' });
  }

  const existing = await Coupon.findOne({ code: code.toUpperCase().trim() });
  if (existing) {
    return res.status(409).json({ success: false, message: 'Coupon with this code already exists' });
  }

  const coupon = await Coupon.create({
    code: code.toUpperCase().trim(),
    discountType: discountType || 'percent',
    discountValue: Number(discountValue),
    minOrderAmount: minOrderAmount ? Number(minOrderAmount) : 0,
    maxDiscount: maxDiscount ? Number(maxDiscount) : null,
    expiryDate: expiryDate ? new Date(expiryDate) : null,
    isActive: isActive !== undefined ? !!isActive : true,
    usageLimit: usageLimit ? Number(usageLimit) : 1000,
  });

  res.status(201).json({
    success: true,
    coupon,
  });
});

// @desc    Update coupon
// @route   PUT /api/admin/coupons/:id
// @access  Private/Admin
const updateCoupon = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const coupon = await Coupon.findById(id);

  if (!coupon) {
    return res.status(404).json({ success: false, message: 'Coupon not found' });
  }

  if (req.body.code) req.body.code = req.body.code.toUpperCase().trim();
  Object.assign(coupon, req.body);
  const updated = await coupon.save();

  res.json({
    success: true,
    coupon: updated,
  });
});

// @desc    Delete coupon
// @route   DELETE /api/admin/coupons/:id
// @access  Private/Admin
const deleteCoupon = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const coupon = await Coupon.findByIdAndDelete(id);

  if (!coupon) {
    return res.status(404).json({ success: false, message: 'Coupon not found' });
  }

  res.json({
    success: true,
    message: 'Coupon deleted successfully',
  });
});

// @desc    Validate coupon (Public)
// @route   POST /api/coupons/validate
// @access  Public
const validateCoupon = asyncHandler(async (req, res) => {
  const { code, amount = 0 } = req.body;

  if (!code) {
    return res.status(400).json({ success: false, message: 'Code is required' });
  }

  const coupon = await Coupon.findOne({ code: code.toUpperCase().trim(), isActive: true });
  if (!coupon) {
    return res.status(404).json({ success: false, message: 'Invalid coupon code' });
  }

  if (coupon.expiryDate && new Date(coupon.expiryDate) < new Date()) {
    return res.status(400).json({ success: false, message: 'This coupon has expired' });
  }

  if (amount < coupon.minOrderAmount) {
    return res.status(400).json({
      success: false,
      message: `Minimum order amount of ₹${coupon.minOrderAmount} required for this coupon`,
    });
  }

  let discount = 0;
  if (coupon.discountType === 'percent') {
    discount = (amount * coupon.discountValue) / 100;
    if (coupon.maxDiscount && discount > coupon.maxDiscount) {
      discount = coupon.maxDiscount;
    }
  } else {
    discount = coupon.discountValue;
  }

  res.json({
    success: true,
    valid: true,
    discount: Math.round(discount),
    coupon,
  });
});

module.exports = {
  getCoupons,
  createCoupon,
  updateCoupon,
  deleteCoupon,
  validateCoupon,
};
