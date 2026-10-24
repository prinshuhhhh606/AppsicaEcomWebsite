const Banner = require('../models/banner');
const asyncHandler = require('../utils/asyncHandler');

// @desc    Get all active banners (or all for admin)
// @route   GET /api/banners and GET /api/admin/banners
// @access  Public / Admin
const getBanners = asyncHandler(async (req, res) => {
  const isAdminRequest = req.baseUrl.includes('admin');
  const query = isAdminRequest ? {} : { isActive: true };

  const banners = await Banner.find(query).sort({ position: 1, createdAt: -1 });

  res.json({
    success: true,
    count: banners.length,
    banners,
  });
});

// @desc    Create banner
// @route   POST /api/admin/banners
// @access  Private/Admin
const createBanner = asyncHandler(async (req, res) => {
  const { title, subtitle, image, link, position, isActive } = req.body;

  if (!title || !image) {
    return res.status(400).json({ success: false, message: 'Banner title and image URL are required' });
  }

  const banner = await Banner.create({
    title,
    subtitle: subtitle || '',
    image,
    link: link || '/products',
    position: position ? Number(position) : 0,
    isActive: isActive !== undefined ? !!isActive : true,
  });

  res.status(201).json({
    success: true,
    banner,
  });
});

// @desc    Update banner
// @route   PUT /api/admin/banners/:id
// @access  Private/Admin
const updateBanner = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const banner = await Banner.findById(id);

  if (!banner) {
    return res.status(404).json({ success: false, message: 'Banner not found' });
  }

  Object.assign(banner, req.body);
  const updated = await banner.save();

  res.json({
    success: true,
    banner: updated,
  });
});

// @desc    Delete banner
// @route   DELETE /api/admin/banners/:id
// @access  Private/Admin
const deleteBanner = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const banner = await Banner.findByIdAndDelete(id);

  if (!banner) {
    return res.status(404).json({ success: false, message: 'Banner not found' });
  }

  res.json({
    success: true,
    message: 'Banner deleted successfully',
  });
});

module.exports = {
  getBanners,
  createBanner,
  updateBanner,
  deleteBanner,
};
