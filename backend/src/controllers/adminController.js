const Order = require('../models/order');
const Product = require('../models/product');
const User = require('../models/user');
const Payment = require('../models/payment');
const Payout = require('../models/payout');
const ReturnRequest = require('../models/returnRequest');
const AuditLog = require('../models/auditLog');
const AdminNotification = require('../models/adminNotification');
const SystemSetting = require('../models/systemSetting');
const DeliveryEarning = require('../models/deliveryEarning');
const DeliveryNotification = require('../models/deliveryNotification');
const asyncHandler = require('../utils/asyncHandler');

// Helper to log audit actions safely
const logAudit = async (req, category, action, target, details, status = 'SUCCESS') => {
  try {
    await AuditLog.create({
      admin: req.user?._id || null,
      adminEmail: req.user?.email || 'admin@appsica.com',
      adminName: req.user?.name || 'Appsica Administrator',
      category,
      action,
      target,
      details,
      status,
      ipAddress: req.ip || req.connection?.remoteAddress || '127.0.0.1',
    });
  } catch (err) {
    console.error('Audit log creation error:', err.message);
  }
};

// ==========================================
// 1. COMPREHENSIVE DASHBOARD METRICS
// ==========================================
// @desc    Get complete real-time dashboard statistics
// @route   GET /api/admin/dashboard
// @access  Private/Admin
const getDashboardStats = asyncHandler(async (req, res) => {
  const { timeframe = 'monthly' } = req.query;

  const [
    totalProducts,
    pendingProducts,
    totalCustomers,
    totalVendors,
    activeVendors,
    pendingVendors,
    orders,
    payments,
    payouts,
    returns,
  ] = await Promise.all([
    Product.countDocuments({}),
    Product.countDocuments({ vendorStatus: 'pending' }),
    User.countDocuments({ role: 'user' }),
    User.countDocuments({ role: 'vendor' }),
    User.countDocuments({ role: 'vendor', vendorStatus: 'approved' }),
    User.countDocuments({ role: 'vendor', vendorStatus: 'pending' }),
    Order.find({}).sort({ createdAt: -1 }),
    Payment.find({}).sort({ createdAt: -1 }),
    Payout.find({}),
    ReturnRequest.find({}),
  ]);

  const totalOrders = orders.length;
  let totalSales = 0;
  let pendingOrders = 0;
  let completedOrders = 0;
  let cancelledOrders = 0;
  let platformCommission = 0;

  orders.forEach((ord) => {
    const isCancelled = ord.orderStatus === 'Cancelled' || ord.orderStatus === 'cancelled';
    const isDelivered = ord.orderStatus === 'Delivered' || ord.orderStatus === 'delivered';

    if (!isCancelled) {
      const orderTotal = ord.total || 0;
      totalSales += orderTotal;
      // Default 10% platform commission retained
      platformCommission += Math.round(orderTotal * 0.1);
    }

    if (isDelivered) {
      completedOrders += 1;
    } else if (
      ord.orderStatus === 'Pending' ||
      ord.orderStatus === 'Processing' ||
      ord.orderStatus === 'Order Placed' ||
      ord.orderStatus === 'Confirmed'
    ) {
      pendingOrders += 1;
    } else if (isCancelled) {
      cancelledOrders += 1;
    }
  });

  // Calculate refund statistics
  const totalRefundAmount = returns
    .filter((r) => r.status === 'refunded' || r.status === 'approved')
    .reduce((sum, r) => sum + (r.refundAmount || 0), 0);
  const pendingReturnRequests = returns.filter((r) => r.status === 'pending').length;

  // Calculate payouts balance
  const totalSettledPayouts = payouts
    .filter((p) => p.status === 'paid')
    .reduce((sum, p) => sum + (p.amount || 0), 0);
  const pendingPayoutsAmount = payouts
    .filter((p) => p.status === 'pending')
    .reduce((sum, p) => sum + (p.amount || 0), 0);

  // Sales Trends (Daily, Weekly, Monthly, Yearly)
  const now = new Date();
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const salesTrend = [];

  if (timeframe === 'daily') {
    // Last 7 days
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dayLabel = d.toLocaleDateString('en-US', { weekday: 'short', month: 'numeric', day: 'numeric' });
      const dayStart = new Date(d.setHours(0, 0, 0, 0));
      const dayEnd = new Date(d.setHours(23, 59, 59, 999));

      const dayOrders = orders.filter((o) => {
        const oDate = new Date(o.createdAt);
        return oDate >= dayStart && oDate <= dayEnd && o.orderStatus !== 'Cancelled';
      });

      const daySales = dayOrders.reduce((acc, curr) => acc + (curr.total || 0), 0);
      salesTrend.push({
        label: dayLabel,
        sales: daySales,
        orders: dayOrders.length,
        commission: Math.round(daySales * 0.1),
      });
    }
  } else if (timeframe === 'weekly') {
    // Last 4 weeks
    for (let i = 3; i >= 0; i--) {
      const label = `Week ${4 - i}`;
      const weekStart = new Date(now.getTime() - (i + 1) * 7 * 24 * 3600 * 1000);
      const weekEnd = new Date(now.getTime() - i * 7 * 24 * 3600 * 1000);

      const weekOrders = orders.filter((o) => {
        const oDate = new Date(o.createdAt);
        return oDate >= weekStart && oDate <= weekEnd && o.orderStatus !== 'Cancelled';
      });

      const weekSales = weekOrders.reduce((acc, curr) => acc + (curr.total || 0), 0);
      salesTrend.push({
        label,
        sales: weekSales,
        orders: weekOrders.length,
        commission: Math.round(weekSales * 0.1),
      });
    }
  } else if (timeframe === 'yearly') {
    // Past 4 years
    const currentYear = now.getFullYear();
    for (let y = currentYear - 3; y <= currentYear; y++) {
      const yearOrders = orders.filter((o) => {
        const oYear = new Date(o.createdAt).getFullYear();
        return oYear === y && o.orderStatus !== 'Cancelled';
      });
      const yearSales = yearOrders.reduce((acc, curr) => acc + (curr.total || 0), 0);
      salesTrend.push({
        label: `${y}`,
        sales: yearSales,
        orders: yearOrders.length,
        commission: Math.round(yearSales * 0.1),
      });
    }
  } else {
    // Monthly (last 6 months)
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const mName = months[d.getMonth()];
      const mYear = d.getFullYear();
      const monthStart = new Date(mYear, d.getMonth(), 1);
      const monthEnd = new Date(mYear, d.getMonth() + 1, 0, 23, 59, 59);

      const mOrders = orders.filter((o) => {
        const oDate = new Date(o.createdAt);
        return oDate >= monthStart && oDate <= monthEnd && o.orderStatus !== 'Cancelled';
      });

      const mSales = mOrders.reduce((acc, curr) => acc + (curr.total || 0), 0);
      salesTrend.push({
        label: `${mName} ${mYear}`,
        sales: mSales,
        orders: mOrders.length,
        commission: Math.round(mSales * 0.1),
      });
    }
  }

  // Recent 5 Orders
  const recentOrders = orders.slice(0, 6);

  // Recent 5 Customer Registrations
  const recentCustomers = await User.find({ role: 'user' })
    .select('-password')
    .sort({ createdAt: -1 })
    .limit(5);

  // Top Products by sales / rating
  const popularProducts = await Product.find({})
    .populate('category', 'name')
    .sort({ rating: -1, reviewCount: -1 })
    .limit(5);

  // Top Performing Vendors
  const vendorsList = await User.find({ role: 'vendor' }).select('-password');
  const topVendors = await Promise.all(
    vendorsList.map(async (v) => {
      const vOrders = await Order.find({ 'items.vendor': v._id, orderStatus: { $ne: 'Cancelled' } });
      const vSales = vOrders.reduce((sum, ord) => {
        const vendorSubtotal = (ord.items || [])
          .filter((item) => String(item.vendor) === String(v._id))
          .reduce((itemSum, item) => itemSum + item.price * item.quantity, 0);
        return sum + vendorSubtotal;
      }, 0);
      const prodCount = await Product.countDocuments({ vendor: v._id });

      return {
        _id: v._id,
        name: v.name,
        storeName: v.storeName || v.name,
        storeLogo: v.storeLogo,
        vendorStatus: v.vendorStatus,
        productCount: prodCount,
        totalSales: vSales,
        netPayout: Math.round(vSales * 0.9),
      };
    })
  );
  topVendors.sort((a, b) => b.totalSales - a.totalSales);

  res.json({
    success: true,
    stats: {
      totalSales,
      platformRevenue: platformCommission,
      totalOrders,
      pendingOrders,
      completedOrders,
      cancelledOrders,
      totalCustomers,
      totalVendors,
      activeVendors,
      pendingVendors,
      totalProducts,
      pendingProducts,
      totalRefundAmount,
      pendingReturnRequests,
      totalSettledPayouts,
      pendingPayoutsAmount,
    },
    salesTrend,
    recentOrders,
    recentCustomers,
    popularProducts,
    topVendors: topVendors.slice(0, 5),
  });
});

