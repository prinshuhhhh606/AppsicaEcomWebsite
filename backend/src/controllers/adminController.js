const Order = require('../models/order');
const Product = require('../models/product');
const User = require('../models/user');
const asyncHandler = require('../utils/asyncHandler');

// @desc    Get dashboard statistics
// @route   GET /api/admin/dashboard
// @access  Private/Admin
const getDashboardStats = asyncHandler(async (req, res) => {
  const [totalProducts, totalCustomers, orders] = await Promise.all([
    Product.countDocuments({}),
    User.countDocuments({ role: 'user' }),
    Order.find({}),
  ]);

  const totalOrders = orders.length;
  const totalSales = orders.reduce((sum, ord) => {
    // Only count orders that are not cancelled
    return ord.orderStatus !== 'cancelled' ? sum + (ord.total || 0) : sum;
  }, 0);

  const recentOrders = await Order.find({})
    .populate('user', 'name email')
    .sort({ createdAt: -1 })
    .limit(5);

  const popularProducts = await Product.find({})
    .populate('category', 'name')
    .sort({ rating: -1, reviewCount: -1 })
    .limit(5);

  res.json({
    success: true,
    stats: {
      totalSales,
      totalOrders,
      totalProducts,
      totalCustomers,
    },
    recentOrders,
    popularProducts,
  });
});

module.exports = {
  getDashboardStats,
};
