const DeliveryZone = require('../models/deliveryZone');
const User = require('../models/user');
const Product = require('../models/product');
const GeoService = require('../services/geoService');
const asyncHandler = require('../utils/asyncHandler');
const { getIO } = require('../socket');

/**
 * Validates coordinate pair
 */
const isValidCoordinate = (lat, lng) => {
  if (lat === undefined || lng === undefined) return false;
  const numLat = Number(lat);
  const numLng = Number(lng);
  return !isNaN(numLat) && !isNaN(numLng) && numLat >= -90 && numLat <= 90 && numLng >= -180 && numLng <= 180;
};

// @desc    Get all delivery zones for the logged-in Seller
// @route   GET /api/delivery-zones/my-zones
// @access  Private (Vendor / Admin)
const getSellerDeliveryZones = asyncHandler(async (req, res) => {
  const vendorId = req.user._id;

  const zones = await DeliveryZone.find({ vendor: vendorId }).sort({ createdAt: -1 });

  res.json({
    success: true,
    count: zones.length,
    zones,
  });
});

// @desc    Create a new delivery zone
// @route   POST /api/delivery-zones
// @access  Private (Vendor / Admin)
const createDeliveryZone = asyncHandler(async (req, res) => {
  const vendorId = req.user._id;
  const {
    name,
    zoneType = 'radius',
    center,
    radiusKm = 5,
    polygon = [],
    pincodes = [],
    minOrderAmount = 0,
    deliveryFee = 50,
    estimatedDeliveryMinutes = 45,
    isActive = true,
    color = '#6366f1',
  } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({ success: false, message: 'Zone name is required' });
  }

  // Validate Center Coordinates
  const targetCenter = center || req.user.storeLocation || { lat: 19.0760, lng: 72.8777 };
  if (!isValidCoordinate(targetCenter.lat, targetCenter.lng)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid center coordinates. Latitude must be between -90 and 90, Longitude between -180 and 180.',
    });
  }

  // Validate Radius Type
  if (zoneType === 'radius') {
    const numRadius = Number(radiusKm);
    if (isNaN(numRadius) || numRadius < 0.5 || numRadius > 100) {
      return res.status(400).json({
        success: false,
        message: 'Radius must be a valid number between 0.5 km and 100 km',
      });
    }
  }

  // Validate Polygon Type
  if (zoneType === 'polygon') {
    if (!Array.isArray(polygon) || polygon.length < 3) {
      return res.status(400).json({
        success: false,
        message: 'A polygon boundary must contain at least 3 valid coordinate points to form a closed area',
      });
    }

    for (let i = 0; i < polygon.length; i++) {
      const pt = polygon[i];
      if (!isValidCoordinate(pt.lat, pt.lng)) {
        return res.status(400).json({
          success: false,
          message: `Invalid coordinate in polygon point #${i + 1}`,
        });
      }
    }
  }

  const zone = await DeliveryZone.create({
    vendor: vendorId,
    name: name.trim(),
    zoneType,
    center: {
      lat: Number(targetCenter.lat),
      lng: Number(targetCenter.lng),
      address: targetCenter.address || '',
    },
    radiusKm: Number(radiusKm),
    polygon,
    pincodes: Array.isArray(pincodes) ? pincodes.map((p) => String(p).trim()).filter(Boolean) : [],
    minOrderAmount: Math.max(0, Number(minOrderAmount) || 0),
    deliveryFee: Math.max(0, Number(deliveryFee) || 0),
    estimatedDeliveryMinutes: Math.max(5, Number(estimatedDeliveryMinutes) || 45),
    isActive: Boolean(isActive),
    color,
  });

  // Notify real-time if needed
  try {
    const io = getIO();
    if (io) {
      io.emit('zone:updated', { vendorId, zoneId: zone._id });
    }
  } catch (e) {}

  res.status(201).json({
    success: true,
    message: `Delivery zone "${zone.name}" created successfully`,
    zone,
  });
});

