const mongoose = require('mongoose');

const systemSettingSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      default: 'global_config',
    },
    platformName: {
      type: String,
      default: 'Appsica Multi-Vendor Marketplace',
    },
    defaultCommissionRate: {
      type: Number,
      default: 10,
    },
    supportEmail: {
      type: String,
      default: 'support@appsica.com',
    },
    supportPhone: {
      type: String,
      default: '+91 98765 43210',
    },
    currency: {
      type: String,
      default: 'INR',
    },
    currencySymbol: {
      type: String,
      default: '₹',
    },
    autoApproveProducts: {
      type: Boolean,
      default: false,
    },
    autoApproveVendors: {
      type: Boolean,
      default: false,
    },
    maintenanceMode: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('SystemSetting', systemSettingSchema);
