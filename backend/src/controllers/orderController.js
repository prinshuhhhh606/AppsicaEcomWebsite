const Order = require('../models/order');
const Product = require('../models/product');
const NotificationService = require('../services/notificationService');
const asyncHandler = require('../utils/asyncHandler');

// 7-Step Standard Delivery Timeline Steps
const TIMELINE_STEPS = [
  'Order Placed',
  'Confirmed',
  'Processing',
  'Ready to Ship',
  'Shipped',
  'Out for Delivery',
  'Delivered',
];

// Valid Status Transitions
const VALID_TRANSITIONS = {
  'Order Placed': ['Confirmed', 'Cancelled'],
  'Confirmed': ['Processing', 'Cancelled'],
  'Processing': ['Ready to Ship', 'Cancelled'],
  'Ready to Ship': ['Shipped', 'Cancelled'],
  'Shipped': ['Out for Delivery'],
  'Out for Delivery': ['Delivered'],
  'Delivered': ['Returned'],
  'Cancelled': [],
  'Returned': [],
};

// @desc    Get logged in user's orders
// @route   GET /api/orders
// @access  Private
const getMyOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({ user: req.user._id })
    .populate('items.product', 'name images')
    .sort({ createdAt: -1 });

  res.json({
    success: true,
    count: orders.length,
    orders,
  });
});

// @desc    Get single order by orderId or _id
// @route   GET /api/orders/:id
// @access  Public or Private (Ownership verified if authenticated)
const getById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  let query = { orderId: id };
  if (id.match(/^[0-9a-fA-F]{24}$/)) {
    query = { $or: [{ _id: id }, { orderId: id }] };
  }

  const order = await Order.findOne(query)
    .populate('items.product', 'name images stock')
    .populate('items.vendor', 'name email storeName phone')
    .populate('user', 'name email phone');

  if (!order) {
    return res.status(404).json({ success: false, message: 'Order record not found' });
  }

  // Multi-Role Authorization: allow Customer Owner, Admin, Order Vendors, and Assigned Riders
  const orderUserId = order.user ? (order.user._id ? order.user._id.toString() : order.user.toString()) : null;
  const currentUserId = req.user ? req.user._id.toString() : null;

  const isCustomerOwner = Boolean(currentUserId && orderUserId && currentUserId === orderUserId);
  const isAdmin = Boolean(req.user && req.user.role === 'admin');
  const isOrderVendor = Boolean(
    req.user &&
    req.user.role === 'vendor' &&
    order.items &&
    order.items.some((item) => {
      const vId = item.vendor?._id ? item.vendor._id.toString() : item.vendor?.toString();
      return vId === currentUserId;
    })
  );
  const isAssignedRider = Boolean(
    req.user &&
    req.user.role === 'delivery' &&
    (
      (order.deliveryPartner?._id ? order.deliveryPartner._id.toString() : order.deliveryPartner?.toString()) === currentUserId ||
      (order.items && order.items.some((item) => {
        const rId = item.deliveryPartner?._id ? item.deliveryPartner._id.toString() : item.deliveryPartner?.toString();
        return rId === currentUserId;
      }))
    )
  );

  const isDirectOrderIdQuery = Boolean(order.orderId && String(order.orderId).toUpperCase() === String(id).toUpperCase());

  if (!isDirectOrderIdQuery && orderUserId && req.user && !isCustomerOwner && !isAdmin && !isOrderVendor && !isAssignedRider) {
    return res.status(403).json({
      success: false,
      message: 'Forbidden: You are not authorized to view another customer\'s order.',
    });
  }

  res.json({
    success: true,
    order,
  });
});

