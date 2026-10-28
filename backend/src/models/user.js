const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide your name'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Please provide your email'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, 'Please provide a password'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false,
    },
    role: {
      type: String,
      enum: ['user', 'admin', 'vendor', 'delivery'],
      default: 'user',
    },
    vendorStatus: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'suspended'],
      default: 'pending',
    },
    // Delivery Partner Fields
    deliveryStatus: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'suspended'],
      default: 'pending',
    },
    vehicleType: {
      type: String,
      enum: ['bike', 'scooter', 'electric', 'van', 'car', 'bicycle', 'other'],
      default: 'bike',
    },
    vehicleNumber: {
      type: String,
      trim: true,
      default: '',
    },
    drivingLicenseNumber: {
      type: String,
      trim: true,
      default: '',
    },
    isOnline: {
      type: Boolean,
      default: true,
    },
    emergencyContact: {
      type: String,
      trim: true,
      default: '',
    },
    deliveryCity: {
      type: String,
      trim: true,
      default: 'Mumbai',
    },
    currentLocation: {
      lat: { type: Number, default: 19.0760 },
      lng: { type: Number, default: 72.8777 },
      address: { type: String, default: 'Santacruz Logistics Hub, Mumbai' },
      updatedAt: { type: Date, default: Date.now },
    },
    deliveryRating: {
      type: Number,
      default: 5.0,
    },
    totalDeliveriesCount: {
      type: Number,
      default: 0,
    },
    storeName: {
      type: String,
      trim: true,
      default: '',
    },
    storeDescription: {
      type: String,
      trim: true,
      default: '',
    },
    storeLogo: {
      type: String,
      default: '',
    },
    storeBanner: {
      type: String,
      default: '',
    },
    businessAddress: {
      type: String,
      trim: true,
      default: '',
    },
    taxId: {
      type: String,
      trim: true,
      default: '',
    },
    payoutDetails: {
      accountHolder: { type: String, default: '' },
      accountNumber: { type: String, default: '' },
      bankName: { type: String, default: '' },
      ifsc: { type: String, default: '' },
      upiId: { type: String, default: '' },
    },
    commissionRate: {
      type: Number,
      default: 10,
    },
    vendorApprovedAt: {
      type: Date,
      default: null,
    },
    vendorRejectionReason: {
      type: String,
      default: '',
    },
    deliveryApprovedAt: {
      type: Date,
      default: null,
    },
    deliveryRejectionReason: {
      type: String,
      default: '',
    },
    phone: {
      type: String,
      trim: true,
      default: '',
    },
    avatar: {
      type: String,
      default: '',
    },
    isBlocked: {
      type: Boolean,
      default: false,
    },
    resetPasswordToken: String,
    resetPasswordExpire: Date,
  },
  {
    timestamps: true,
  }
);

userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 10);
});

userSchema.methods.comparePassword = async function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
