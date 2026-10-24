const CheckoutService = require('../services/checkoutService');
const Coupon = require('../models/coupon');
const ShippingZone = require('../models/shippingZone');
const asyncHandler = require('../utils/asyncHandler');

// @desc    Get checkout calculation summary
// @route   POST /api/checkout/summary
// @access  Public
const getCheckoutSummary = asyncHandler(async (req, res) => {
  const { cartItems = [], items = [], couponCode } = req.body;
  const targetItems = items.length ? items : cartItems;

  if (!targetItems || targetItems.length === 0) {
    return res.status(400).json({ success: false, message: 'No items provided for checkout' });
  }

  const totals = await CheckoutService.calculateTotals(targetItems, couponCode);

  res.json({
    success: true,
    ...totals,
  });
});

// @desc    Apply coupon
// @route   POST /api/checkout/coupon
// @access  Public
const applyCoupon = asyncHandler(async (req, res) => {
  const { code, subtotal = 0 } = req.body;

  if (!code) {
    return res.status(400).json({ success: false, message: 'Coupon code is required' });
  }

  const coupon = await Coupon.findOne({
    code: code.toUpperCase().trim(),
    isActive: true,
  });

  if (!coupon) {
    return res.status(404).json({ success: false, message: 'Invalid or inactive coupon code' });
  }

  if (coupon.expiryDate && new Date(coupon.expiryDate) < new Date()) {
    return res.status(400).json({ success: false, message: 'This coupon has expired' });
  }

  if (subtotal && subtotal < coupon.minOrderAmount) {
    return res.status(400).json({
      success: false,
      message: `Minimum order amount for this coupon is ₹${coupon.minOrderAmount}`,
    });
  }

  let discount = 0;
  if (coupon.discountType === 'percent') {
    discount = (subtotal * coupon.discountValue) / 100;
    if (coupon.maxDiscount && discount > coupon.maxDiscount) {
      discount = coupon.maxDiscount;
    }
  } else {
    discount = coupon.discountValue;
  }

  res.json({
    success: true,
    message: `Coupon "${coupon.code}" applied successfully`,
    coupon: {
      code: coupon.code,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      discount: Math.round(discount),
    },
  });
});

// @desc    Remove coupon
// @route   DELETE /api/checkout/coupon
// @access  Public
const removeCoupon = asyncHandler(async (req, res) => {
  res.json({
    success: true,
    message: 'Coupon removed',
  });
});

// @desc    Get delivery options based on pincode
// @route   GET /api/checkout/delivery
// @access  Public
const getDeliveryOptions = asyncHandler(async (req, res) => {
  const { pincode } = req.query;

  let zone = null;
  if (pincode) {
    zone = await ShippingZone.findOne({ pincodes: pincode, isActive: true });
  }

  const standardRate = zone ? zone.rate : 79;
  const freeThreshold = zone ? zone.freeShippingThreshold : 999;
  const estimatedDays = zone ? zone.estimatedDays : '3-5 business days';

  res.json({
    success: true,
    options: [
      {
        id: 'standard',
        name: 'Standard Delivery',
        rate: standardRate,
        freeThreshold,
        estimatedDays,
        description: `Delivered in ${estimatedDays}`,
      },
      {
        id: 'express',
        name: 'Express Delivery',
        rate: standardRate + 120,
        freeThreshold: null,
        estimatedDays: '1-2 business days',
        description: 'Priority handling and swift courier dispatch',
      },
    ],
  });
});

// @desc    Place order / complete checkout
// @route   POST /api/checkout/place-order (and POST /api/checkout)
// @access  Public or Private
const placeOrder = asyncHandler(async (req, res) => {
  const {
    cartItems = [],
    items = [],
    shippingAddress,
    paymentMethod = 'card',
    paymentStatus = null,
    transactionId = null,
    couponCode,
  } = req.body;

  const targetItems = items.length ? items : cartItems;

  if (!targetItems || targetItems.length === 0) {
    return res.status(400).json({ success: false, message: 'Your cart is empty' });
  }

  if (!shippingAddress || !shippingAddress.fullName || !shippingAddress.addressLine) {
    return res.status(400).json({ success: false, message: 'Valid shipping address is required' });
  }

  if (!req.user || !req.user._id) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required: Please sign in to place your order.',
    });
  }

  const userId = req.user._id;
  const user = req.user;

  const order = await CheckoutService.createOrder({
    userId,
    items: targetItems,
    shippingAddress,
    paymentMethod,
    paymentStatus,
    transactionId,
    couponCode,
    user,
  });

  res.status(201).json({
    success: true,
    message: 'Order confirmed successfully',
    id: order.orderId,
    orderId: order.orderId,
    invoiceNumber: order.invoiceNumber,
    transactionId: order.transactionId,
    paymentStatus: order.paymentStatus,
    paymentMethod: order.paymentMethod,
    status: order.orderStatus,
    orderStatus: order.orderStatus,
    total: order.total,
    trackingNumber: order.trackingNumber,
    estimatedDeliveryDate: order.estimatedDeliveryDate,
    order,
  });
});

module.exports = {
  getCheckoutSummary,
  applyCoupon,
  removeCoupon,
  getDeliveryOptions,
  placeOrder,
};
