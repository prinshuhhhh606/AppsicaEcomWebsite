const User = require('../models/user');
const Product = require('../models/product');
const Order = require('../models/order');
const Review = require('../models/review');
const Category = require('../models/category');
const jwt = require('jsonwebtoken');
const asyncHandler = require('../utils/asyncHandler');

const generateToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET || 'appsica_secret_jwt_key_2026_super_secure_ecom',
    { expiresIn: '30d' }
  );
};

// ==========================================
// 1. VENDOR AUTHENTICATION
// ==========================================

// @desc    Register new vendor
// @route   POST /api/vendor/register
// @access  Public
const registerVendor = asyncHandler(async (req, res) => {
  const {
    name,
    email,
    password,
    phone,
    storeName,
    storeDescription,
    businessAddress,
    taxId,
  } = req.body;

  if (!name || !email || !password || !storeName) {
    return res.status(400).json({
      success: false,
      message: 'Name, email, password, and store name are required',
    });
  }

  const normalizedEmail = email.toLowerCase().trim();
  const existingUser = await User.findOne({ email: normalizedEmail }).select('+password');

  if (existingUser) {
    // 1. If existing customer wants to become a seller: upgrade linked account cleanly
    if (existingUser.role === 'user') {
      existingUser.role = 'vendor';
      existingUser.vendorStatus = 'pending';
      existingUser.storeName = storeName.trim();
      existingUser.storeDescription = storeDescription ? storeDescription.trim() : `Official store for ${storeName.trim()}`;
      existingUser.businessAddress = businessAddress ? businessAddress.trim() : '';
      existingUser.taxId = taxId ? taxId.trim() : '';
      if (phone) existingUser.phone = String(phone).trim();
      existingUser.vendorRejectionReason = '';
      await existingUser.save();

      // Notify admin
      try {
        const AdminNotification = require('../models/adminNotification');
        await AdminNotification.create({
          title: 'Seller Application Submitted 🏬',
          message: `Customer "${existingUser.name}" applied for seller access with store "${existingUser.storeName}".`,
          type: 'VENDOR_APPROVAL',
          severity: 'info',
          link: '/admin/vendor-applications',
        });
      } catch (notifyErr) {
        console.warn('Failed to notify admin:', notifyErr.message);
      }

      return res.status(201).json({
        success: true,
        message: 'Your seller registration request has been submitted. Your account will be activated after admin approval.',
        vendorStatus: 'pending',
        user: {
          _id: existingUser._id,
          id: existingUser._id,
          name: existingUser.name,
          email: existingUser.email,
          role: existingUser.role,
          vendorStatus: 'pending',
          storeName: existingUser.storeName,
          phone: existingUser.phone,
        },
      });
    }

    // 2. If already registered as vendor: check status
    if (existingUser.role === 'vendor') {
      if (existingUser.vendorStatus === 'pending') {
        return res.status(400).json({
          success: false,
          message: 'Your seller registration request has already been submitted and is awaiting administrator approval.',
          vendorStatus: 'pending',
        });
      }

      // Allow re-submission if previously rejected
      if (existingUser.vendorStatus === 'rejected') {
        existingUser.vendorStatus = 'pending';
        existingUser.vendorRejectionReason = '';
        existingUser.name = name.trim();
        existingUser.storeName = storeName.trim();
        if (storeDescription) existingUser.storeDescription = storeDescription.trim();
        if (businessAddress) existingUser.businessAddress = businessAddress.trim();
        if (taxId) existingUser.taxId = taxId.trim();
        if (phone) existingUser.phone = String(phone).trim();
        await existingUser.save();

        try {
          const AdminNotification = require('../models/adminNotification');
          await AdminNotification.create({
            title: 'Seller Application Re-Submitted 🏬',
            message: `Store "${existingUser.storeName}" (${existingUser.name}) re-submitted their seller application for review.`,
            type: 'VENDOR_APPROVAL',
            severity: 'info',
            link: '/admin/vendor-applications',
          });
        } catch (notifyErr) {
          console.warn('Failed to notify admin:', notifyErr.message);
        }

        return res.status(200).json({
          success: true,
          message: 'Your seller registration request has been submitted. Your account will be activated after admin approval.',
          vendorStatus: 'pending',
          user: {
            _id: existingUser._id,
            id: existingUser._id,
            name: existingUser.name,
            email: existingUser.email,
            role: existingUser.role,
            vendorStatus: 'pending',
            storeName: existingUser.storeName,
            phone: existingUser.phone,
          },
        });
      }

      return res.status(409).json({
        success: false,
        message: 'A seller account with this email is already approved and active. Please log in.',
      });
    }

    return res.status(409).json({
      success: false,
      message: 'Email is already registered. Please log in or use another email.',
    });
  }

  // 3. Brand new seller registration
  const vendor = await User.create({
    name: name.trim(),
    email: normalizedEmail,
    password,
    phone: phone ? String(phone).trim() : '',
    role: 'vendor',
    vendorStatus: 'pending', // Strictly pending until admin approval
    storeName: storeName.trim(),
    storeDescription: storeDescription ? storeDescription.trim() : `Official store for ${storeName.trim()}`,
    businessAddress: businessAddress ? businessAddress.trim() : '',
    taxId: taxId ? taxId.trim() : '',
  });

  // Notify admin about new seller application
  try {
    const AdminNotification = require('../models/adminNotification');
    await AdminNotification.create({
      title: 'New Seller Registration 🏬',
      message: `Store "${vendor.storeName}" (${vendor.name}) applied for seller access. Verification required.`,
      type: 'VENDOR_APPROVAL',
      severity: 'info',
      link: '/admin/vendor-applications',
    });
  } catch (notifyErr) {
    console.warn('Failed to notify admin of new vendor:', notifyErr.message);
  }

  // DO NOT return a login token! Seller account is not activated yet.
  res.status(201).json({
    success: true,
    message: 'Your seller registration request has been submitted. Your account will be activated after admin approval.',
    vendorStatus: 'pending',
    user: {
      _id: vendor._id,
      id: vendor._id,
      name: vendor.name,
      email: vendor.email,
      role: vendor.role,
      vendorStatus: vendor.vendorStatus,
      storeName: vendor.storeName,
      storeDescription: vendor.storeDescription,
      phone: vendor.phone,
      createdAt: vendor.createdAt,
    },
  });
});