// ==========================================
// 2. USER MANAGEMENT (CUSTOMERS)
// ==========================================
// @desc    Toggle Customer Block/Active status
// @route   PUT /api/admin/customers/:id/status
// @access  Private/Admin
const updateCustomerStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { isBlocked, reason } = req.body;

  const customer = await User.findById(id);
  if (!customer) {
    return res.status(404).json({ success: false, message: 'Customer not found' });
  }

  customer.isBlocked = Boolean(isBlocked);
  await customer.save();

  await logAudit(
    req,
    'AUTH',
    isBlocked ? 'SUSPEND_CUSTOMER' : 'ACTIVATE_CUSTOMER',
    `Customer: ${customer.email}`,
    reason || `Customer account status updated to ${isBlocked ? 'Suspended' : 'Active'}`
  );

  res.json({
    success: true,
    message: `Customer account successfully ${isBlocked ? 'suspended' : 'activated'}`,
    customer,
  });
});

// ==========================================
// 3. PRODUCT MODERATION
// ==========================================
// @desc    Approve / Reject / Request changes to vendor submitted products
// @route   PUT /api/admin/products/:id/approval
// @access  Private/Admin
const moderateProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { vendorStatus, rejectionReason } = req.body;

  if (!['approved', 'rejected', 'pending'].includes(vendorStatus)) {
    return res.status(400).json({ success: false, message: 'Invalid product moderation status' });
  }

  const product = await Product.findById(id);
  if (!product) {
    return res.status(404).json({ success: false, message: 'Product not found' });
  }

  product.vendorStatus = vendorStatus;
  await product.save();

  await logAudit(
    req,
    'PRODUCTS',
    `MODERATE_PRODUCT_${vendorStatus.toUpperCase()}`,
    `Product: ${product.name}`,
    rejectionReason || `Product status updated to ${vendorStatus}`
  );

  // Send admin notification
  if (vendorStatus === 'approved') {
    await AdminNotification.create({
      title: 'Product Approved',
      message: `Product "${product.name}" was approved for live marketplace storefront.`,
      type: 'PRODUCT_MODERATION',
      severity: 'success',
      link: '/admin/products',
    });
  }

  res.json({
    success: true,
    message: `Product "${product.name}" has been marked as ${vendorStatus}`,
    product,
  });
});

