const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema(
  {
    admin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false,
    },
    adminEmail: {
      type: String,
      default: 'admin@appsica.com',
    },
    adminName: {
      type: String,
      default: 'Appsica Admin',
    },
    category: {
      type: String,
      enum: ['AUTH', 'ORDERS', 'VENDORS', 'PRODUCTS', 'PAYMENTS', 'PAYOUTS', 'RETURNS', 'SETTINGS', 'SYSTEM', 'DELIVERY'],
      default: 'SYSTEM',
    },
    action: {
      type: String,
      required: true,
    },
    target: {
      type: String,
      default: '',
    },
    details: {
      type: String,
      default: '',
    },
    ipAddress: {
      type: String,
      default: '127.0.0.1',
    },
    status: {
      type: String,
      enum: ['SUCCESS', 'WARNING', 'FAILED'],
      default: 'SUCCESS',
    },
  },
  {
    timestamps: true,
  }
);

auditLogSchema.index({ category: 1, createdAt: -1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);