// @desc    Vendor Login
// @route   POST /api/vendor/login
// @access  Public
const loginVendor = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: 'Email and password are required',
    });
  }

  const normalizedEmail = email.toLowerCase().trim();
  const user = await User.findOne({ email: normalizedEmail }).select('+password');

  if (!user || !(await user.comparePassword(password))) {
    return res.status(401).json({
      success: false,
      message: 'Invalid email or password',
    });
  }

  // Ensure role is vendor or admin
  if (user.role !== 'vendor' && user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Access restricted: This account is not registered as a seller/vendor. Please register as a vendor.',
    });
  }

  if (user.isBlocked) {
    return res.status(403).json({
      success: false,
      message: 'Your vendor account has been deactivated. Please contact administrator.',
    });
  }

  // Enforce approval checks before granting access
  if (user.role === 'vendor') {
    if (user.vendorStatus === 'rejected') {
      return res.status(403).json({
        success: false,
        message: `Your seller application was rejected by administrator. Reason: ${user.vendorRejectionReason || 'Store verification criteria not fulfilled.'}`,
        vendorStatus: 'rejected',
        rejected: true,
        rejectionReason: user.vendorRejectionReason || 'Store verification criteria not fulfilled.',
      });
    }

    if (user.vendorStatus === 'suspended') {
      return res.status(403).json({
        success: false,
        message: 'Your seller account has been suspended by the admin. Please contact support.',
        vendorStatus: 'suspended',
      });
    }

    if (user.vendorStatus === 'pending' || user.vendorStatus !== 'approved') {
      return res.status(403).json({
        success: false,
        message: 'Your registration request has not been approved by the admin yet. Please wait for approval.',
        vendorStatus: 'pending',
        pendingApproval: true,
      });
    }
  }

  // Only approved vendor or admin reaches here
  const token = generateToken(user._id);

  res.json({
    success: true,
    message: 'Vendor login successful',
    token,
    user: {
      _id: user._id,
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      vendorStatus: user.vendorStatus || 'approved',
      storeName: user.storeName || `${user.name}'s Store`,
      storeDescription: user.storeDescription || '',
      storeLogo: user.storeLogo || '',
      storeBanner: user.storeBanner || '',
      businessAddress: user.businessAddress || '',
      taxId: user.taxId || '',
      payoutDetails: user.payoutDetails || {},
      phone: user.phone || '',
    },
  });
});

// ==========================================
// 2. VENDOR PROFILE MANAGEMENT
// ==========================================

// @desc    Get Vendor Profile
// @route   GET /api/vendor/profile
// @access  Private/Vendor
const getProfile = asyncHandler(async (req, res) => {
  const vendor = await User.findById(req.user._id).select('-password');
  if (!vendor) {
    return res.status(404).json({ success: false, message: 'Vendor not found' });
  }

  res.json({
    success: true,
    vendor: {
      _id: vendor._id,
      id: vendor._id,
      name: vendor.name,
      email: vendor.email,
      role: vendor.role,
      vendorStatus: vendor.vendorStatus,
      storeName: vendor.storeName,
      storeDescription: vendor.storeDescription,
      storeLogo: vendor.storeLogo,
      storeBanner: vendor.storeBanner,
      businessAddress: vendor.businessAddress,
      taxId: vendor.taxId,
      phone: vendor.phone,
      payoutDetails: vendor.payoutDetails,
      commissionRate: vendor.commissionRate || 10,
      vendorApprovedAt: vendor.vendorApprovedAt,
      vendorRejectionReason: vendor.vendorRejectionReason,
      createdAt: vendor.createdAt,
    },
  });
});

// @desc    Update Vendor Profile
// @route   PUT /api/vendor/profile
// @access  Private/Vendor
const updateProfile = asyncHandler(async (req, res) => {
  const vendor = await User.findById(req.user._id);
  if (!vendor) {
    return res.status(404).json({ success: false, message: 'Vendor not found' });
  }

  const {
    name,
    phone,
    storeName,
    storeDescription,
    storeLogo,
    storeBanner,
    businessAddress,
    taxId,
    payoutDetails,
    password,
  } = req.body;

  if (name) vendor.name = name.trim();
  if (phone !== undefined) vendor.phone = phone.trim();
  if (storeName) vendor.storeName = storeName.trim();
  if (storeDescription !== undefined) vendor.storeDescription = storeDescription.trim();
  if (storeLogo !== undefined) vendor.storeLogo = storeLogo;
  if (storeBanner !== undefined) vendor.storeBanner = storeBanner;
  if (businessAddress !== undefined) vendor.businessAddress = businessAddress.trim();
  if (taxId !== undefined) vendor.taxId = taxId.trim();

  if (payoutDetails) {
    vendor.payoutDetails = {
      accountHolder: payoutDetails.accountHolder || vendor.payoutDetails?.accountHolder || '',
      accountNumber: payoutDetails.accountNumber || vendor.payoutDetails?.accountNumber || '',
      bankName: payoutDetails.bankName || vendor.payoutDetails?.bankName || '',
      ifsc: payoutDetails.ifsc || vendor.payoutDetails?.ifsc || '',
      upiId: payoutDetails.upiId || vendor.payoutDetails?.upiId || '',
    };
  }

  if (password) {
    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
    }
    vendor.password = password;
  }

  const updated = await vendor.save();

  res.json({
    success: true,
    message: 'Store profile updated successfully',
    vendor: {
      _id: updated._id,
      id: updated._id,
      name: updated.name,
      email: updated.email,
      role: updated.role,
      vendorStatus: updated.vendorStatus,
      storeName: updated.storeName,
      storeDescription: updated.storeDescription,
      storeLogo: updated.storeLogo,
      storeBanner: updated.storeBanner,
      businessAddress: updated.businessAddress,
      taxId: updated.taxId,
      phone: updated.phone,
      payoutDetails: updated.payoutDetails,
      commissionRate: updated.commissionRate,
    },
  });
});