// ==========================================
// 4. VENDOR PAYOUTS & COMMISSIONS
// ==========================================
// @desc    Get all vendor payout requests & records
// @route   GET /api/admin/payouts
// @access  Private/Admin
const getPayouts = asyncHandler(async (req, res) => {
  const payouts = await Payout.find({})
    .populate('vendor', 'name email storeName phone payoutDetails commissionRate')
    .sort({ createdAt: -1 });

  // Calculate platform financial balance
  const orders = await Order.find({ orderStatus: { $ne: 'Cancelled' } });
  const grossSales = orders.reduce((sum, ord) => sum + (ord.total || 0), 0);
  const platformRevenue = Math.round(grossSales * 0.1);
  const totalPaidOut = payouts
    .filter((p) => p.status === 'paid')
    .reduce((sum, p) => sum + (p.amount || 0), 0);
  const pendingPayoutBalance = payouts
    .filter((p) => p.status === 'pending')
    .reduce((sum, p) => sum + (p.amount || 0), 0);

  res.json({
    success: true,
    payouts,
    ledger: {
      grossSales,
      platformRevenue,
      totalPaidOut,
      pendingPayoutBalance,
      netPayableBalance: Math.max(0, grossSales - platformRevenue - totalPaidOut),
    },
  });
});

// @desc    Create a new Payout settlement request
// @route   POST /api/admin/payouts
// @access  Private/Admin
const createPayout = asyncHandler(async (req, res) => {
  const { vendorId, amount, notes, transactionReference } = req.body;

  const vendor = await User.findById(vendorId);
  if (!vendor) {
    return res.status(404).json({ success: false, message: 'Vendor not found' });
  }

  const payout = await Payout.create({
    vendor: vendor._id,
    storeName: vendor.storeName || vendor.name,
    amount: Number(amount),
    grossSales: Math.round(Number(amount) / 0.9),
    commissionDeducted: Math.round(Number(amount) * 0.1),
    bankDetails: vendor.payoutDetails || {},
    status: 'pending',
    notes: notes || '',
    transactionReference: transactionReference || '',
  });

  await logAudit(
    req,
    'PAYOUTS',
    'CREATE_PAYOUT_SETTLEMENT',
    `Vendor: ${vendor.storeName}`,
    `Payout ${payout.payoutId} created for ₹${amount}`
  );

  res.status(201).json({
    success: true,
    message: 'Payout request recorded successfully',
    payout,
  });
});

// @desc    Update Payout status (approve / mark paid / reject)
// @route   PUT /api/admin/payouts/:id
// @access  Private/Admin
const updatePayoutStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status, transactionReference, notes } = req.body;

  const payout = await Payout.findById(id).populate('vendor', 'name storeName');
  if (!payout) {
    return res.status(404).json({ success: false, message: 'Payout record not found' });
  }

  payout.status = status;
  if (transactionReference) payout.transactionReference = transactionReference;
  if (notes) payout.notes = notes;
  if (status === 'paid') payout.paidAt = new Date();
  payout.processedBy = req.user?._id;

  await payout.save();

  await logAudit(
    req,
    'PAYOUTS',
    `PAYOUT_${status.toUpperCase()}`,
    `Payout: ${payout.payoutId}`,
    `Status updated to ${status}. Ref: ${transactionReference || 'N/A'}`
  );

  res.json({
    success: true,
    message: `Payout ${payout.payoutId} status updated to "${status}"`,
    payout,
  });
});

