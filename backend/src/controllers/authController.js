const User = require('../models/user');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const asyncHandler = require('../utils/asyncHandler');

const generateToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET || 'appsica_secret_jwt_key_2026_super_secure_ecom',
    { expiresIn: '30d' }
  );
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const register = asyncHandler(async (req, res) => {
  const { name, email, password, phone, role } = req.body;

  console.log('\n🟡 [API HIT] POST /api/auth/register');
  console.log('📩 Registration payload received for email:', email);

  if (!name || !email || !password) {
    console.log('❌ Registration validation failed: Name, email, or password missing');
    return res.status(400).json({
      success: false,
      message: 'Name, email, and password are required',
    });
  }

  const normalizedEmail = email.toLowerCase().trim();
  const existingUser = await User.findOne({ email: normalizedEmail });

  if (existingUser) {
    console.log(`⚠️ Registration rejected: Email ${normalizedEmail} already exists`);
    return res.status(409).json({
      success: false,
      message: 'Email is already registered. Please log in.',
    });
  }

  // Create user (allow role only if admin or default to user)
  const user = await User.create({
    name: name.trim(),
    email: normalizedEmail,
    password,
    phone: phone ? String(phone).trim() : '',
    role: role === 'admin' ? 'admin' : 'user',
  });

  console.log('========================================================');
  console.log('🎉 [AUTH BACKEND] NEW USER REGISTERED SUCCESSFULLY!');
  console.log(`👤 Name:       ${user.name}`);
  console.log(`📧 Email:      ${user.email}`);
  console.log(`📞 Phone:      ${user.phone || 'Not provided'}`);
  console.log(`👑 Role:       ${user.role}`);
  console.log(`🆔 Mongo ID:   ${user._id}`);
  console.log(`🕒 Registered: ${new Date().toLocaleString()}`);
  console.log('========================================================\n');

  const token = generateToken(user._id);

  res.status(201).json({
    success: true,
    message: 'Registration successful',
    token,
    user: {
      _id: user._id,
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
    },
  });
});

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const login = asyncHandler(async (req, res) => {
   console.log('🟡 LOGIN API HIT');
  const { email, password } = req.body;
  console.log('📩 Login email received:', email);
  if (!email || !password) {
     console.log('❌ Login failed: Missing email or password');
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

  if (user.isBlocked) {
    return res.status(403).json({
      success: false,
      message: 'Your account has been deactivated. Please contact support.',
    });
  }

  const token = generateToken(user._id);

  res.json({
    success: true,
    message: 'Login successful',
    token,
    user: {
      _id: user._id,
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
    },
  });
});

// @desc    Get current user profile
// @route   GET /api/auth/profile
// @access  Private
const getProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select('-password');
  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }

  res.json({
    success: true,
    user: {
      _id: user._id,
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      avatar: user.avatar,
      createdAt: user.createdAt,
    },
  });
});

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
const updateProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }

  if (req.body.name) user.name = req.body.name.trim();
  if (req.body.phone !== undefined) user.phone = req.body.phone.trim();
  if (req.body.avatar !== undefined) user.avatar = req.body.avatar;

  if (req.body.password) {
    if (req.body.password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
    }
    user.password = req.body.password;
  }

  const updatedUser = await user.save();

  res.json({
    success: true,
    message: 'Profile updated successfully',
    user: {
      _id: updatedUser._id,
      id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.role,
      phone: updatedUser.phone,
      avatar: updatedUser.avatar,
    },
  });
});

// @desc    Forgot password
// @route   POST /api/auth/forgot-password
// @access  Public
const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ success: false, message: 'Email is required' });
  }

  const user = await User.findOne({ email: email.toLowerCase().trim() });
  if (!user) {
    // Return friendly generic response for security
    return res.json({
      success: true,
      message: 'If an account exists with that email, reset instructions have been sent.',
    });
  }

  const resetToken = crypto.randomBytes(20).toString('hex');
  user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
  user.resetPasswordExpire = Date.now() + 60 * 60 * 1000; // 1 hour
  await user.save({ validateBeforeSave: false });

  res.json({
    success: true,
    message: 'Password reset instructions have been generated.',
    resetToken, // Provided for easy development / testing
  });
});

// @desc    Reset password
// @route   POST /api/auth/reset-password
// @access  Public
const resetPassword = asyncHandler(async (req, res) => {
  const { token, password } = req.body;
  if (!token || !password) {
    return res.status(400).json({ success: false, message: 'Token and new password are required' });
  }

  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
  const user = await User.findOne({
    resetPasswordToken: hashedToken,
    resetPasswordExpire: { $gt: Date.now() },
  });

  if (!user) {
    return res.status(400).json({ success: false, message: 'Invalid or expired reset token' });
  }

  user.password = password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;
  await user.save();

  res.json({
    success: true,
    message: 'Password has been reset successfully. Please sign in.',
  });
});

module.exports = {
  register,
  login,
  getProfile,
  updateProfile,
  forgotPassword,
  resetPassword,
};