// ==========================================
// 3. VENDOR DASHBOARD
// ==========================================

// @desc    Get Vendor Dashboard Statistics
// @route   GET /api/vendor/dashboard
// @access  Private/Vendor
const getDashboardStats = asyncHandler(async (req, res) => {
  const vendorId = req.user._id;

  // 1. Products statistics
  const [totalProducts, activeProducts, lowStockProducts, vendorProducts] = await Promise.all([
    Product.countDocuments({ vendor: vendorId }),
    Product.countDocuments({ vendor: vendorId, vendorStatus: 'approved' }),
    Product.countDocuments({ vendor: vendorId, stock: { $lte: 5 } }),
    Product.find({ vendor: vendorId }, '_id name price stock rating reviewCount images category')
      .populate('category', 'name')
      .sort({ rating: -1, reviewCount: -1 }),
  ]);

  const vendorProductIds = vendorProducts.map((p) => p._id.toString());

  // 2. Orders statistics (Orders where items contain vendor's products or vendor field matches)
  const allOrders = await Order.find({
    $or: [
      { 'items.vendor': vendorId },
      { 'items.product': { $in: vendorProducts.map((p) => p._id) } },
    ],
  }).sort({ createdAt: -1 });

  let totalSales = 0;
  let totalItemsSold = 0;
  let pendingOrdersCount = 0;
  let deliveredOrdersCount = 0;

  const vendorOrdersSummary = allOrders.map((ord) => {
    // Filter only items that belong to this vendor
    const vendorItems = ord.items.filter((item) => {
      const isVendorMatch = item.vendor && item.vendor.toString() === vendorId.toString();
      const isProductMatch = item.product && vendorProductIds.includes(item.product.toString());
      return isVendorMatch || isProductMatch;
    });

    const vendorSubtotal = vendorItems.reduce((acc, it) => acc + (it.price * it.quantity), 0);
    const vendorItemCount = vendorItems.reduce((acc, it) => acc + it.quantity, 0);

    const isCancelled = ord.orderStatus === 'Cancelled' || ord.orderStatus === 'cancelled';
    if (!isCancelled) {
      totalSales += vendorSubtotal;
      totalItemsSold += vendorItemCount;
    }

    if (ord.orderStatus === 'Order Placed' || ord.orderStatus === 'Processing' || ord.orderStatus === 'Confirmed' || ord.paymentStatus === 'Pending') {
      pendingOrdersCount++;
    }
    if (ord.orderStatus === 'Delivered' || ord.orderStatus === 'delivered') {
      deliveredOrdersCount++;
    }

    return {
      _id: ord._id,
      orderId: ord.orderId,
      createdAt: ord.createdAt,
      customerName: ord.shippingAddress?.fullName || 'Customer',
      paymentStatus: ord.paymentStatus,
      orderStatus: ord.orderStatus,
      vendorItems,
      vendorSubtotal,
      vendorItemCount,
    };
  });

  // Commission calculation (10% platform commission default)
  const commissionRate = req.user.commissionRate || 10;
  const platformFee = Math.round((totalSales * commissionRate) / 100);
  const netEarnings = Math.max(0, totalSales - platformFee);

  // Calculate average rating across vendor products
  const productsWithReviews = vendorProducts.filter((p) => p.reviewCount > 0);
  const avgStoreRating = productsWithReviews.length > 0
    ? (productsWithReviews.reduce((sum, p) => sum + p.rating, 0) / productsWithReviews.length).toFixed(1)
    : '4.8';

  // Recent 5 vendor orders
  const recentOrders = vendorOrdersSummary.slice(0, 5);

  // Top selling / popular products
  const topProducts = vendorProducts.slice(0, 5);

  // Monthly Sales trend for the last 6 months
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const now = new Date();
  const salesTrend = [];

  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const mName = months[d.getMonth()];
    const mYear = d.getFullYear();

    // Calculate sales in this month
    const monthSales = allOrders.reduce((sum, ord) => {
      const ordDate = new Date(ord.createdAt);
      if (ordDate.getMonth() === d.getMonth() && ordDate.getFullYear() === mYear && ord.orderStatus !== 'Cancelled') {
        const vItems = ord.items.filter((item) => {
          return (item.vendor && item.vendor.toString() === vendorId.toString()) ||
                 (item.product && vendorProductIds.includes(item.product.toString()));
        });
        return sum + vItems.reduce((acc, it) => acc + (it.price * it.quantity), 0);
      }
      return sum;
    }, 0);

    salesTrend.push({
      month: `${mName}`,
      sales: monthSales,
      earnings: Math.round(monthSales * (1 - commissionRate / 100)),
    });
  }

  res.json({
    success: true,
    stats: {
      totalProducts,
      activeProducts,
      lowStockProducts,
      totalOrders: vendorOrdersSummary.length,
      pendingOrders: pendingOrdersCount,
      deliveredOrders: deliveredOrdersCount,
      totalSales: Math.round(totalSales),
      netEarnings: Math.round(netEarnings),
      platformFee: Math.round(platformFee),
      totalItemsSold,
      storeRating: Number(avgStoreRating),
      vendorStatus: req.user.vendorStatus,
    },
    recentOrders,
    topProducts,
    salesTrend,
  });
});

