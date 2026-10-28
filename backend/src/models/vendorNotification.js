const mongoose = require('mongoose');

const vendorNotificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ['NEW_ORDER', 'ORDER_UPDATE', 'PAYOUT', 'SYSTEM', 'REVIEW', 'INVENTORY'],
      default: 'NEW_ORDER',
    },
    orderId: {
      type: String,
      default: '',
    },
    link: {
      type: String,
      default: '/vendor/orders',
    },
    amount: {
      type: Number,
      default: 0,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

vendorNotificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });

module.exports = mongoose.model('VendorNotification', vendorNotificationSchema);
