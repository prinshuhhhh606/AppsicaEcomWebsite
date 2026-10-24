const mongoose = require('mongoose');

const shippingZoneSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    states: {
      type: [String],
      default: [],
    },
    pincodes: {
      type: [String],
      default: [],
    },
    rate: {
      type: Number,
      required: true,
      default: 79,
    },
    freeShippingThreshold: {
      type: Number,
      default: 999,
    },
    estimatedDays: {
      type: String,
      default: '3-5 business days',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('ShippingZone', shippingZoneSchema);