// ==========================================
// 4. VENDOR PRODUCT MANAGEMENT
// ==========================================

// @desc    Get all products for logged-in vendor
// @route   GET /api/vendor/products
// @access  Private/Vendor
const getVendorProducts = asyncHandler(async (req, res) => {
  const { search = '', category, stockStatus, status, page = 1, limit = 50 } = req.query;
  const vendorId = req.user._id;

  // Strict vendor isolation & exclude archived items
  const query = {
    vendor: vendorId,
    isArchived: { $ne: true },
  };

  if (category) {
    query.category = category;
  }

  if (stockStatus === 'in_stock') {
    query.stock = { $gt: 5 };
  } else if (stockStatus === 'low_stock') {
    query.stock = { $gt: 0, $lte: 5 };
  } else if (stockStatus === 'out_of_stock') {
    query.stock = 0;
  }

  // Status filtering: active, inactive, pending
  if (status === 'active') {
    query.isActive = { $ne: false };
    query.vendorStatus = 'approved';
  } else if (status === 'inactive') {
    query.isActive = false;
  } else if (status === 'pending') {
    query.vendorStatus = 'pending';
  }

  if (search) {
    const regex = new RegExp(search.trim(), 'i');
    query.$or = [{ name: regex }, { brand: regex }, { description: regex }];
  }

  const pageNum = parseInt(page, 10) || 1;
  const limitNum = parseInt(limit, 10) || 50;
  const skip = (pageNum - 1) * limitNum;

  const [total, products] = await Promise.all([
    Product.countDocuments(query),
    Product.find(query)
      .populate('category', 'name slug')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum),
  ]);

  res.json({
    success: true,
    total,
    page: pageNum,
    pages: Math.ceil(total / limitNum) || 1,
    products,
  });
});

// @desc    Get single vendor product
// @route   GET /api/vendor/products/:id
// @access  Private/Vendor
const getVendorProductById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const vendorId = req.user._id;

  const product = await Product.findOne({
    _id: id,
    vendor: vendorId,
    isArchived: { $ne: true },
  }).populate('category', 'name slug');

  if (!product) {
    return res.status(404).json({ success: false, message: 'Product not found or unauthorized' });
  }

  const reviews = await Review.find({ product: product._id }).sort({ createdAt: -1 });

  res.json({
    success: true,
    product: {
      ...product.toObject(),
      reviews,
    },
  });
});

// @desc    Create new product (Vendor)
// @route   POST /api/vendor/products
// @access  Private/Vendor
const createVendorProduct = asyncHandler(async (req, res) => {
  const vendorId = req.user._id;
  const isApproved = req.user.vendorStatus === 'approved' || req.user.role === 'admin';

  const {
    name,
    description,
    price,
    originalPrice,
    category,
    images = [],
    stock,
    brand,
    tags = [],
    isFeatured = false,
    isActive = true,
  } = req.body;

  if (!name || !price || !category) {
    return res.status(400).json({
      success: false,
      message: 'Product name, price, and category are required',
    });
  }

  const formattedImages = Array.isArray(images)
    ? images.filter(Boolean)
    : typeof images === 'string' && images.trim()
    ? [images.trim()]
    : [];

  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '') + `-${Date.now().toString().slice(-4)}`;

  const product = await Product.create({
    name: name.trim(),
    slug,
    description: description ? description.trim() : '',
    price: Number(price),
    originalPrice: originalPrice ? Number(originalPrice) : Number(price),
    category,
    images: formattedImages.length ? formattedImages : ['https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80'],
    stock: stock !== undefined ? Math.max(0, Number(stock)) : 10,
    brand: brand ? brand.trim() : req.user.storeName || 'Custom Store',
    tags: Array.isArray(tags) ? tags : typeof tags === 'string' ? tags.split(',').map((t) => t.trim()) : [],
    isFeatured: Boolean(isFeatured),
    isActive: Boolean(isActive),
    isArchived: false,
    vendor: vendorId,
    vendorStatus: isApproved ? 'approved' : 'pending',
  });

  const populated = await Product.findById(product._id).populate('category', 'name slug');

  // Notify admin about vendor product submission
  try {
    const AdminNotification = require('../models/adminNotification');
    await AdminNotification.create({
      title: 'New Product Uploaded 📦',
      message: `Store "${req.user.storeName || req.user.name}" added product "${product.name}" (₹${product.price}).`,
      type: 'PRODUCT_MODERATION',
      severity: 'info',
      link: '/admin/products',
    });
  } catch (notifyErr) {
    console.warn('Failed to notify admin of vendor product:', notifyErr.message);
  }

  res.status(201).json({
    success: true,
    message: isApproved
      ? 'Product created and published to store successfully!'
      : 'Product created as draft (pending vendor approval). It will be published once your account is verified.',
    product: populated,
  });
});

