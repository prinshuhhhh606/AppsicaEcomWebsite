const mongoose = require('mongoose');

const payoutSchema = new mongoose.Schema(
  {
    payoutId: {
      type: String,
      required: true,
      unique: true,
      default: () => `PAY-${Date.now().toString().slice(-8)}`,
    },
    vendor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    storeName: {
      type: String,
      default: '',
    },
    amount: {
      type: Number,
      required: true,
      min: 1,
    },
    commissionDeducted: {
      type: Number,
      default: 0,
    },
    grossSales: {
      type: Number,
      default: 0,
    },
    bankDetails: {
      accountHolder: { type: String, default: '' },
      accountNumber: { type: String, default: '' },
      bankName: { type: String, default: '' },
      ifsc: { type: String, default: '' },
      upiId: { type: String, default: '' },
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'paid', 'rejected'],
      default: 'pending',
    },
    processedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    transactionReference: {
      type: String,
      default: '',
    },
    notes: {
      type: String,
      default: '',
    },
    paidAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

payoutSchema.index({ vendor: 1, status: 1, createdAt: -1 });

module.exports = mongoose.model('Payout', payoutSchema);