// @desc    Update a delivery zone
// @route   PUT /api/delivery-zones/:id
// @access  Private (Vendor / Admin)
const updateDeliveryZone = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const vendorId = req.user._id;

  const zone = await DeliveryZone.findById(id);
  if (!zone) {
    return res.status(404).json({ success: false, message: 'Delivery zone record not found' });
  }

  // Ensure seller ownership unless admin
  if (zone.vendor.toString() !== vendorId.toString() && req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Access denied: You do not own this zone' });
  }

  const {
    name,
    zoneType,
    center,
    radiusKm,
    polygon,
    pincodes,
    minOrderAmount,
    deliveryFee,
    estimatedDeliveryMinutes,
    isActive,
    color,
  } = req.body;

  if (name !== undefined) zone.name = name.trim();
  if (zoneType !== undefined) zone.zoneType = zoneType;

  if (center) {
    if (!isValidCoordinate(center.lat, center.lng)) {
      return res.status(400).json({ success: false, message: 'Invalid center coordinates' });
    }
    zone.center = {
      lat: Number(center.lat),
      lng: Number(center.lng),
      address: center.address || zone.center?.address || '',
    };
  }

  if (radiusKm !== undefined) {
    const numRadius = Number(radiusKm);
    if (isNaN(numRadius) || numRadius < 0.5 || numRadius > 100) {
      return res.status(400).json({ success: false, message: 'Radius must be between 0.5 km and 100 km' });
    }
    zone.radiusKm = numRadius;
  }

  if (polygon !== undefined) {
    if (zone.zoneType === 'polygon' && (!Array.isArray(polygon) || polygon.length < 3)) {
      return res.status(400).json({ success: false, message: 'Polygon must have at least 3 points' });
    }
    zone.polygon = polygon;
  }

  if (pincodes !== undefined) {
    zone.pincodes = Array.isArray(pincodes) ? pincodes.map((p) => String(p).trim()).filter(Boolean) : [];
  }

  if (minOrderAmount !== undefined) zone.minOrderAmount = Math.max(0, Number(minOrderAmount) || 0);
  if (deliveryFee !== undefined) zone.deliveryFee = Math.max(0, Number(deliveryFee) || 0);
  if (estimatedDeliveryMinutes !== undefined) zone.estimatedDeliveryMinutes = Math.max(5, Number(estimatedDeliveryMinutes) || 45);
  if (isActive !== undefined) zone.isActive = Boolean(isActive);
  if (color !== undefined) zone.color = color;

  await zone.save();

  res.json({
    success: true,
    message: `Delivery zone "${zone.name}" updated successfully`,
    zone,
  });
});

// @desc    Delete a delivery zone
// @route   DELETE /api/delivery-zones/:id
// @access  Private (Vendor / Admin)
const deleteDeliveryZone = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const vendorId = req.user._id;

  const zone = await DeliveryZone.findById(id);
  if (!zone) {
    return res.status(404).json({ success: false, message: 'Delivery zone record not found' });
  }

  if (zone.vendor.toString() !== vendorId.toString() && req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Access denied: You do not own this zone' });
  }

  await DeliveryZone.findByIdAndDelete(id);

  res.json({
    success: true,
    message: 'Delivery zone deleted successfully',
  });
});

// @desc    Get Seller Store Location & Zone Settings
// @route   GET /api/delivery-zones/store-location
// @access  Private (Vendor / Admin)
const getSellerStoreLocation = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select(
    'storeName businessAddress storeLocation defaultDeliveryRadiusKm deliveryZonesEnabled'
  );

  res.json({
    success: true,
    storeLocation: user.storeLocation || {
      lat: 19.0760,
      lng: 72.8777,
      address: user.businessAddress || 'Store Location',
      city: 'Mumbai',
      pincode: '400001',
    },
    defaultDeliveryRadiusKm: user.defaultDeliveryRadiusKm || 10,
    deliveryZonesEnabled: user.deliveryZonesEnabled ?? true,
    storeName: user.storeName,
  });
});