// @desc    Track order timeline and courier milestones
// @route   GET /api/orders/:id/track
// @access  Private (Ownership verified)
const trackOrder = asyncHandler(async (req, res) => {
  const { id } = req.params;

  let query = { orderId: id };
  if (id.match(/^[0-9a-fA-F]{24}$/)) {
    query = { $or: [{ _id: id }, { orderId: id }] };
  }

  const order = await Order.findOne(query)
    .populate('items.product', 'name images')
    .populate('deliveryPartner', 'name phone vehicleType vehicleNumber deliveryRating currentLocation isOnline');
  if (!order) {
    return res.status(404).json({ success: false, message: 'Order record not found for tracking' });
  }

  // Multi-Role & Tracking Authorization: allow Customer Owner, Admin, Order Vendors, Assigned Riders, or direct orderId query
  const orderUserId = order.user ? (order.user._id ? order.user._id.toString() : order.user.toString()) : null;
  const currentUserId = req.user ? req.user._id.toString() : null;

  const isCustomerOwner = Boolean(currentUserId && orderUserId && currentUserId === orderUserId);
  const isAdmin = Boolean(req.user && req.user.role === 'admin');
  const isOrderVendor = Boolean(
    req.user &&
    req.user.role === 'vendor' &&
    order.items &&
    order.items.some((item) => {
      const vId = item.vendor?._id ? item.vendor._id.toString() : item.vendor?.toString();
      return vId === currentUserId;
    })
  );
  const isAssignedRider = Boolean(
    req.user &&
    req.user.role === 'delivery' &&
    (
      (order.deliveryPartner?._id ? order.deliveryPartner._id.toString() : order.deliveryPartner?.toString()) === currentUserId ||
      (order.items && order.items.some((item) => {
        const rId = item.deliveryPartner?._id ? item.deliveryPartner._id.toString() : item.deliveryPartner?.toString();
        return rId === currentUserId;
      }))
    )
  );

  const isDirectOrderIdQuery = Boolean(order.orderId && String(order.orderId).toUpperCase() === String(id).toUpperCase());

  if (!isDirectOrderIdQuery && orderUserId && req.user && !isCustomerOwner && !isAdmin && !isOrderVendor && !isAssignedRider) {
    return res.status(403).json({
      success: false,
      message: 'Forbidden: You can only track your own orders.',
    });
  }

  const currentStatus = order.orderStatus;
  const isCancelled = currentStatus === 'Cancelled';
  const isReturned = currentStatus === 'Returned';

  const STATUS_STEP_INDEX = {
    'Order Placed': 0,
    'Placed': 0,
    'Confirmed': 1,
    'Processing': 2,
    'Packed': 3,
    'Ready for Pickup': 3,
    'ready_for_pickup': 3,
    'Ready to Ship': 3,
    'Shipped': 4,
    'Picked Up': 4,
    'picked_up': 4,
    'Out for Delivery': 5,
    'out_for_delivery': 5,
    'Delivered': 6,
    'delivered': 6,
  };

  const STEP_ALIASES = {
    'Order Placed': ['Order Placed', 'Placed'],
    'Confirmed': ['Confirmed'],
    'Processing': ['Processing'],
    'Ready to Ship': ['Ready to Ship', 'Packed', 'Ready for Pickup', 'ready_for_pickup', 'packed'],
    'Shipped': ['Shipped', 'Picked Up', 'picked_up', 'Shipped / Picked Up'],
    'Out for Delivery': ['Out for Delivery', 'out_for_delivery'],
    'Delivered': ['Delivered', 'delivered'],
  };

  const currentStepIndex = STATUS_STEP_INDEX[currentStatus] !== undefined
    ? STATUS_STEP_INDEX[currentStatus]
    : TIMELINE_STEPS.indexOf(currentStatus);

  // Build real-time 7-stage milestone timeline
  const milestones = TIMELINE_STEPS.map((step, index) => {
    let completed = false;
    let isCurrent = false;

    if (!isCancelled && !isReturned) {
      if (currentStepIndex >= index) {
        completed = true;
      }
      if (currentStepIndex === index) {
        isCurrent = true;
      }
    }

    // Check if recorded in statusHistory using aliases
    const aliases = STEP_ALIASES[step] || [step];
    const historyItem = (order.statusHistory || []).find((h) => aliases.includes(h.status));

    let timestamp = historyItem ? historyItem.timestamp : null;
    if (!timestamp && completed) {
      if (step === 'Order Placed') timestamp = order.createdAt;
      else if (step === 'Confirmed') timestamp = order.confirmedAt || order.createdAt;
      else if (step === 'Shipped') timestamp = order.shippedAt || null;
      else if (step === 'Delivered') timestamp = order.deliveredAt || null;
      else timestamp = order.updatedAt;
    }

    return {
      step,
      completed,
      isCurrent,
      timestamp,
      note: historyItem?.note || '',
    };
  });

  res.json({
    success: true,
    orderId: order.orderId,
    invoiceNumber: order.invoiceNumber,
    status: order.orderStatus,
    paymentStatus: order.paymentStatus,
    paymentMethod: order.paymentMethod,
    courierName: order.courierName || 'BlueDart Express',
    trackingNumber: order.trackingNumber || 'Pending Dispatch',
    estimatedDeliveryDate: order.estimatedDeliveryDate,
    shippingAddress: order.shippingAddress,
    isCancelled,
    isReturned,
    cancelReason: order.cancelReason,
    returnReason: order.returnReason,
    deliveryStatus: order.deliveryStatus || 'Unassigned',
    deliveryPartner: order.deliveryPartner,
    deliveryOtp: (isCustomerOwner || isAdmin || isAssignedRider) ? (order.deliveryOtp || '') : '', // Visible to verified customer or assigned delivery rider
    deliveryDeliveredAt: order.deliveryDeliveredAt,
    deliveryFailedAt: order.deliveryFailedAt,
    deliveryFailureReason: order.deliveryFailureReason,
    milestones,
    history: order.statusHistory || [],
    order,
  });
});

