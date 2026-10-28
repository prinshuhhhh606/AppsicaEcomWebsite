const Payment = require('../models/payment');
const Order = require('../models/order');
const PaymentService = require('../services/paymentService');
const CheckoutService = require('../services/checkoutService');
const asyncHandler = require('../utils/asyncHandler');

// @desc    Initiate payment for an order
// @route   POST /api/payments/initiate
// @access  Public or Private
const initiate = asyncHandler(async (req, res) => {
  const { orderId } = req.body;
  const userId = req.user?._id || null;

  const paymentData = await PaymentService.initiate(orderId, userId);

  res.json({
    success: true,
    ...paymentData,
  });
});

// @desc    Verify / complete payment via backend verification mechanism
// @route   POST /api/payments/verify
// @access  Public or Private
const verify = asyncHandler(async (req, res) => {
  const { transactionId, paymentId, orderId, status = 'success', details = {} } = req.body;

  const result = await PaymentService.verify({
    transactionId,
    paymentId,
    orderId,
    status,
    details,
  });

  res.json({
    success: true,
    message: result.verified ? 'Payment verified successfully' : 'Payment verification failed',
    ...result,
  });
});

// @desc    Verify payment and create order directly in one atomic, idempotent call
// @route   POST /api/payments/verify-and-create-order
// @access  Private / Authenticated customer
const verifyAndCreateOrder = asyncHandler(async (req, res) => {
  const {
    items = [],
    cartItems = [],
    shippingAddress,
    paymentMethod = 'card',
    paymentStatus = 'Paid',
    transactionId,
    paymentDetails = {},
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
      message: 'Authentication required: Please sign in to verify payment and place your order.',
    });
  }

  const result = await CheckoutService.verifyPaymentAndCreateOrder({
    userId: req.user._id,
    items: targetItems,
    shippingAddress,
    paymentMethod,
    paymentStatus,
    transactionId,
    paymentDetails,
    couponCode,
    user: req.user,
  });

  const order = result.order;

  res.status(result.isDuplicate ? 200 : 201).json({
    success: true,
    isDuplicate: result.isDuplicate,
    message: result.isDuplicate
      ? 'Order already verified and confirmed'
      : 'Payment verified and order confirmed successfully',
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

// @desc    Get payment status by paymentId or transactionId
// @route   GET /api/payments/:paymentId
// @access  Public or Private
const getStatus = asyncHandler(async (req, res) => {
  const { paymentId } = req.params;

  let query = { transactionId: paymentId };
  if (paymentId.match(/^[0-9a-fA-F]{24}$/)) {
    query = { $or: [{ _id: paymentId }, { transactionId: paymentId }] };
  }

  const payment = await Payment.findOne(query).populate('order', 'orderId total paymentStatus');
  if (!payment) {
    return res.status(404).json({ success: false, message: 'Payment record not found' });
  }

  res.json({
    success: true,
    payment,
  });
});

// @desc    Get all payments (Admin)
// @route   GET /api/admin/payments
// @access  Private/Admin
const getAll = asyncHandler(async (req, res) => {
  const { status, page = 1, limit = 50 } = req.query;

  const query = {};
  if (status) query.status = status;

  const pageNum = parseInt(page, 10) || 1;
  const limitNum = parseInt(limit, 10) || 50;
  const skip = (pageNum - 1) * limitNum;

  const total = await Payment.countDocuments(query);
  const payments = await Payment.find(query)
    .populate('order', 'orderId total')
    .populate('user', 'name email')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limitNum);

  res.json({
    success: true,
    total,
    page: pageNum,
    pages: Math.ceil(total / limitNum) || 1,
    payments,
  });
});

// @desc    Refund payment (Admin)
// @route   POST /api/admin/payments/:paymentId/refund
// @access  Private/Admin
const refund = asyncHandler(async (req, res) => {
  const { paymentId } = req.params;

  const payment = await PaymentService.refund(paymentId);

  res.json({
    success: true,
    message: 'Payment refunded successfully',
    payment,
  });
});

module.exports = {
  initiate,
  verify,
  verifyAndCreateOrder,
  getStatus,
  getAll,
  refund,
};
