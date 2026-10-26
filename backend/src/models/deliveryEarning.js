const mongoose = require('mongoose');

const deliveryEarningSchema = new mongoose.Schema(
  {
    deliveryPartner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: true,
      index: true,
    },
    orderId: {
      type: String,
      required: true,
    },
    baseFee: {
      type: Number,
      required: true,
      default: 50,
    },
    incentive: {
      type: Number,
      default: 0,
    },
    tip: {
      type: Number,
      default: 0,
    },
    totalEarned: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'settled', 'paid'],
      default: 'settled',
    },
    settlementReference: {
      type: String,
      default: () => 'SETTL-' + Math.floor(100000 + Math.random() * 900000),
    },
    settledAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('DeliveryEarning', deliveryEarningSchema);