// @desc    Cancel order & restore stock
// @route   PUT /api/orders/:id/cancel
// @access  Private
const cancelOrder = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { reason = 'Cancelled by customer' } = req.body;

  let query = { orderId: id };
  if (id.match(/^[0-9a-fA-F]{24}$/)) {
    query = { $or: [{ _id: id }, { orderId: id }] };
  }

  const order = await Order.findOne(query);
  if (!order) {
    return res.status(404).json({ success: false, message: 'Order not found' });
  }

  // Ensure owner or admin
  if (req.user && req.user.role !== 'admin') {
    if (order.user && order.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to cancel this order' });
    }
  }

  const cancellableStatuses = ['Order Placed', 'Confirmed', 'Processing'];
  if (!cancellableStatuses.includes(order.orderStatus)) {
    return res.status(400).json({
      success: false,
      message: `Cannot cancel order at "${order.orderStatus}" stage. Order has already been processed or dispatched.`,
    });
  }

  const previousStatus = order.orderStatus;
  order.orderStatus = 'Cancelled';
  order.cancelReason = reason;

  order.statusHistory.push({
    status: 'Cancelled',
    timestamp: new Date(),
    note: `Order cancelled: ${reason}`,
  });

  await order.save();

  // Restore inventory stock in MongoDB
  for (const item of order.items) {
    if (item.product) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { stock: item.quantity },
      });
    }
  }

  // Notification
  try {
    await NotificationService.sendStatusUpdate(order, previousStatus, 'Cancelled');
  } catch (err) {
    console.warn('Status notification notice:', err.message);
  }

  res.json({
    success: true,
    message: 'Order cancelled successfully and product inventory has been restored.',
    order,
  });
});

// @desc    Request return (Customer)
// @route   POST /api/orders/:id/return
// @access  Private
const requestReturn = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { reason = 'Customer requested return' } = req.body;

  let query = { orderId: id };
  if (id.match(/^[0-9a-fA-F]{24}$/)) {
    query = { $or: [{ _id: id }, { orderId: id }] };
  }

  const order = await Order.findOne(query);
  if (!order) {
    return res.status(404).json({ success: false, message: 'Order not found' });
  }

  if (order.orderStatus !== 'Delivered') {
    return res.status(400).json({
      success: false,
      message: 'Return requests can only be placed for Delivered orders within 7 days.',
    });
  }

  order.orderStatus = 'Returned';
  order.returnReason = reason;
  order.statusHistory.push({
    status: 'Returned',
    timestamp: new Date(),
    note: `Return initiated: ${reason}`,
  });

  await order.save();

  res.json({
    success: true,
    message: 'Return request placed successfully. Pickup will be coordinated by our logistics team.',
    order,
  });
});

