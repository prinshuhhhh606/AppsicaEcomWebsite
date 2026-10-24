const Category = require('../models/category');
const asyncHandler = require('../utils/asyncHandler');

// @desc    Get all categories
// @route   GET /api/categories
// @access  Public
const getAll = asyncHandler(async (req, res) => {
  const categories = await Category.find({ isActive: true }).sort({ mark: 1, name: 1 });
  res.json({
    success: true,
    count: categories.length,
    categories,
  });
});

// @desc    Get category by slug
// @route   GET /api/categories/:slug
// @access  Public
const getBySlug = asyncHandler(async (req, res) => {
  const { slug } = req.params;
  const category = await Category.findOne({ slug: slug.toLowerCase() });

  if (!category) {
    return res.status(404).json({ success: false, message: 'Category not found' });
  }

  res.json({
    success: true,
    category,
  });
});

// @desc    Create category (Admin)
// @route   POST /api/admin/categories
// @access  Private/Admin
const create = asyncHandler(async (req, res) => {
  const { name, slug, description, image, mark, tone } = req.body;

  if (!name) {
    return res.status(400).json({ success: false, message: 'Category name is required' });
  }

  const generatedSlug = (slug || name).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

  const category = await Category.create({
    name,
    slug: generatedSlug,
    description: description || '',
    image: image || '',
    mark: mark || '01',
    tone: tone || 'lilac',
  });

  res.status(201).json({ success: true, category });
});

// @desc    Update category (Admin)
// @route   PUT /api/admin/categories/:id
// @access  Private/Admin
const update = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const category = await Category.findById(id);

  if (!category) {
    return res.status(404).json({ success: false, message: 'Category not found' });
  }

  Object.assign(category, req.body);
  if (req.body.name && !req.body.slug) {
    category.slug = req.body.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  }

  const updated = await category.save();
  res.json({ success: true, category: updated });
});

// @desc    Delete category (Admin)
// @route   DELETE /api/admin/categories/:id
// @access  Private/Admin
const deleteCategory = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const category = await Category.findByIdAndDelete(id);

  if (!category) {
    return res.status(404).json({ success: false, message: 'Category not found' });
  }

  res.json({ success: true, message: 'Category deleted successfully' });
});

module.exports = {
  getAll,
  getBySlug,
  create,
  update,
  delete: deleteCategory,
};
