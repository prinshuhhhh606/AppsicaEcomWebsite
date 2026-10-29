const mongoose = require('mongoose');

const assignmentAuditSchema = new mongoose.Schema(
  {
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: true,
      index: true,
    },
    orderId: {
      type: String,
      required: true,
      index: true,
    },
    action: {
      type: String,
      enum: [
        'OFFER_SENT',
        'OFFER_ACCEPTED',
        'OFFER_REJECTED',
        'OFFER_EXPIRED',
        'RADIUS_EXPANDED',
        'MANUAL_ASSIGNMENT',
        'AUTO_ASSIGNMENT_FAILED',
        'AUTO_ASSIGNMENT_COMPLETED',
      ],
      required: true,
    },
    driver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    driverName: {
      type: String,
      default: '',
    },
    searchRadiusKm: {
      type: Number,
      default: 0,
    },
    distanceToPickupKm: {
      type: Number,
      default: 0,
    },
    estimatedMinutes: {
      type: Number,
      default: 0,
    },
    reason: {
      type: String,
      default: '',
    },
    performedBy: {
      type: String,
      enum: ['SYSTEM', 'DRIVER', 'SELLER', 'ADMIN'],
      default: 'SYSTEM',
    },
  },
  {
    timestamps: true,
  }
);

assignmentAuditSchema.index({ order: 1, createdAt: -1 });

module.exports = mongoose.model('AssignmentAudit', assignmentAuditSchema);