// ==========================================
// 5. RETURNS, REFUNDS & DISPUTES
// ==========================================
// @desc    Get all return and refund requests
// @route   GET /api/admin/returns
// @access  Private/Admin
const getReturnRequests = asyncHandler(async (req, res) => {
  const returns = await ReturnRequest.find({})
    .populate('order', 'orderId total paymentMethod paymentStatus')
    .populate('customer', 'name email phone')
    .sort({ createdAt: -1 });

  res.json({
    success: true,
    returns,
  });
});

// @desc    Update return request decision (approve / reject / refund)
// @route   PUT /api/admin/returns/:id/status
// @access  Private/Admin
const updateReturnStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status, adminDecisionNote, refundTransactionId } = req.body;

  const ret = await ReturnRequest.findById(id);
  if (!ret) {
    return res.status(404).json({ success: false, message: 'Return request not found' });
  }

  ret.status = status;
  if (adminDecisionNote) ret.adminDecisionNote = adminDecisionNote;
  if (refundTransactionId) ret.refundTransactionId = refundTransactionId;
  ret.reviewedBy = req.user?._id;

  await ret.save();

  // If approved/refunded, update corresponding Order's payment status to 'Refunded'
  if (status === 'refunded' || status === 'approved') {
    const order = await Order.findById(ret.order);
    if (order) {
      order.paymentStatus = 'Refunded';
      order.orderStatus = 'Returned';
      order.statusHistory.push({
        status: 'Refund Processed',
        timestamp: new Date(),
        note: `Refund of ₹${ret.refundAmount} approved by Administrator: ${adminDecisionNote || 'Policy verified'}`,
      });
      await order.save();
    }
  }

  await logAudit(
    req,
    'RETURNS',
    `RETURN_${status.toUpperCase()}`,
    `Return: ${ret.returnId} (Order #${ret.orderId})`,
    `Decision: ${status}. Note: ${adminDecisionNote || 'Approved'}`
  );

  res.json({
    success: true,
    message: `Return request ${ret.returnId} updated to "${status}"`,
    returnRequest: ret,
  });
});

// ==========================================
// 6. SYSTEM AUDIT LOGS
// ==========================================
// @desc    Get searchable admin audit logs
// @route   GET /api/admin/audit-logs
// @access  Private/Admin
const getAuditLogs = asyncHandler(async (req, res) => {
  const { category, search, limit = 100 } = req.query;

  const query = {};
  if (category && category !== 'ALL') {
    query.category = category;
  }
  if (search) {
    const regex = new RegExp(search, 'i');
    query.$or = [{ action: regex }, { target: regex }, { details: regex }, { adminEmail: regex }];
  }

  const logs = await AuditLog.find(query).sort({ createdAt: -1 }).limit(Number(limit));

  res.json({
    success: true,
    total: logs.length,
    logs,
  });
});

// ==========================================
// 7. ADMIN NOTIFICATIONS
// ==========================================
// @desc    Get live admin notifications
// @route   GET /api/admin/notifications
// @access  Private/Admin
const getAdminNotifications = asyncHandler(async (req, res) => {
  const notifications = await AdminNotification.find({}).sort({ createdAt: -1 }).limit(50);
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  res.json({
    success: true,
    unreadCount,
    notifications,
  });
});

// @desc    Mark all notifications as read
// @route   PUT /api/admin/notifications/read-all
// @access  Private/Admin
const markAllNotificationsRead = asyncHandler(async (req, res) => {
  await AdminNotification.updateMany({ isRead: false }, { isRead: true });

  res.json({
    success: true,
    message: 'All notifications marked as read',
  });
});

// ==========================================
// 8. SYSTEM SETTINGS & COMMISSION
// ==========================================
// @desc    Get platform global configuration
// @route   GET /api/admin/settings
// @access  Private/Admin
const getSystemSettings = asyncHandler(async (req, res) => {
  let settings = await SystemSetting.findOne({ key: 'global_config' });
  if (!settings) {
    settings = await SystemSetting.create({ key: 'global_config' });
  }

  res.json({
    success: true,
    settings,
  });
});