// @desc    Get all orders with statistics (Admin)
// @route   GET /api/admin/orders
// @access  Private/Admin
const getAllOrders = asyncHandler(async (req, res) => {
  const { status, search, page = 1, limit = 50 } = req.query;

  const query = {};
  if (status && status !== 'all') {
    query.orderStatus = status;
  }

  if (search) {
    query.$or = [
      { orderId: { $regex: search, $options: 'i' } },
      { 'shippingAddress.fullName': { $regex: search, $options: 'i' } },
      { 'shippingAddress.phone': { $regex: search, $options: 'i' } },
      { transactionId: { $regex: search, $options: 'i' } },
    ];
  }

  const pageNum = parseInt(page, 10) || 1;
  const limitNum = parseInt(limit, 10) || 50;
  const skip = (pageNum - 1) * limitNum;

  const [total, orders, allOrdersForStats] = await Promise.all([
    Order.countDocuments(query),
    Order.find(query)
      .populate('user', 'name email phone')
      .populate('items.product', 'name images stock')
      .populate('items.vendor', 'name email storeName phone')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum),
    Order.find({}, 'orderStatus paymentStatus total'),
  ]);

  // Compute 7 required summary stats
  const stats = {
    totalOrders: allOrdersForStats.length,
    pendingOrders: allOrdersForStats.filter(
      (o) => o.paymentStatus === 'Pending' || o.orderStatus === 'Order Placed'
    ).length,
    processingOrders: allOrdersForStats.filter((o) => o.orderStatus === 'Processing').length,
    readyToShipOrders: allOrdersForStats.filter((o) => o.orderStatus === 'Ready to Ship').length,
    shippedOrders: allOrdersForStats.filter((o) => o.orderStatus === 'Shipped').length,
    deliveredOrders: allOrdersForStats.filter((o) => o.orderStatus === 'Delivered').length,
    cancelledOrders: allOrdersForStats.filter((o) => o.orderStatus === 'Cancelled').length,
  };

  res.json({
    success: true,
    stats,
    total,
    page: pageNum,
    pages: Math.ceil(total / limitNum) || 1,
    orders,
  });
});

// @desc    Update order status with transition validation (Admin)
// @route   PUT /api/admin/orders/:id/status
// @access  Private/Admin
const updateStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status, note = '' } = req.body;

  let query = { orderId: id };
  if (id.match(/^[0-9a-fA-F]{24}$/)) {
    query = { $or: [{ _id: id }, { orderId: id }] };
  }

  const order = await Order.findOne(query);
  if (!order) {
    return res.status(404).json({ success: false, message: 'Order not found' });
  }

  const previousStatus = order.orderStatus;

  // Validate allowed transition
  const allowedNext = VALID_TRANSITIONS[previousStatus] || [];
  if (status !== previousStatus && !allowedNext.includes(status) && req.user?.role !== 'admin') {
    return res.status(400).json({
      success: false,
      message: `Invalid status transition from "${previousStatus}" to "${status}". Allowed: ${allowedNext.join(', ')}`,
    });
  }

  order.orderStatus = status;

  // If status is Delivered, ensure payment is marked Paid
  if (status === 'Delivered') {
    order.paymentStatus = 'Paid';
    if (!order.paymentVerifiedAt) {
      order.paymentVerifiedAt = new Date();
    }
  }

  // If transitioned to Cancelled by admin, restore stock
  if (status === 'Cancelled' && previousStatus !== 'Cancelled') {
    for (const item of order.items) {
      if (item.product) {
        await Product.findByIdAndUpdate(item.product, {
          $inc: { stock: item.quantity },
        });
      }
    }
  }

  order.statusHistory.push({
    status,
    timestamp: new Date(),
    note: note || `Order updated to ${status} by administrator`,
  });

  await order.save();

  try {
    await NotificationService.sendStatusUpdate(order, previousStatus, status);
  } catch (err) {
    console.warn('Status notification notice:', err.message);
  }

  res.json({
    success: true,
    message: `Order status updated to "${status}"`,
    order,
  });
});

