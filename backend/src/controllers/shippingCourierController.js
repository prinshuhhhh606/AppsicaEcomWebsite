const CourierService = require('../services/courierService');
const Order = require('../models/order');
const SystemSetting = require('../models/systemSetting');
const asyncHandler = require('../utils/asyncHandler');

// @desc    Check PIN code serviceability
// @route   POST /api/shipping/serviceability
// @access  Public
const checkServiceability = asyncHandler(async (req, res) => {
  const { pickupPincode, deliveryPincode, weightKg, cod, orderValue } = req.body;

  if (!pickupPincode || !deliveryPincode) {
    return res.status(400).json({
      success: false,
      message: 'Both pickup and delivery PIN codes are required',
    });
  }

  const result = await CourierService.checkServiceability({
    pickupPincode,
    deliveryPincode,
    weightKg: Number(weightKg) || 0.5,
    cod: Boolean(cod),
    orderValue: Number(orderValue) || 500,
  });

  res.json({
    success: true,
    ...result,
  });
});

// @desc    Calculate courier shipping rate & ETA
// @route   POST /api/shipping/calculate-rate
// @access  Public
const calculateRate = asyncHandler(async (req, res) => {
  const {
    pickupPincode,
    deliveryPincode,
    weightKg,
    cod,
    orderSubtotal,
    length,
    breadth,
    height,
  } = req.body;

  const result = await CourierService.calculateShippingRate({
    pickupPincode,
    deliveryPincode,
    weightKg: Number(weightKg) || 0.5,
    cod: Boolean(cod),
    orderSubtotal: Number(orderSubtotal) || 0,
    length: Number(length) || 10,
    breadth: Number(breadth) || 10,
    height: Number(height) || 10,
  });

  res.json({
    success: true,
    ...result,
  });
});

// @desc    Live track courier shipment by AWB code
// @route   GET /api/shipping/track/:awb
// @access  Public
const trackAwb = asyncHandler(async (req, res) => {
  const { awb } = req.params;

  try {
    const result = await CourierService.trackShipment(awb);
    res.json({
      success: true,
      ...result,
    });
  } catch (err) {
    res.status(404).json({
      success: false,
      message: err.message || 'Tracking details not found for this AWB',
    });
  }
});

// @desc    Incoming courier webhook receiver (Shiprocket, Delhivery, BlueDart)
// @route   POST /api/shipping/webhook/:provider
// @access  Public (Authenticated by token / signature)
const handleWebhook = asyncHandler(async (req, res) => {
  const { provider } = req.params;
  const payload = req.body;
  const headers = req.headers;

  try {
    const result = await CourierService.handleWebhook(provider, payload, headers);
    res.json({
      success: true,
      result,
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: err.message || 'Webhook processing failed',
    });
  }
});

// @desc    Admin: Test courier API connection
// @route   POST /api/shipping/admin/test-connection
// @access  Private/Admin
const testCourierConnection = asyncHandler(async (req, res) => {
  const { provider = 'shiprocket' } = req.body;
  const providerInstance = await CourierService.getProvider(provider);

  const testResult = await providerInstance.testConnection();
  res.json({
    success: testResult.success,
    message: testResult.message,
    provider,
  });
});

// @desc    Admin: Get list of shipments grouped by category
// @route   GET /api/shipping/admin/shipments
// @access  Private/Admin
const getAdminShipments = asyncHandler(async (req, res) => {
  const { type = 'all', page = 1, limit = 50, search = '' } = req.query;

  const query = {};

  if (type === 'local') {
    query.deliveryMode = 'local';
  } else if (type === 'courier') {
    query.deliveryMode = 'standard_courier';
    query.courierBookingStatus = 'BOOKED';
  } else if (type === 'failed') {
    query.deliveryMode = 'standard_courier';
    query.courierBookingStatus = { $in: ['FAILED', 'RETRY_PENDING'] };
  } else if (type === 'returns') {
    query.orderStatus = { $in: ['Returned', 'cancelled', 'Cancelled'] };
  }

  if (search) {
    query.$or = [
      { orderId: { $regex: search, $options: 'i' } },
      { awbCode: { $regex: search, $options: 'i' } },
      { trackingNumber: { $regex: search, $options: 'i' } },
      { 'shippingAddress.fullName': { $regex: search, $options: 'i' } },
      { 'shippingAddress.pincode': { $regex: search, $options: 'i' } },
    ];
  }

  const pageNum = parseInt(page, 10) || 1;
  const limitNum = parseInt(limit, 10) || 50;
  const skip = (pageNum - 1) * limitNum;

  const [total, orders] = await Promise.all([
    Order.countDocuments(query),
    Order.find(query)
      .populate('user', 'name email phone')
      .populate('deliveryPartner', 'name phone')
      .populate('vendor', 'name storeName phone')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum),
  ]);

  res.json({
    success: true,
    total,
    page: pageNum,
    pages: Math.ceil(total / limitNum) || 1,
    orders,
  });
});

// @desc    Admin: Retry failed courier booking
// @route   POST /api/shipping/admin/retry/:orderId
// @access  Private/Admin
const adminRetryBooking = asyncHandler(async (req, res) => {
  const { orderId } = req.params;

  let query = { orderId };
  if (orderId.match(/^[0-9a-fA-F]{24}$/)) {
    query = { $or: [{ _id: orderId }, { orderId }] };
  }

  const order = await Order.findOne(query);
  if (!order) {
    return res.status(404).json({ success: false, message: 'Order not found' });
  }

  order.courierBookingStatus = 'UNBOOKED';
  order.courierBookingError = '';
  await order.save();

  const result = await CourierService.bookCourierShipment(order._id);

  res.json({
    success: result.success,
    message: result.success
      ? `Courier shipment successfully booked! AWB: ${result.awbCode}`
      : result.error || 'Courier booking retry failed',
    result,
  });
});

// @desc    Seller: Retry courier booking for their own sub-order
// @route   POST /api/shipping/vendor/retry/:orderId
// @access  Private/Vendor
const vendorRetryBooking = asyncHandler(async (req, res) => {
  const { orderId } = req.params;
  const vendorId = req.user._id;

  let query = { orderId };
  if (orderId.match(/^[0-9a-fA-F]{24}$/)) {
    query = { $or: [{ _id: orderId }, { orderId }] };
  }

  const order = await Order.findOne(query);
  if (!order) {
    return res.status(404).json({ success: false, message: 'Order not found' });
  }

  // Verify ownership
  const ownsOrder =
    (order.vendor && order.vendor.toString() === vendorId.toString()) ||
    order.items?.some((i) => i.vendor && i.vendor.toString() === vendorId.toString());

  if (!ownsOrder && req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Access denied: You do not own this order' });
  }

  order.courierBookingStatus = 'UNBOOKED';
  order.courierBookingError = '';
  await order.save();

  const result = await CourierService.bookCourierShipment(order._id);

  res.json({
    success: result.success,
    message: result.success
      ? `Courier shipment booked! AWB: ${result.awbCode}`
      : result.error || 'Courier booking retry failed',
    result,
  });
});

module.exports = {
  checkServiceability,
  calculateRate,
  trackAwb,
  handleWebhook,
  testCourierConnection,
  getAdminShipments,
  adminRetryBooking,
  vendorRetryBooking,
};