// @desc    Update platform settings
// @route   PUT /api/admin/settings
// @access  Private/Admin
const updateSystemSettings = asyncHandler(async (req, res) => {
  let settings = await SystemSetting.findOne({ key: 'global_config' });
  if (!settings) {
    settings = new SystemSetting({ key: 'global_config' });
  }

  const fields = [
    'platformName',
    'defaultCommissionRate',
    'supportEmail',
    'supportPhone',
    'currency',
    'currencySymbol',
    'autoApproveProducts',
    'autoApproveVendors',
    'maintenanceMode',
  ];

  fields.forEach((field) => {
    if (req.body[field] !== undefined) {
      settings[field] = req.body[field];
    }
  });

  await settings.save();

  await logAudit(
    req,
    'SETTINGS',
    'UPDATE_GLOBAL_SETTINGS',
    'Platform Configuration',
    `Updated platform settings. Commission rate: ${settings.defaultCommissionRate}%`
  );

  res.json({
    success: true,
    message: 'Platform settings updated successfully',
    settings,
  });
});

// ==========================================
// 9. COMPREHENSIVE REPORTS & CSV EXPORT DATA
// ==========================================
// @desc    Get aggregated report data for CSV export & analytics
// @route   GET /api/admin/reports
// @access  Private/Admin
const getReportsData = asyncHandler(async (req, res) => {
  const { type = 'sales', startDate, endDate } = req.query;

  const dateQuery = {};
  if (startDate && endDate) {
    dateQuery.createdAt = {
      $gte: new Date(startDate),
      $lte: new Date(endDate),
    };
  }

  if (type === 'sales' || type === 'orders') {
    const orders = await Order.find(dateQuery).populate('user', 'name email').sort({ createdAt: -1 });

    const reportRows = orders.map((o) => ({
      orderId: o.orderId,
      date: new Date(o.createdAt).toLocaleDateString(),
      customer: o.shippingAddress?.fullName || o.user?.name || 'Guest',
      email: o.user?.email || 'N/A',
      itemsCount: (o.items || []).reduce((acc, i) => acc + i.quantity, 0),
      subtotal: o.subtotal,
      delivery: o.delivery,
      discount: o.discount,
      totalAmount: o.total,
      platformCommission: Math.round(o.total * 0.1),
      netVendorPayable: Math.round(o.total * 0.9),
      paymentMethod: o.paymentMethod,
      paymentStatus: o.paymentStatus,
      orderStatus: o.orderStatus,
      courier: o.courierName || 'BlueDart',
      trackingNumber: o.trackingNumber || 'N/A',
    }));

    return res.json({ success: true, count: reportRows.length, data: reportRows });
  }

  if (type === 'products') {
    const products = await Product.find(dateQuery).populate('category', 'name').populate('vendor', 'storeName name');

    const reportRows = products.map((p) => ({
      productId: p._id,
      name: p.name,
      category: p.category?.name || 'Uncategorized',
      vendor: p.vendor?.storeName || 'Appsica Official',
      price: p.price,
      originalPrice: p.originalPrice,
      stock: p.stock,
      rating: p.rating,
      reviewCount: p.reviewCount,
      vendorStatus: p.vendorStatus || 'approved',
      isFeatured: p.isFeatured ? 'Yes' : 'No',
    }));

    return res.json({ success: true, count: reportRows.length, data: reportRows });
  }

  if (type === 'vendors') {
    const vendors = await User.find({ role: 'vendor', ...dateQuery }).select('-password');

    const reportRows = await Promise.all(
      vendors.map(async (v) => {
        const prodCount = await Product.countDocuments({ vendor: v._id });
        const vOrders = await Order.find({ 'items.vendor': v._id, orderStatus: { $ne: 'Cancelled' } });
        const grossSales = vOrders.reduce((sum, ord) => {
          return (
            sum +
            (ord.items || [])
              .filter((i) => String(i.vendor) === String(v._id))
              .reduce((isum, item) => isum + item.price * item.quantity, 0)
          );
        }, 0);

        return {
          vendorId: v._id,
          storeName: v.storeName || v.name,
          ownerName: v.name,
          email: v.email,
          phone: v.phone || 'N/A',
          gstinTaxId: v.taxId || 'N/A',
          status: v.vendorStatus,
          commissionRate: `${v.commissionRate || 10}%`,
          productsListed: prodCount,
          grossSales,
          platformFee: Math.round(grossSales * ((v.commissionRate || 10) / 100)),
          netVendorEarnings: Math.round(grossSales * (1 - (v.commissionRate || 10) / 100)),
          bankName: v.payoutDetails?.bankName || 'N/A',
          accountNumber: v.payoutDetails?.accountNumber || 'N/A',
          ifsc: v.payoutDetails?.ifsc || 'N/A',
        };
      })
    );

    return res.json({ success: true, count: reportRows.length, data: reportRows });
  }

  res.status(400).json({ success: false, message: 'Invalid report type specified' });
});

// ==========================================
// 17. DELIVERY FLEET & ASSIGNMENT MANAGEMENT
// ==========================================

