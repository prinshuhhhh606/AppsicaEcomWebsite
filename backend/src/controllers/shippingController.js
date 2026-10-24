const ShippingZone = require('../models/shippingZone');
const asyncHandler = require('../utils/asyncHandler');

// @desc    Get all shipping zones
// @route   GET /api/admin/shipping and GET /api/shipping
// @access  Public / Admin
const getShippingZones = asyncHandler(async (req, res) => {
  const zones = await ShippingZone.find({}).sort({ rate: 1 });

  res.json({
    success: true,
    count: zones.length,
    zones,
  });
});

// @desc    Create shipping zone
// @route   POST /api/admin/shipping
// @access  Private/Admin
const createShippingZone = asyncHandler(async (req, res) => {
  const { name, states, pincodes, rate, freeShippingThreshold, estimatedDays, isActive } = req.body;

  if (!name || rate === undefined) {
    return res.status(400).json({ success: false, message: 'Name and rate are required' });
  }

  const zone = await ShippingZone.create({
    name,
    states: states || [],
    pincodes: pincodes || [],
    rate: Number(rate),
    freeShippingThreshold: freeShippingThreshold !== undefined ? Number(freeShippingThreshold) : 999,
    estimatedDays: estimatedDays || '3-5 business days',
    isActive: isActive !== undefined ? !!isActive : true,
  });

  res.status(201).json({
    success: true,
    zone,
  });
});

// @desc    Update shipping zone
// @route   PUT /api/admin/shipping/:id
// @access  Private/Admin
const updateShipping = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const zone = await ShippingZone.findById(id);

  if (!zone) {
    return res.status(404).json({ success: false, message: 'Shipping zone not found' });
  }

  Object.assign(zone, req.body);
  const updated = await zone.save();

  res.json({
    success: true,
    zone: updated,
  });
});

// @desc    Delete shipping zone
// @route   DELETE /api/admin/shipping/:id
// @access  Private/Admin
const deleteShippingZone = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const zone = await ShippingZone.findByIdAndDelete(id);

  if (!zone) {
    return res.status(404).json({ success: false, message: 'Shipping zone not found' });
  }

  res.json({
    success: true,
    message: 'Shipping zone deleted successfully',
  });
});

module.exports = {
  getShippingZones,
  createShippingZone,
  updateShipping,
  deleteShippingZone,
};