// @desc    Update product (Vendor)
// @route   PUT /api/vendor/products/:id
// @access  Private/Vendor
const updateVendorProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const vendorId = req.user._id;

  const product = await Product.findOne({
    _id: id,
    vendor: vendorId,
    isArchived: { $ne: true },
  });

  if (!product) {
    return res.status(404).json({ success: false, message: 'Product not found or unauthorized' });
  }

  const {
    name,
    description,
    price,
    originalPrice,
    category,
    images,
    stock,
    brand,
    tags,
    isFeatured,
    isActive,
  } = req.body;

  if (name) product.name = name.trim();
  if (description !== undefined) product.description = description.trim();
  if (price !== undefined) product.price = Number(price);
  if (originalPrice !== undefined) product.originalPrice = Number(originalPrice);
  if (category) product.category = category;
  if (stock !== undefined) product.stock = Math.max(0, Number(stock));
  if (brand !== undefined) product.brand = brand.trim();
  if (isFeatured !== undefined) product.isFeatured = Boolean(isFeatured);
  if (isActive !== undefined) product.isActive = Boolean(isActive);

  if (images !== undefined) {
    product.images = Array.isArray(images)
      ? images.filter(Boolean)
      : typeof images === 'string' && images.trim()
      ? [images.trim()]
      : product.images;
  }

  if (tags !== undefined) {
    product.tags = Array.isArray(tags) ? tags : typeof tags === 'string' ? tags.split(',').map((t) => t.trim()) : product.tags;
  }

  const updated = await product.save();
  const populated = await Product.findById(updated._id).populate('category', 'name slug');

  res.json({
    success: true,
    message: 'Product updated successfully',
    product: populated,
  });
});

// @desc    Toggle product active/deactivated state
// @route   PATCH /api/vendor/products/:id/toggle-status
// @access  Private/Vendor
const toggleVendorProductStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const vendorId = req.user._id;
  const { isActive } = req.body;

  const product = await Product.findOne({
    _id: id,
    vendor: vendorId,
    isArchived: { $ne: true },
  }).populate('category', 'name slug');

  if (!product) {
    return res.status(404).json({ success: false, message: 'Product not found or unauthorized' });
  }

  product.isActive = typeof isActive === 'boolean' ? isActive : !product.isActive;
  await product.save();

  res.json({
    success: true,
    message: `Product "${product.name}" is now ${product.isActive ? 'Active (Live on storefront)' : 'Deactivated (Hidden from storefront)'}.`,
    product,
  });
});

// @desc    Delete product (Vendor) - safe deletion with order protection and archival
// @route   DELETE /api/vendor/products/:id
// @access  Private/Vendor
const deleteVendorProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const vendorId = req.user._id;

  const product = await Product.findOne({
    _id: id,
    vendor: vendorId,
    isArchived: { $ne: true },
  });

  if (!product) {
    return res.status(404).json({ success: false, message: 'Product not found or unauthorized' });
  }

  // 1. Prevent unsafe deletion if product has active/pending orders
  const activeOrderStatuses = [
    'Order Placed',
    'Confirmed',
    'Processing',
    'Ready to Ship',
    'Shipped',
    'Out for Delivery',
    'placed',
    'confirmed',
    'processing',
    'ready_to_ship',
    'shipped',
  ];

  const pendingOrder = await Order.findOne({
    'items.product': id,
    orderStatus: { $in: activeOrderStatuses },
  }).select('orderId orderStatus createdAt');

  if (pendingOrder) {
    return res.status(400).json({
      success: false,
      code: 'PRODUCT_HAS_PENDING_ORDERS',
      orderId: pendingOrder.orderId,
      orderStatus: pendingOrder.orderStatus,
      message: `Cannot delete "${product.name}" because it is part of pending order #${pendingOrder.orderId} (Status: ${pendingOrder.orderStatus}). Please deactivate the product instead so no new orders can be placed while active orders are fulfilled.`,
    });
  }

  // 2. Check if product has past completed/cancelled orders
  const pastOrder = await Order.findOne({
    'items.product': id,
  }).select('orderId');

  if (pastOrder) {
    // Soft-delete / archive to preserve order items, invoices, and sales reports
    product.isArchived = true;
    product.isActive = false;
    await product.save();

    return res.json({
      success: true,
      archived: true,
      message: `Product "${product.name}" has completed order history. It has been safely archived and removed from your active catalog while preserving past order records.`,
    });
  }

  // 3. No orders ever existed: safe to hard-delete completely
  await Product.deleteOne({ _id: id });
  await Review.deleteMany({ product: id });

  res.json({
    success: true,
    archived: false,
    message: `Product "${product.name}" deleted successfully.`,
  });
});

// ==========================================
// 5. VENDOR ORDER MANAGEMENT
// ==========================================

