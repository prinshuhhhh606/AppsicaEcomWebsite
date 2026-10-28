const Product = require('../models/product');
const Category = require('../models/category');
const Review = require('../models/review');
const asyncHandler = require('../utils/asyncHandler');

// @desc    Get all products with filtering, sorting, pagination
// @route   GET /api/products
// @access  Public
const getAll = asyncHandler(async (req, res) => {
  const { category, minPrice, maxPrice, rating, sort = 'newest', page = 1, limit = 50 } = req.query;

  const query = {};

  // Filter by category (either category slug or ObjectId)
  if (category) {
    const foundCategory = await Category.findOne({
      $or: [{ slug: category.toLowerCase() }, { _id: category.match(/^[0-9a-fA-F]{24}$/) ? category : null }],
    });
    if (foundCategory) {
      query.category = foundCategory._id;
    }
  }

  // Filter by price
  if (minPrice !== undefined || maxPrice !== undefined) {
    query.price = {};
    if (minPrice !== undefined && minPrice !== '') query.price.$gte = Number(minPrice);
    if (maxPrice !== undefined && maxPrice !== '') query.price.$lte = Number(maxPrice);
  }

  // Filter by rating
  if (rating) {
    query.rating = { $gte: Number(rating) };
  }

  // Sorting
  let sortOption = { createdAt: -1 };
  if (sort === 'price_low') sortOption = { price: 1 };
  else if (sort === 'price_high') sortOption = { price: -1 };
  else if (sort === 'rating' || sort === 'popular') sortOption = { rating: -1, reviewCount: -1 };
  else if (sort === 'newest') sortOption = { createdAt: -1 };

  const pageNum = parseInt(page, 10) || 1;
  const limitNum = parseInt(limit, 10) || 50;
  const skip = (pageNum - 1) * limitNum;

  // Only show active, non-archived platform or approved vendor products in public catalog
  query.isArchived = { $ne: true };
  query.isActive = { $ne: false };
  query.$or = [{ vendor: null }, { vendorStatus: 'approved' }];

  const total = await Product.countDocuments(query);
  const products = await Product.find(query)
    .populate('category', 'name slug')
    .populate('vendor', 'name storeName storeLogo vendorStatus')
    .sort(sortOption)
    .skip(skip)
    .limit(limitNum);

  res.json({
    success: true,
    count: products.length,
    total,
    page: pageNum,
    pages: Math.ceil(total / limitNum) || 1,
    products,
  });
});

// @desc    Get single product by ID
// @route   GET /api/products/:id
// @access  Public
const getById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  let product;
  if (id.match(/^[0-9a-fA-F]{24}$/)) {
    product = await Product.findById(id)
      .populate('category', 'name slug')
      .populate('vendor', 'name storeName storeLogo storeDescription vendorStatus');
  } else {
    product = await Product.findOne({ slug: id })
      .populate('category', 'name slug')
      .populate('vendor', 'name storeName storeLogo storeDescription vendorStatus');
  }

  if (!product || product.isArchived) {
    return res.status(404).json({ success: false, message: 'Product not found or has been discontinued' });
  }

  const reviews = await Review.find({ product: product._id }).sort({ createdAt: -1 });

  res.json({
    success: true,
    product: {
      ...product.toObject(),
      isDeactivated: product.isActive === false,
      reviews,
    },
  });
});

// @desc    Get products by category slug
// @route   GET /api/products/category/:slug
// @access  Public
const getByCategory = asyncHandler(async (req, res) => {
  const { slug } = req.params;
  const { sort = 'newest' } = req.query;

  const category = await Category.findOne({ slug: slug.toLowerCase() });
  if (!category) {
    return res.json({ success: true, count: 0, products: [] });
  }

  let sortOption = { createdAt: -1 };
  if (sort === 'price_low') sortOption = { price: 1 };
  else if (sort === 'price_high') sortOption = { price: -1 };
  else if (sort === 'rating' || sort === 'popular') sortOption = { rating: -1 };

  const products = await Product.find({
    category: category._id,
    isArchived: { $ne: true },
    isActive: { $ne: false },
    $or: [{ vendor: null }, { vendorStatus: 'approved' }],
  })
    .populate('category', 'name slug')
    .populate('vendor', 'name storeName storeLogo vendorStatus')
    .sort(sortOption);

  res.json({
    success: true,
    category,
    count: products.length,
    products,
  });
});

// @desc    Search products
// @route   GET /api/products/search
// @access  Public
const search = asyncHandler(async (req, res) => {
  const { q = '', sort = 'newest' } = req.query;
  const term = q.trim();

  const baseFilter = {
    isArchived: { $ne: true },
    isActive: { $ne: false },
    $or: [{ vendor: null }, { vendorStatus: 'approved' }],
  };

  let query = { ...baseFilter };

  if (term) {
    const regex = new RegExp(term, 'i');
    query = {
      $and: [
        baseFilter,
        {
          $or: [
            { name: regex },
            { description: regex },
            { brand: regex },
            { tags: regex },
          ],
        },
      ],
    };
  }

  let sortOption = { createdAt: -1 };
  if (sort === 'price_low') sortOption = { price: 1 };
  else if (sort === 'price_high') sortOption = { price: -1 };
  else if (sort === 'rating' || sort === 'popular') sortOption = { rating: -1 };

  const products = await Product.find(query)
    .populate('category', 'name slug')
    .populate('vendor', 'name storeName storeLogo vendorStatus')
    .sort(sortOption);

  res.json({
    success: true,
    count: products.length,
    products,
  });
});