// @desc    Get all delivery partners with active workload
// @route   GET /api/admin/delivery-partners
// @access  Private/Admin
const getAllDeliveryPartners = asyncHandler(async (req, res) => {
  const partners = await User.find({ role: 'delivery' }).sort({ createdAt: -1 });

  // Calculate active assigned orders workload for each partner
  const partnersWithWorkload = await Promise.all(
    partners.map(async (p) => {
      const activeOrdersCount = await Order.countDocuments({
        deliveryPartner: p._id,
        deliveryStatus: {
          $in: ['Assigned', 'Accepted', 'Arrived at Pickup', 'Picked Up', 'In Transit', 'Out for Delivery'],
        },
      });
      const pObj = p.toObject();
      pObj.activeOrdersCount = activeOrdersCount;
      return pObj;
    })
  );

  res.json({
    success: true,
    count: partnersWithWorkload.length,
    partners: partnersWithWorkload,
  });
});

// @desc    Create a new delivery partner (Admin)
// @route   POST /api/admin/delivery-partners
// @access  Private/Admin
const createDeliveryPartner = asyncHandler(async (req, res) => {
  const {
    name,
    email,
    password,
    phone,
    vehicleType = 'bike',
    vehicleNumber = '',
    drivingLicenseNumber = '',
    deliveryCity = 'Mumbai',
    emergencyContact = '',
  } = req.body;

  if (!name || !email || !password || !phone) {
    return res.status(400).json({
      success: false,
      message: 'Name, email, password, and phone number are required',
    });
  }

  if (password.length < 6) {
    return res.status(400).json({
      success: false,
      message: 'Password must be at least 6 characters long',
    });
  }

  const normalizedEmail = email.toLowerCase().trim();
  const existingUser = await User.findOne({ email: normalizedEmail });
  if (existingUser) {
    return res.status(400).json({
      success: false,
      message: 'A user with this email address already exists',
    });
  }

  const partner = await User.create({
    name: name.trim(),
    email: normalizedEmail,
    password, // Automatically hashed by User model pre('save')
    phone: String(phone).trim(),
    role: 'delivery',
    deliveryStatus: 'approved',
    deliveryApprovedAt: new Date(),
    vehicleType,
    vehicleNumber: String(vehicleNumber).trim().toUpperCase(),
    drivingLicenseNumber: String(drivingLicenseNumber).trim().toUpperCase(),
    deliveryCity: String(deliveryCity).trim() || 'Mumbai',
    emergencyContact: String(emergencyContact).trim(),
    isOnline: true,
  });

  const partnerData = partner.toObject();
  delete partnerData.password;
  partnerData.activeOrdersCount = 0;

  // Real-time broadcast to Seller Panel
  try {
    const { emitDriverApproved } = require('../socket');
    emitDriverApproved(partnerData);
  } catch (socketErr) {
    console.warn('Socket emit notice:', socketErr.message);
  }

  await logAudit(
    req,
    'DELIVERY',
    'CREATE_DELIVERY_PARTNER',
    partner.name,
    `New delivery partner created and activated by admin (${partner.email})`
  );

  res.status(201).json({
    success: true,
    message: `Delivery partner "${partner.name}" added and activated successfully!`,
    partner: partnerData,
  });
});

// @desc    Update delivery partner details (Admin)
// @route   PUT /api/admin/delivery-partners/:id
// @access  Private/Admin
const updateDeliveryPartner = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const {
    name,
    email,
    phone,
    password,
    vehicleType,
    vehicleNumber,
    drivingLicenseNumber,
    deliveryCity,
    emergencyContact,
    deliveryStatus,
    isOnline,
  } = req.body;

  const partner = await User.findById(id);
  if (!partner || (partner.role !== 'delivery' && partner.role !== 'user')) {
    return res.status(404).json({ success: false, message: 'Delivery partner record not found' });
  }

  if (email && email.toLowerCase().trim() !== partner.email) {
    const existing = await User.findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Email address already in use by another user' });
    }
    partner.email = email.toLowerCase().trim();
  }

  if (name) partner.name = name.trim();
  if (phone) partner.phone = String(phone).trim();
  if (vehicleType) partner.vehicleType = vehicleType;
  if (vehicleNumber !== undefined) partner.vehicleNumber = String(vehicleNumber).trim().toUpperCase();
  if (drivingLicenseNumber !== undefined) partner.drivingLicenseNumber = String(drivingLicenseNumber).trim().toUpperCase();
  if (deliveryCity !== undefined) partner.deliveryCity = String(deliveryCity).trim();
  if (emergencyContact !== undefined) partner.emergencyContact = String(emergencyContact).trim();
  if (deliveryStatus && ['approved', 'suspended', 'rejected', 'pending'].includes(deliveryStatus)) {
    partner.deliveryStatus = deliveryStatus;
  }
  if (isOnline !== undefined) partner.isOnline = Boolean(isOnline);
  if (password && password.trim().length >= 6) {
    partner.password = password.trim(); // Will be hashed on save
  }

  await partner.save();

  const partnerData = partner.toObject();
  delete partnerData.password;

  // Real-time broadcast to Seller Panel
  try {
    const { emitDriverApproved, emitDriverRemoved } = require('../socket');
    if (partner.deliveryStatus === 'approved') {
      emitDriverApproved(partnerData);
    } else {
      emitDriverRemoved(partner._id, partner.deliveryStatus);
    }
  } catch (socketErr) {
    console.warn('Socket emit notice:', socketErr.message);
  }

  await logAudit(
    req,
    'DELIVERY',
    'UPDATE_DELIVERY_PARTNER',
    partner.name,
    `Delivery partner details updated by admin`
  );

  res.json({
    success: true,
    message: `Delivery partner "${partner.name}" updated successfully`,
    partner: partnerData,
  });
});