// @desc    Get Orders containing this vendor's items
// @route   GET /api/vendor/orders
// @access  Private/Vendor
const getVendorOrders = asyncHandler(async (req, res) => {
  const vendorId = req.user._id;
  const { status, search } = req.query;

  // Find all products owned by this vendor
  const vendorProducts = await Product.find({ vendor: vendorId }, '_id name price images');
  const vendorProductIds = vendorProducts.map((p) => p._id.toString());

  const query = {
    $or: [
      { 'items.vendor': vendorId },
      { 'items.product': { $in: vendorProducts.map((p) => p._id) } },
    ],
  };

  if (status && status !== 'all') {
    query.orderStatus = status;
  }

  if (search) {
    query.$or = [
      { orderId: { $regex: search, $options: 'i' } },
      { 'shippingAddress.fullName': { $regex: search, $options: 'i' } },
      { 'shippingAddress.phone': { $regex: search, $options: 'i' } },
    ];
  }

  const orders = await Order.find(query)
    .populate('user', 'name email phone')
    .populate('deliveryPartner', 'name phone vehicleType vehicleNumber deliveryStatus')
    .sort({ createdAt: -1 });

  // Map each order to compute vendor-specific totals and isolate vendor items
  const processedOrders = orders.map((ord) => {
    const vendorItems = ord.items.filter((item) => {
      const isVendorMatch = item.vendor && item.vendor.toString() === vendorId.toString();
      const isProductMatch = item.product && vendorProductIds.includes(item.product.toString());
      return isVendorMatch || isProductMatch;
    });

    const vendorSubtotal = vendorItems.reduce((acc, it) => acc + (it.price * it.quantity), 0);
    const vendorItemsCount = vendorItems.reduce((acc, it) => acc + it.quantity, 0);
    const commissionRate = req.user.commissionRate !== undefined ? req.user.commissionRate : 10;
    const platformFee = Math.round((vendorSubtotal * commissionRate) / 100);
    const vendorEarnings = Math.max(0, vendorSubtotal - platformFee);

    return {
      _id: ord._id,
      orderId: ord.orderId,
      createdAt: ord.createdAt,
      customer: {
        name: ord.shippingAddress?.fullName || ord.user?.name || 'Customer',
        phone: ord.shippingAddress?.phone || ord.user?.phone || '',
        email: ord.user?.email || '',
      },
      shippingAddress: ord.shippingAddress,
      paymentMethod: ord.paymentMethod,
      paymentStatus: ord.paymentStatus,
      orderStatus: ord.orderStatus,
      deliveryStatus: ord.deliveryStatus || 'Pending Assignment',
      deliveryPartner: ord.deliveryPartner
        ? {
            _id: ord.deliveryPartner._id,
            name: ord.deliveryPartner.name,
            phone: ord.deliveryPartner.phone,
            vehicleType: ord.deliveryPartner.vehicleType,
            vehicleNumber: ord.deliveryPartner.vehicleNumber,
          }
        : null,
      pickupNotes: ord.pickupNotes,
      pickupExceptionReported: ord.pickupExceptionReported,
      courierName: ord.courierName,
      trackingNumber: ord.trackingNumber,
      estimatedDeliveryDate: ord.estimatedDeliveryDate,
      vendorItems,
      vendorSubtotal,
      vendorItemsCount,
      commissionRate,
      platformFee,
      vendorEarnings,
      orderTotal: ord.total,
      statusHistory: ord.statusHistory,
    };
  });

  res.json({
    success: true,
    count: processedOrders.length,
    orders: processedOrders,
  });
});

// @desc    Get single vendor order detail
// @route   GET /api/vendor/orders/:id
// @access  Private/Vendor
const getVendorOrderById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const vendorId = req.user._id;

  const vendorProducts = await Product.find({ vendor: vendorId }, '_id');
  const vendorProductIds = vendorProducts.map((p) => p._id.toString());

  let query = { orderId: id };
  if (id.match(/^[0-9a-fA-F]{24}$/)) {
    query = { $or: [{ _id: id }, { orderId: id }] };
  }

  const order = await Order.findOne(query)
    .populate('user', 'name email phone')
    .populate('deliveryPartner', 'name phone vehicleType vehicleNumber deliveryStatus');
  if (!order) {
    return res.status(404).json({ success: false, message: 'Order not found' });
  }

  const vendorItems = order.items.filter((item) => {
    const isVendorMatch = item.vendor && item.vendor.toString() === vendorId.toString();
    const isProductMatch = item.product && vendorProductIds.includes(item.product.toString());
    return isVendorMatch || isProductMatch;
  });

  if (vendorItems.length === 0 && req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'This order does not contain products from your store' });
  }

  const vendorSubtotal = vendorItems.reduce((acc, it) => acc + (it.price * it.quantity), 0);
  const commissionRate = req.user.commissionRate !== undefined ? req.user.commissionRate : 10;
  const platformFee = Math.round((vendorSubtotal * commissionRate) / 100);
  const vendorEarnings = Math.max(0, vendorSubtotal - platformFee);

  res.json({
    success: true,
    order: {
      ...order.toObject(),
      vendorItems,
      vendorSubtotal,
      commissionRate,
      platformFee,
      vendorEarnings,
    },
  });
});

// @desc    Update Order Status by Vendor
// @route   PUT /api/vendor/orders/:id/status
// @access  Private/Vendor
const updateVendorOrderStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status, courierName, trackingNumber, note } = req.body;
  const vendorId = req.user._id;

  const validStatuses = ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({
      success: false,
      message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
    });
  }

  let query = { orderId: id };
  if (id.match(/^[0-9a-fA-F]{24}$/)) {
    query = { $or: [{ _id: id }, { orderId: id }] };
  }

  const order = await Order.findOne(query);
  if (!order) {
    return res.status(404).json({ success: false, message: 'Order not found' });
  }

  // Update item status for vendor's items
  let vendorItemFound = false;
  order.items.forEach((item) => {
    if (item.vendor && item.vendor.toString() === vendorId.toString()) {
      item.itemStatus = status;
      if (courierName) item.courierName = courierName;
      if (trackingNumber) item.trackingNumber = trackingNumber;
      vendorItemFound = true;
    }
  });

  // Update overall order status
  order.orderStatus = status;
  if (courierName) order.courierName = courierName;
  if (trackingNumber) order.trackingNumber = trackingNumber;

  if (status === 'Delivered') {
    order.paymentStatus = 'Paid';
    if (!order.paymentVerifiedAt) {
      order.paymentVerifiedAt = new Date();
    }
  }

  order.statusHistory.push({
    status,
    timestamp: new Date(),
    note: note || `Order updated to "${status}" by Vendor (${req.user.storeName || req.user.name})`,
  });

  await order.save();

  res.json({
    success: true,
    message: `Order status successfully updated to "${status}"`,
    order,
  });
});

// ==========================================
// 6. SALES REPORTS & EARNINGS
// ==========================================