// @desc    Get featured products
// @route   GET /api/products/featured
// @access  Public
const getFeatured = asyncHandler(async (req, res) => {
  const products = await Product.find({
    isFeatured: true,
    isArchived: { $ne: true },
    isActive: { $ne: false },
    $or: [{ vendor: null }, { vendorStatus: 'approved' }],
  })
    .populate('category', 'name slug')
    .populate('vendor', 'name storeName storeLogo vendorStatus')
    .limit(8);

  // If no featured flag set, return top rated products
  if (products.length === 0) {
    const topProducts = await Product.find({
      isArchived: { $ne: true },
      isActive: { $ne: false },
      $or: [{ vendor: null }, { vendorStatus: 'approved' }],
    })
      .populate('category', 'name slug')
      .populate('vendor', 'name storeName storeLogo vendorStatus')
      .sort({ rating: -1, reviewCount: -1 })
      .limit(8);
    return res.json({ success: true, count: topProducts.length, products: topProducts });
  }

  res.json({
    success: true,
    count: products.length,
    products,
  });
});

// @desc    Get reviews for a product
// @route   GET /api/products/:id/reviews
// @access  Public
const getReviews = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const reviews = await Review.find({ product: id }).sort({ createdAt: -1 });

  res.json({
    success: true,
    count: reviews.length,
    reviews,
  });
});

// @desc    Add review for a product
// @route   POST /api/products/:id/reviews
// @access  Private
const addReview = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { rating, title, comment } = req.body;

  const product = await Product.findById(id);
  if (!product) {
    return res.status(404).json({ success: false, message: 'Product not found' });
  }

  const review = await Review.create({
    product: product._id,
    user: req.user._id,
    userName: req.user.name,
    rating: Number(rating) || 5,
    title: title || '',
    comment: comment || 'Great product!',
  });

  // Re-calculate average rating and count
  const allReviews = await Review.find({ product: product._id });
  const totalRating = allReviews.reduce((sum, item) => sum + item.rating, 0);
  const avgRating = allReviews.length > 0 ? (totalRating / allReviews.length).toFixed(1) : product.rating;

  product.rating = Number(avgRating);
  product.reviewCount = allReviews.length;
  await product.save();

  res.status(201).json({
    success: true,
    message: 'Review submitted successfully',
    review,
    averageRating: product.rating,
    totalReviews: product.reviewCount,
  });
});

// @desc    Create product (Admin)
// @route   POST /api/admin/products
// @access  Private/Admin
const create = asyncHandler(async (req, res) => {
  const { name, description, price, originalPrice, category, images, stock, isFeatured, brand } = req.body;

  if (!name || !price || !category) {
    return res.status(400).json({ success: false, message: 'Name, price and category are required' });
  }

  const product = await Product.create({
    name,
    slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
    description: description || '',
    price: Number(price),
    originalPrice: originalPrice ? Number(originalPrice) : Number(price),
    category,
    images: Array.isArray(images) ? images : images ? [images] : [],
    stock: stock !== undefined ? Number(stock) : 20,
    isFeatured: !!isFeatured,
    brand: brand || 'Appsica Select',
  });

  const populated = await Product.findById(product._id).populate('category', 'name slug');
  res.status(201).json({ success: true, product: populated });
});

// @desc    Update product (Admin)
// @route   PUT /api/admin/products/:id
// @access  Private/Admin
const update = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const product = await Product.findById(id);

  if (!product) {
    return res.status(404).json({ success: false, message: 'Product not found' });
  }

  Object.assign(product, req.body);
  if (req.body.name) {
    product.slug = req.body.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  }

  const updated = await product.save();
  const populated = await Product.findById(updated._id).populate('category', 'name slug');

  res.json({ success: true, product: populated });
});

// @desc    Delete product (Admin)
// @route   DELETE /api/admin/products/:id
// @access  Private/Admin
const deleteProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const product = await Product.findByIdAndDelete(id);

  if (!product) {
    return res.status(404).json({ success: false, message: 'Product not found' });
  }

  await Review.deleteMany({ product: id });
  res.json({ success: true, message: 'Product deleted successfully' });
});

// @desc    Get all products for Admin (including pending and rejected vendor items)
// @route   GET /api/admin/products
// @access  Private/Admin
const getAllForAdmin = asyncHandler(async (req, res) => {
  const { category, search, vendorStatus, limit = 100 } = req.query;
  const query = {};

  if (category) {
    query.category = category;
  }
  if (vendorStatus && vendorStatus !== 'all') {
    query.vendorStatus = vendorStatus;
  }
  if (search) {
    const regex = new RegExp(search, 'i');
    query.$or = [{ name: regex }, { brand: regex }];
  }

  const products = await Product.find(query)
    .populate('category', 'name slug')
    .populate('vendor', 'name storeName storeLogo email vendorStatus')
    .sort({ createdAt: -1 })
    .limit(Number(limit));

  res.json({
    success: true,
    count: products.length,
    products,
  });
});

module.exports = {
  getAll,
  getAllForAdmin,
  getById,
  getByCategory,
  search,
  getFeatured,
  getReviews,
  addReview,
  create,
  update,
  delete: deleteProduct,
};
