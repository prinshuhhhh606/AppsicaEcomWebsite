const User = require('../models/user');
const Order = require('../models/order');
const asyncHandler = require('../utils/asyncHandler');

// @desc    Get all customers
// @route   GET /api/admin/customers
// @access  Private/Admin
const getCustomers = asyncHandler(async (req, res) => {
  const { search, page = 1, limit = 50 } = req.query;

  const query = { role: 'user' };
  if (search) {
    const regex = new RegExp(search, 'i');
    query.$or = [{ name: regex }, { email: regex }, { phone: regex }];
  }

  const pageNum = parseInt(page, 10) || 1;
  const limitNum = parseInt(limit, 10) || 50;
  const skip = (pageNum - 1) * limitNum;

  const total = await User.countDocuments(query);
  const customers = await User.find(query)
    .select('-password')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limitNum);

  // Attach order counts
  const customerListWithStats = await Promise.all(
    customers.map(async (cust) => {
      const orderCount = await Order.countDocuments({ user: cust._id });
      return {
        ...cust.toObject(),
        orderCount,
      };
    })
  );

  res.json({
    success: true,
    total,
    page: pageNum,
    pages: Math.ceil(total / limitNum) || 1,
    customers: customerListWithStats,
  });
});

// @desc    Get single customer by ID
// @route   GET /api/admin/customers/:id
// @access  Private/Admin
const getCustomerById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const customer = await User.findById(id).select('-password');
  if (!customer) {
    return res.status(404).json({ success: false, message: 'Customer not found' });
  }

  const orders = await Order.find({ user: customer._id }).sort({ createdAt: -1 });

  res.json({
    success: true,
    customer,
    orders,
  });
});

module.exports = {
  getCustomers,
  getCustomerById,
};