// @desc    Get Sales Reports and Earnings Summary
// @route   GET /api/vendor/reports
// @access  Private/Vendor
const getVendorReports = asyncHandler(async (req, res) => {
  const vendorId = req.user._id;

  const vendorProducts = await Product.find({ vendor: vendorId }, '_id name price');
  const vendorProductIds = vendorProducts.map((p) => p._id.toString());

  const orders = await Order.find({
    $or: [
      { 'items.vendor': vendorId },
      { 'items.product': { $in: vendorProducts.map((p) => p._id) } },
    ],
  }).sort({ createdAt: -1 });

  const commissionRate = req.user.commissionRate || 10;

  let totalGross = 0;
  let totalItemsCount = 0;
  let totalOrdersCount = 0;

  const orderEarnings = [];

  orders.forEach((ord) => {
    const isCancelled = ord.orderStatus === 'Cancelled' || ord.orderStatus === 'cancelled';
    const vItems = ord.items.filter((item) => {
      const isVendorMatch = item.vendor && item.vendor.toString() === vendorId.toString();
      const isProductMatch = item.product && vendorProductIds.includes(item.product.toString());
      return isVendorMatch || isProductMatch;
    });

    if (vItems.length > 0) {
      const gross = vItems.reduce((acc, it) => acc + (it.price * it.quantity), 0);
      const itemsCount = vItems.reduce((acc, it) => acc + it.quantity, 0);
      const fee = Math.round((gross * commissionRate) / 100);
      const net = gross - fee;

      if (!isCancelled) {
        totalGross += gross;
        totalItemsCount += itemsCount;
        totalOrdersCount++;
      }

      orderEarnings.push({
        orderId: ord.orderId,
        date: ord.createdAt,
        itemsCount,
        grossAmount: gross,
        platformFee: fee,
        netPayout: net,
        orderStatus: ord.orderStatus,
        paymentStatus: ord.paymentStatus,
        payoutStatus: ord.orderStatus === 'Delivered' ? 'Cleared' : isCancelled ? 'Void' : 'Pending Clearance',
      });
    }
  });

  const totalFee = Math.round((totalGross * commissionRate) / 100);
  const totalNet = totalGross - totalFee;
  const avgOrderValue = totalOrdersCount > 0 ? Math.round(totalGross / totalOrdersCount) : 0;

  res.json({
    success: true,
    summary: {
      totalGrossSales: totalGross,
      platformFee: totalFee,
      netEarnings: totalNet,
      commissionRate,
      totalOrders: totalOrdersCount,
      totalItemsSold: totalItemsCount,
      averageOrderValue: avgOrderValue,
      withdrawableBalance: totalNet,
      payoutAccount: req.user.payoutDetails || null,
    },
    orders: orderEarnings,
  });
});

// ==========================================
// 7. CUSTOMER REVIEWS MANAGEMENT
// ==========================================

// @desc    Get Reviews for Vendor Products
// @route   GET /api/vendor/reviews
// @access  Private/Vendor
const getVendorReviews = asyncHandler(async (req, res) => {
  const vendorId = req.user._id;

  const vendorProducts = await Product.find({ vendor: vendorId }, '_id name price images rating');
  const productMap = {};
  vendorProducts.forEach((p) => {
    productMap[p._id.toString()] = p;
  });

  const reviews = await Review.find({
    product: { $in: vendorProducts.map((p) => p._id) },
  }).sort({ createdAt: -1 });

  // Star ratings distribution
  const ratingsCount = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  let totalRatingSum = 0;

  const formattedReviews = reviews.map((r) => {
    const star = Math.round(r.rating);
    if (ratingsCount[star] !== undefined) {
      ratingsCount[star]++;
    }
    totalRatingSum += r.rating;

    const prod = productMap[r.product.toString()];

    return {
      _id: r._id,
      product: {
        _id: r.product,
        name: prod?.name || 'Product',
        image: prod?.images?.[0] || '',
      },
      userName: r.userName,
      rating: r.rating,
      title: r.title,
      comment: r.comment,
      helpful: r.helpful,
      vendorReply: r.vendorReply || null,
      createdAt: r.createdAt,
    };
  });

  const averageRating = reviews.length > 0 ? (totalRatingSum / reviews.length).toFixed(1) : '5.0';

  res.json({
    success: true,
    totalReviews: reviews.length,
    averageRating: Number(averageRating),
    ratingsDistribution: ratingsCount,
    reviews: formattedReviews,
  });
});

// @desc    Reply to a Customer Review
// @route   POST /api/vendor/reviews/:id/reply
// @access  Private/Vendor
const replyToReview = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { replyText } = req.body;
  const vendorId = req.user._id;

  if (!replyText || !replyText.trim()) {
    return res.status(400).json({ success: false, message: 'Reply text is required' });
  }

  const review = await Review.findById(id).populate('product', 'vendor name');
  if (!review) {
    return res.status(404).json({ success: false, message: 'Review not found' });
  }

  // Ensure review belongs to this vendor's product
  if (review.product.vendor?.toString() !== vendorId.toString() && req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Not authorized to reply to reviews for other vendors' });
  }

  review.vendorReply = {
    text: replyText.trim(),
    repliedAt: new Date(),
  };

  await review.save();

  res.json({
    success: true,
    message: 'Your response has been published to the review',
    vendorReply: review.vendorReply,
  });
});

// ==========================================
// 8. ADMIN VENDOR MANAGEMENT
// ==========================================