// @desc    Update courier name and tracking details (Admin)
// @route   PUT /api/admin/orders/:id/tracking
// @access  Private/Admin
const updateTracking = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { courierName, trackingNumber, estimatedDeliveryDate, autoAdvanceStatus = true } = req.body;

  let query = { orderId: id };
  if (id.match(/^[0-9a-fA-F]{24}$/)) {
    query = { $or: [{ _id: id }, { orderId: id }] };
  }

  const order = await Order.findOne(query);
  if (!order) {
    return res.status(404).json({ success: false, message: 'Order not found' });
  }

  if (courierName) order.courierName = courierName;
  if (trackingNumber) order.trackingNumber = trackingNumber;
  if (estimatedDeliveryDate) order.estimatedDeliveryDate = new Date(estimatedDeliveryDate);

  if (autoAdvanceStatus && ['Confirmed', 'Processing', 'Ready to Ship'].includes(order.orderStatus)) {
    const previous = order.orderStatus;
    order.orderStatus = 'Shipped';
    order.statusHistory.push({
      status: 'Shipped',
      timestamp: new Date(),
      note: `Dispatched with ${order.courierName} (Waybill: ${order.trackingNumber})`,
    });
  }

  await order.save();

  res.json({
    success: true,
    message: 'Shipment tracking information updated successfully',
    order,
  });
});

// @desc    Verify payment using backend verification mechanism (Admin)
// @route   PUT /api/admin/orders/:id/verify-payment
// @access  Private/Admin
const verifyPayment = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { transactionId = null } = req.body;

  let query = { orderId: id };
  if (id.match(/^[0-9a-fA-F]{24}$/)) {
    query = { $or: [{ _id: id }, { orderId: id }] };
  }

  const order = await Order.findOne(query);
  if (!order) {
    return res.status(404).json({ success: false, message: 'Order not found' });
  }

  order.paymentStatus = 'Paid';
  order.paymentVerifiedAt = new Date();
  if (transactionId) order.transactionId = transactionId;

  order.statusHistory.push({
    status: order.orderStatus,
    timestamp: new Date(),
    note: `Payment verified by administrator (${order.transactionId || 'Verified'})`,
  });

  await order.save();

  res.json({
    success: true,
    message: 'Payment verified and marked as Paid',
    order,
  });
});

// @desc    Process refund (Admin)
// @route   POST /api/admin/orders/:id/refund
// @access  Private/Admin
const processRefund = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { reason = 'Admin processed refund' } = req.body;

  let query = { orderId: id };
  if (id.match(/^[0-9a-fA-F]{24}$/)) {
    query = { $or: [{ _id: id }, { orderId: id }] };
  }

  const order = await Order.findOne(query);
  if (!order) {
    return res.status(404).json({ success: false, message: 'Order not found' });
  }

  order.paymentStatus = 'Refunded';
  order.orderStatus = 'Cancelled';
  order.cancelReason = reason;

  order.statusHistory.push({
    status: 'Cancelled',
    timestamp: new Date(),
    note: `Refund processed: ${reason}`,
  });

  await order.save();

  // Restore inventory
  for (const item of order.items) {
    if (item.product) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { stock: item.quantity },
      });
    }
  }

  res.json({
    success: true,
    message: 'Order refund has been processed and inventory restored',
    order,
  });
});

module.exports = {
  getMyOrders,
  getById,
  trackOrder,
  cancelOrder,
  requestReturn,
  getAllOrders,
  updateStatus,
  updateTracking,
  verifyPayment,
  processRefund,
};
