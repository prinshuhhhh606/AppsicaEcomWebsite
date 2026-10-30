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
    autoAssignmentEnabled: {
      type: Boolean,
      default: true,
    },
    assignmentMode: {
      type: String,
      enum: ['automatic', 'manual', 'hybrid'],
      default: 'hybrid',
    },
    sellerManagedZonesEnabled: {
      type: Boolean,
      default: true,
    },
    defaultDeliveryRadiusKm: {
      type: Number,
      default: 10,
    },
    maxPermittedRadiusKm: {
      type: Number,
      default: 30,
    },
    initialDriverSearchRadiusKm: {
      type: Number,
      default: 3,
    },
    driverRadiusExpansionSteps: {
      type: [Number],
      default: [3, 5, 8, 15],
    },
    driverOfferTimeoutSeconds: {
      type: Number,
      default: 60,
    },
    maxAssignmentRetries: {
      type: Number,
      default: 3,
    },
    routingApiUrl: {
      type: String,
      default: '',
    },
    panIndiaDeliveryEnabled: {
      type: Boolean,
      default: true,
    },
    defaultCourierProvider: {
      type: String,
      enum: ['shiprocket', 'delhivery', 'bluedart'],
      default: 'shiprocket',
    },
    courierPriority: {
      type: [String],
      default: ['shiprocket', 'delhivery', 'bluedart'],
    },
    courierProviders: {
      shiprocket: {
        enabled: { type: Boolean, default: false },
        email: { type: String, default: '' },
        password: { type: String, default: '' },
        token: { type: String, default: '' },
        tokenExpiresAt: { type: Date, default: null },
        environment: { type: String, enum: ['sandbox', 'production'], default: 'sandbox' },
      },
      delhivery: {
        enabled: { type: Boolean, default: false },
        apiToken: { type: String, default: '' },
        clientName: { type: String, default: '' },
        environment: { type: String, enum: ['sandbox', 'production'], default: 'sandbox' },
      },
      bluedart: {
        enabled: { type: Boolean, default: false },
        loginId: { type: String, default: '' },
        licenseKey: { type: String, default: '' },
        customerCode: { type: String, default: '' },
        environment: { type: String, enum: ['sandbox', 'production'], default: 'sandbox' },
      },
    },
    shippingRules: {
      defaultShippingCharge: { type: Number, default: 79 },
      freeShippingThreshold: { type: Number, default: 999 },
      codEnabled: { type: Boolean, default: true },
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('SystemSetting', systemSettingSchema);