// @desc    Update Seller Store Location & Delivery Radius
// @route   PUT /api/delivery-zones/store-location
// @access  Private (Vendor / Admin)
const updateSellerStoreLocation = asyncHandler(async (req, res) => {
  const { lat, lng, address, city, pincode, defaultDeliveryRadiusKm, deliveryZonesEnabled } = req.body;

  if (lat !== undefined && lng !== undefined) {
    if (!isValidCoordinate(lat, lng)) {
      return res.status(400).json({ success: false, message: 'Invalid store coordinates' });
    }
  }

  const user = await User.findById(req.user._id);
  if (!user) {
    return res.status(404).json({ success: false, message: 'User record not found' });
  }

  user.storeLocation = {
    lat: lat !== undefined ? Number(lat) : user.storeLocation?.lat || 19.0760,
    lng: lng !== undefined ? Number(lng) : user.storeLocation?.lng || 72.8777,
    address: address !== undefined ? String(address).trim() : user.storeLocation?.address || '',
    city: city !== undefined ? String(city).trim() : user.storeLocation?.city || 'Mumbai',
    pincode: pincode !== undefined ? String(pincode).trim() : user.storeLocation?.pincode || '400001',
    updatedAt: new Date(),
  };

  if (defaultDeliveryRadiusKm !== undefined) {
    user.defaultDeliveryRadiusKm = Math.min(50, Math.max(1, Number(defaultDeliveryRadiusKm) || 10));
  }

  if (deliveryZonesEnabled !== undefined) {
    user.deliveryZonesEnabled = Boolean(deliveryZonesEnabled);
  }

  await user.save();

  res.json({
    success: true,
    message: 'Store location & delivery settings updated successfully',
    storeLocation: user.storeLocation,
    defaultDeliveryRadiusKm: user.defaultDeliveryRadiusKm,
    deliveryZonesEnabled: user.deliveryZonesEnabled,
  });
});

// @desc    Public/Customer: Check delivery eligibility for a product or cart
// @route   POST /api/delivery-zones/check-eligibility
// @access  Public
const checkEligibility = asyncHandler(async (req, res) => {
  const { productId, items = [], destination } = req.body;

  if (!destination || (!destination.pincode && !destination.city && !destination.address && destination.lat === undefined)) {
    return res.status(400).json({
      success: false,
      message: 'Please provide a valid delivery address or pincode to check availability',
    });
  }

  // Single Product Check
  if (productId) {
    const product = await Product.findById(productId).populate('vendor');
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const seller = product.vendor;
    const result = await GeoService.checkDeliveryEligibility({
      seller,
      product,
      destination,
    });

    return res.json({
      success: true,
      productId: product._id,
      productName: product.name,
      sellerName: seller?.storeName || seller?.name || 'Appsica Verified Seller',
      ...result,
    });
  }

  // Multiple Cart Items Check
  if (Array.isArray(items) && items.length > 0) {
    const itemResults = [];
    let allDeliverable = true;

    for (const item of items) {
      const pId = item.product?._id || item.product || item._id || item.productId;
      const product = await Product.findById(pId).populate('vendor');
      if (!product) continue;

      const seller = product.vendor;
      const result = await GeoService.checkDeliveryEligibility({
        seller,
        product,
        destination,
      });

      if (!result.eligible) {
        allDeliverable = false;
      }

      itemResults.push({
        productId: product._id,
        name: product.name,
        sellerId: seller?._id,
        sellerName: seller?.storeName || seller?.name,
        ...result,
      });
    }

    return res.json({
      success: true,
      allDeliverable,
      items: itemResults,
      message: allDeliverable
        ? 'All items in your cart are available for delivery to this address!'
        : 'Some items in your cart cannot be delivered to your selected location.',
    });
  }

  res.status(400).json({ success: false, message: 'Either productId or items array must be provided' });
});

module.exports = {
  getSellerDeliveryZones,
  createDeliveryZone,
  updateDeliveryZone,
  deleteDeliveryZone,
  getSellerStoreLocation,
  updateSellerStoreLocation,
  checkEligibility,
};

