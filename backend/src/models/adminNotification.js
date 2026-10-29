const mongoose = require('mongoose');

const adminNotificationSchema = new mongoose.Schema(
  {
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
      enum: [
        'VENDOR_APPROVAL',
        'DELIVERY_APPROVAL',
        'PRODUCT_MODERATION',
        'NEW_ORDER',
        'ORDER_READY_FOR_PICKUP',
        'PAYMENT_FAILED',
        'RETURN_REQUEST',
        'LOW_STOCK',
        'SECURITY',
      ],
      default: 'VENDOR_APPROVAL',
    },
    severity: {
      type: String,
      enum: ['info', 'warning', 'critical', 'success'],
      default: 'info',
    },
    link: {
      type: String,
      default: '/admin/dashboard',
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

adminNotificationSchema.index({ isRead: 1, createdAt: -1 });

module.exports = mongoose.model('AdminNotification', adminNotificationSchema);