// @desc    Get all vendors (Admin)
// @route   GET /api/admin/vendors
// @access  Private/Admin
const getAllVendorsForAdmin = asyncHandler(async (req, res) => {
  const vendors = await User.find({ role: 'vendor' }).select('-password').sort({ createdAt: -1 });

  // Enrich with products count and total sales
  const enrichedVendors = await Promise.all(
    vendors.map(async (v) => {
      const productCount = await Product.countDocuments({ vendor: v._id });
      const orders = await Order.find({ 'items.vendor': v._id });
      const totalSales = orders.reduce((sum, ord) => {
        if (ord.orderStatus === 'Cancelled') return sum;
        const vItems = ord.items.filter((it) => it.vendor && it.vendor.toString() === v._id.toString());
        return sum + vItems.reduce((acc, it) => acc + (it.price * it.quantity), 0);
      }, 0);

      return {
        ...v.toObject(),
        productCount,
        totalSales,
      };
    })
  );

  res.json({
    success: true,
    count: enrichedVendors.length,
    vendors: enrichedVendors,
  });
});

// @desc    Update Vendor Status (Admin Approve / Reject / Suspend)
// @route   PUT /api/admin/vendors/:id/status
// @access  Private/Admin
const updateVendorStatusByAdmin = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status, rejectionReason, commissionRate } = req.body;

  const validStatuses = ['approved', 'rejected', 'suspended', 'pending'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({
      success: false,
      message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
    });
  }

  const vendor = await User.findById(id);
  if (!vendor || vendor.role !== 'vendor') {
    return res.status(404).json({ success: false, message: 'Vendor not found' });
  }

  const previousStatus = vendor.vendorStatus;
  vendor.vendorStatus = status;

  if (status === 'approved') {
    vendor.vendorApprovedAt = new Date();
    vendor.vendorRejectionReason = '';
    // Also approve all pending products by this vendor
    await Product.updateMany({ vendor: vendor._id }, { vendorStatus: 'approved' });

    // Notify seller of approval
    try {
      const NotificationService = require('../services/notificationService');
      await NotificationService.sendVendorApprovalNotification(vendor);
    } catch (nErr) {
      console.warn('Vendor approval notification warning:', nErr.message);
    }
  } else if (status === 'rejected') {
    vendor.vendorRejectionReason = rejectionReason || 'Store verification criteria not fulfilled.';
    // Hide products
    await Product.updateMany({ vendor: vendor._id }, { vendorStatus: 'rejected' });

    // Notify seller of rejection
    try {
      const NotificationService = require('../services/notificationService');
      await NotificationService.sendVendorRejectionNotification(vendor, vendor.vendorRejectionReason);
    } catch (nErr) {
      console.warn('Vendor rejection notification warning:', nErr.message);
    }
  } else if (status === 'suspended') {
    await Product.updateMany({ vendor: vendor._id }, { vendorStatus: 'rejected' });
  }

  if (commissionRate !== undefined) {
    vendor.commissionRate = Number(commissionRate);
  }

  await vendor.save();

  // Audit log
  try {
    const AuditLog = require('../models/auditLog');
    await AuditLog.create({
      admin: req.user?._id,
      adminEmail: req.user?.email || 'admin@appsica.com',
      adminName: req.user?.name || 'Appsica Admin',
      category: 'VENDORS',
      action: status === 'approved' ? 'APPROVE_VENDOR' : status === 'rejected' ? 'REJECT_VENDOR' : 'UPDATE_VENDOR_STATUS',
      target: vendor.storeName || vendor.name,
      details: `Status changed from ${previousStatus} to ${status}${rejectionReason ? ` (Reason: ${rejectionReason})` : ''}`,
      status: 'SUCCESS',
    });
  } catch (auditErr) {
    console.warn('AuditLog error:', auditErr.message);
  }

  res.json({
    success: true,
    message: `Vendor "${vendor.storeName || vendor.name}" status updated to "${status}"`,
    vendor: {
      _id: vendor._id,
      id: vendor._id,
      name: vendor.name,
      email: vendor.email,
      role: vendor.role,
      vendorStatus: vendor.vendorStatus,
      storeName: vendor.storeName,
      vendorApprovedAt: vendor.vendorApprovedAt,
      vendorRejectionReason: vendor.vendorRejectionReason,
    },
  });
});

// ==========================================
// 8. VENDOR NOTIFICATIONS
// ==========================================
const getVendorNotifications = asyncHandler(async (req, res) => {
  const VendorNotification = require('../models/vendorNotification');
  const notifications = await VendorNotification.find({ recipient: req.user._id })
    .sort({ createdAt: -1 })
    .limit(50);
  const unreadCount = await VendorNotification.countDocuments({
    recipient: req.user._id,
    isRead: false,
  });

  res.json({
    success: true,
    notifications,
    unreadCount,
  });
});

const markAllVendorNotificationsRead = asyncHandler(async (req, res) => {
  const VendorNotification = require('../models/vendorNotification');
  await VendorNotification.updateMany(
    { recipient: req.user._id, isRead: false },
    { $set: { isRead: true } }
  );

  res.json({
    success: true,
    message: 'All vendor notifications marked as read',
  });
});

module.exports = {
  // Auth
  registerVendor,
  loginVendor,
  // Profile
  getProfile,
  updateProfile,
  // Dashboard
  getDashboardStats,
  // Products
  getVendorProducts,
  getVendorProductById,
  createVendorProduct,
  updateVendorProduct,
  toggleVendorProductStatus,
  deleteVendorProduct,
  // Orders
  getVendorOrders,
  getVendorOrderById,
  updateVendorOrderStatus,
  // Reports
  getVendorReports,
  // Reviews
  getVendorReviews,
  replyToReview,
  // Notifications
  getVendorNotifications,
  markAllVendorNotificationsRead,
  // Admin Vendor endpoints
  getAllVendorsForAdmin,
  updateVendorStatusByAdmin,
};
