const Address = require('../models/address');
const asyncHandler = require('../utils/asyncHandler');

// Indian 6-digit PIN code validation regex (cannot start with 0)
const PINCODE_REGEX = /^[1-9][0-9]{5}$/;

// @desc    Get user addresses
// @route   GET /api/addresses
// @access  Private
const getAddresses = asyncHandler(async (req, res) => {
  const addresses = await Address.find({ user: req.user._id }).sort({ isDefault: -1, createdAt: -1 });

  res.json({
    success: true,
    count: addresses.length,
    addresses,
  });
});

// @desc    Add new address
// @route   POST /api/addresses
// @access  Private
const addAddress = asyncHandler(async (req, res) => {
  const {
    fullName,
    phone,
    addressLine,
    street = '',
    locality = '',
    landmark = '',
    city,
    state,
    pincode,
    isDefault,
    type,
  } = req.body;

  const resolvedAddressLine = (addressLine || [street, locality, landmark].filter(Boolean).join(', ')).trim();

  if (!fullName || !phone || !resolvedAddressLine || !city || !state || !pincode) {
    return res.status(400).json({
      success: false,
      message: 'All required address fields (Name, Phone, Street/Address, City, State, PIN code) must be provided',
    });
  }

  // Validate 6-digit Indian PIN code
  const cleanPin = String(pincode).trim();
  if (!PINCODE_REGEX.test(cleanPin)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid PIN code: Must be exactly 6 digits without starting with 0 (e.g. 452001).',
    });
  }

  // Validate phone number
  const phoneClean = String(phone).replace(/\D/g, '');
  if (phoneClean.length < 10) {
    return res.status(400).json({
      success: false,
      message: 'Invalid phone number: Please provide a valid 10-digit mobile number.',
    });
  }

  // If this is the user's first address or marked default, reset other defaults
  const count = await Address.countDocuments({ user: req.user._id });
  const shouldBeDefault = isDefault || count === 0;

  if (shouldBeDefault) {
    await Address.updateMany({ user: req.user._id }, { isDefault: false });
  }

  const address = await Address.create({
    user: req.user._id,
    fullName: String(fullName).trim(),
    phone: phoneClean.slice(-10),
    addressLine: resolvedAddressLine,
    street: String(street || '').trim(),
    locality: String(locality || '').trim(),
    landmark: String(landmark || '').trim(),
    city: String(city).trim(),
    state: String(state).trim(),
    pincode: cleanPin,
    isDefault: shouldBeDefault,
    type: type || 'home',
  });

  res.status(201).json({
    success: true,
    message: 'Address added successfully',
    address,
  });
});

// @desc    Update address
// @route   PUT /api/addresses/:id
// @access  Private
const updateAddress = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const address = await Address.findOne({ _id: id, user: req.user._id });

  if (!address) {
    return res.status(404).json({ success: false, message: 'Address not found' });
  }

  if (req.body.pincode !== undefined) {
    const cleanPin = String(req.body.pincode).trim();
    if (!PINCODE_REGEX.test(cleanPin)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid PIN code: Must be exactly 6 digits without starting with 0 (e.g. 452001).',
      });
    }
    req.body.pincode = cleanPin;
  }

  if (req.body.phone !== undefined) {
    const phoneClean = String(req.body.phone).replace(/\D/g, '');
    if (phoneClean.length < 10) {
      return res.status(400).json({
        success: false,
        message: 'Invalid phone number: Please provide a valid 10-digit mobile number.',
      });
    }
    req.body.phone = phoneClean.slice(-10);
  }

  if (req.body.isDefault) {
    await Address.updateMany({ user: req.user._id }, { isDefault: false });
  }

  Object.assign(address, req.body);
  const updated = await address.save();

  res.json({
    success: true,
    message: 'Address updated successfully',
    address: updated,
  });
});

// @desc    Delete address
// @route   DELETE /api/addresses/:id
// @access  Private
const deleteAddress = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const address = await Address.findOneAndDelete({ _id: id, user: req.user._id });

  if (!address) {
    return res.status(404).json({ success: false, message: 'Address not found' });
  }

  // If deleted address was default, make another one default if exists
  if (address.isDefault) {
    const nextAddress = await Address.findOne({ user: req.user._id });
    if (nextAddress) {
      nextAddress.isDefault = true;
      await nextAddress.save();
    }
  }

  res.json({
    success: true,
    message: 'Address deleted successfully',
  });
});

// @desc    Set default address
// @route   PUT /api/addresses/:id/default
// @access  Private
const setDefault = asyncHandler(async (req, res) => {
  const { id } = req.params;

  await Address.updateMany({ user: req.user._id }, { isDefault: false });

  const address = await Address.findOneAndUpdate(
    { _id: id, user: req.user._id },
    { isDefault: true },
    { new: true }
  );

  if (!address) {
    return res.status(404).json({ success: false, message: 'Address not found' });
  }

  res.json({
    success: true,
    message: 'Default address updated successfully',
    address,
  });
});

module.exports = {
  getAddresses,
  addAddress,
  updateAddress,
  deleteAddress,
  setDefault,
};