// @desc    Update delivery partner status (approve, suspend, reject, pending)
// @route   PUT /api/admin/delivery-partners/:id/status
// @access  Private/Admin
const updateDeliveryPartnerStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status, rejectionReason } = req.body;

  if (!['approved', 'suspended', 'rejected', 'pending'].includes(status)) {
    return res.status(400).json({ success: false, message: 'Invalid delivery partner status' });
  }

  const partner = await User.findById(id);
  if (!partner || (partner.role !== 'delivery' && partner.role !== 'user')) {
    return res.status(404).json({ success: false, message: 'Delivery partner record not found' });
  }

  const previousStatus = partner.deliveryStatus || 'pending';
  partner.deliveryStatus = status;

  if (status === 'approved') {
    partner.role = 'delivery'; // Strictly assign delivery role upon approval
    partner.deliveryApprovedAt = new Date();
    partner.deliveryRejectionReason = '';

    await DeliveryNotification.create({
      recipient: partner._id,
      title: 'Delivery Partner Account Approved! 🎉',
      message: 'Congratulations! Your delivery partner application has been approved by administrator. You can now log in, go online, and receive parcel assignments.',
      type: 'system',
    });
  } else if (status === 'rejected') {
    partner.role = 'delivery';
    partner.deliveryRejectionReason = rejectionReason || 'Vehicle documentation or license verification criteria not fulfilled.';

    await DeliveryNotification.create({
      recipient: partner._id,
      title: 'Application Rejected',
      message: `Your registration request has been rejected. Please contact the admin for more information. (Reason: ${partner.deliveryRejectionReason})`,
      type: 'system',
    });
  }

  await partner.save();

  // Real-time broadcast to Seller Panel
  try {
    const { emitDriverApproved, emitDriverRemoved } = require('../socket');
    if (status === 'approved') {
      emitDriverApproved({
        _id: partner._id,
        name: partner.name,
        email: partner.email,
        phone: partner.phone,
        vehicleType: partner.vehicleType || 'bike',
        vehicleNumber: partner.vehicleNumber || '',
        deliveryCity: partner.deliveryCity || 'Mumbai',
        isOnline: partner.isOnline ?? true,
        deliveryRating: partner.deliveryRating || 5.0,
        totalDeliveriesCount: partner.totalDeliveriesCount || 0,
        activeOrdersCount: 0,
        deliveryStatus: 'approved',
      });
    } else {
      emitDriverRemoved(partner._id, rejectionReason || status);
    }
  } catch (socketErr) {
    console.warn('Socket emit notice:', socketErr.message);
  }

  await logAudit(
    req,
    'DELIVERY',
    status === 'approved' ? 'APPROVE_DELIVERY_PARTNER' : status === 'rejected' ? 'REJECT_DELIVERY_PARTNER' : 'STATUS_CHANGE',
    partner.name,
    `Delivery status changed from ${previousStatus} to ${status}${rejectionReason ? ` (Reason: ${rejectionReason})` : ''}`
  );

  res.json({
    success: true,
    message: `Delivery partner "${partner.name}" status updated to "${status}"`,
    partner,
  });
});

