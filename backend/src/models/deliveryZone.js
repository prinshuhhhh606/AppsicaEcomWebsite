const mongoose = require('mongoose');

const deliveryZoneSchema = new mongoose.Schema(
  {
    vendor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Zone name is required'],
      trim: true,
    },
    zoneType: {
      type: String,
      enum: ['radius', 'polygon', 'pincode'],
      default: 'radius',
    },
    // Center point (usually seller store or custom zone center)
    center: {
      lat: { type: Number, required: true },
      lng: { type: Number, required: true },
      address: { type: String, default: '' },
    },
    // For radius-based zones (in kilometers)
    radiusKm: {
      type: Number,
      min: 0.5,
      max: 100,
      default: 5,
    },
    // For polygon-based zones: array of { lat, lng } points forming a closed boundary
    polygon: [
      {
        lat: { type: Number, required: true },
        lng: { type: Number, required: true },
      },
    ],
    // For pincode-based zones
    pincodes: {
      type: [String],
      default: [],
    },
    minOrderAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    deliveryFee: {
      type: Number,
      default: 50,
      min: 0,
    },
    estimatedDeliveryMinutes: {
      type: Number,
      default: 45,
      min: 5,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    color: {
      type: String,
      default: '#6366f1', // Primary indigo hex for visual map display
    },
  },
  {
    timestamps: true,
  }
);

deliveryZoneSchema.index({ vendor: 1, isActive: 1 });

module.exports = mongoose.model('DeliveryZone', deliveryZoneSchema);