// @desc    Assign order to a delivery partner
// @route   PUT /api/admin/orders/:id/assign-delivery
// @access  Private/Admin
const assignOrderDelivery = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { deliveryPartnerId, deliveryFee = 50 } = req.body;

  let query = { orderId: id };
  if (id.match(/^[0-9a-fA-F]{24}$/)) {
    query = { $or: [{ _id: id }, { orderId: id }] };
  }

  const order = await Order.findOne(query);
  if (!order) {
    return res.status(404).json({ success: false, message: 'Order record not found' });
  }

  if (['Delivered', 'Cancelled', 'Returned'].includes(order.orderStatus)) {
    return res.status(400).json({
      success: false,
      message: `Cannot assign delivery for an order that is already ${order.orderStatus}`,
    });
  }

  let partnerName = 'Unassigned';
  if (deliveryPartnerId) {
    const partner = await User.findById(deliveryPartnerId);
    if (!partner || partner.role !== 'delivery') {
      return res.status(400).json({ success: false, message: 'Selected user is not a valid delivery partner' });
    }
    if (partner.deliveryStatus !== 'approved') {
      return res.status(400).json({ success: false, message: 'Cannot assign delivery to an unapproved or suspended delivery partner' });
    }

    const isReassignment = Boolean(order.deliveryPartner && order.deliveryPartner.toString() !== partner._id.toString());
    order.deliveryPartner = partner._id;
    order.deliveryStatus = 'Assigned';
    order.deliveryAssignedAt = new Date();
    order.deliveryFee = deliveryFee;
    partnerName = partner.name;

    order.statusHistory.push({
      status: isReassignment ? 'Delivery Reassigned' : 'Delivery Assigned',
      timestamp: new Date(),
      note: `Delivery assigned to partner ${partner.name} (${partner.phone || 'No phone'})`,
    });

    await DeliveryNotification.create({
      recipient: partner._id,
      title: isReassignment ? 'Reassigned Order Notice! 📦' : 'New Delivery Assignment! 📦',
      message: `You have been assigned Order #${order.orderId}. Please review and accept in your delivery panel.`,
      type: 'assignment',
      orderId: order.orderId,
    });
  } else {
    // Unassign
    order.deliveryPartner = null;
    order.deliveryStatus = 'Unassigned';
    order.statusHistory.push({
      status: 'Delivery Unassigned',
      timestamp: new Date(),
      note: `Delivery assignment removed by admin`,
    });
  }

  await order.save();

  await logAudit(req, 'DELIVERY', 'ASSIGN_DELIVERY', order.orderId, `Assigned to ${partnerName}`);

  res.json({
    success: true,
    message: `Order #${order.orderId} delivery assigned to ${partnerName}`,
    order,
  });
});

// @desc    Get orders ready for delivery assignment (Admin)
// @route   GET /api/admin/delivery-assignments/pending
// @access  Private/Admin
const getPendingDeliveryAssignments = asyncHandler(async (req, res) => {
  // Orders ready for assignment:
  // Status: not cancelled, returned, or delivered
  // Delivery status: unassigned, reassigned, or delivery failed
  const orders = await Order.find({
    orderStatus: { $nin: ['Cancelled', 'Returned', 'Delivered'] },
    deliveryStatus: { $in: ['Unassigned', 'Reassigned', 'Delivery Attempt Failed'] },
  })
    .populate('items.product', 'name images price')
    .populate('items.vendor', 'name storeName phone businessAddress email')
    .populate('user', 'name phone email')
    .sort({ createdAt: -1 });

  // Format orders with multi-vendor pickup location grouping
  const formattedOrders = orders.map((order) => {
    const o = order.toObject();

    // Group items by vendor to identify all pickup points
    const vendorPickupMap = new Map();
    (o.items || []).forEach((item) => {
      const v = item.vendor;
      const vId = v?._id ? v._id.toString() : 'unknown';
      if (!vendorPickupMap.has(vId)) {
        vendorPickupMap.set(vId, {
          vendorId: vId,
          storeName: v?.storeName || v?.name || 'Appsica Central Warehouse',
          contactName: v?.name || 'Store Manager',
          phone: v?.phone || 'N/A',
          address: v?.businessAddress || 'Main Hub, Logistics Park',
          items: [],
        });
      }
      vendorPickupMap.get(vId).items.push({
        name: item.name,
        quantity: item.quantity,
        price: item.price,
        itemStatus: item.itemStatus,
      });
    });

    o.pickupLocations = Array.from(vendorPickupMap.values());
    return o;
  });

  res.json({
    success: true,
    count: formattedOrders.length,
    orders: formattedOrders,
  });
});

// @desc    Get all delivery earnings & settlement ledger
// @route   GET /api/admin/delivery-earnings
// @access  Private/Admin
const getDeliveryEarningsLedger = asyncHandler(async (req, res) => {
  const earnings = await DeliveryEarning.find({})
    .populate('deliveryPartner', 'name email phone vehicleType vehicleNumber')
    .populate('order', 'orderId total paymentMethod deliveryDeliveredAt')
    .sort({ createdAt: -1 });

  res.json({
    success: true,
    count: earnings.length,
    earnings,
  });
});

module.exports = {
  getDashboardStats,
  updateCustomerStatus,
  moderateProduct,
  getPayouts,
  createPayout,
  updatePayoutStatus,
  getReturnRequests,
  updateReturnStatus,
  getAuditLogs,
  getAdminNotifications,
  markAllNotificationsRead,
  getSystemSettings,
  updateSystemSettings,
  getReportsData,
  getAllDeliveryPartners,
  createDeliveryPartner,
  updateDeliveryPartner,
  updateDeliveryPartnerStatus,
  getPendingDeliveryAssignments,
  assignOrderDelivery,
  getDeliveryEarningsLedger,
};
