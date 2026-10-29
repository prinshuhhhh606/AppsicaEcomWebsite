const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
  },
  name: { type: String, required: true },
  price: { type: Number, required: true },
  quantity: { type: Number, required: true, min: 1 },
  image: { type: String, default: '' },
  vendor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
    index: true,
  },
  itemStatus: {
    type: String,
    enum: ['Pending', 'Confirmed', 'Processing', 'Packed', 'Ready for Pickup', 'Ready to Ship', 'Shipped', 'Delivered', 'Cancelled'],
    default: 'Pending',
  },
  courierName: { type: String, default: '' },
  trackingNumber: { type: String, default: '' },
  deliveryPartner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  deliveryStatus: {
    type: String,
    default: 'Unassigned',
  },
});

const statusHistorySchema = new mongoose.Schema({
  status: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  note: { type: String, default: '' },
});

const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false,
    },
    orderId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    invoiceNumber: {
      type: String,
      unique: true,
      sparse: true,
    },
    items: [orderItemSchema],
    shippingAddress: {
      fullName: { type: String, required: true },
      phone: { type: String, required: true },
      addressLine: { type: String, required: true },
      city: { type: String, required: true },
      state: { type: String, required: true },
      pincode: { type: String, required: true },
    },
    paymentMethod: {
      type: String,
      enum: ['card', 'upi', 'cod', 'razorpay'],
      default: 'card',
    },
    paymentStatus: {
      type: String,
      enum: ['Paid', 'Pending', 'Failed', 'Refunded', 'paid', 'pending', 'completed', 'failed', 'refunded'],
      default: 'Pending',
    },
    orderStatus: {
      type: String,
      enum: [
        'Order Placed',
        'Confirmed',
        'Processing',
        'Packed',
        'Ready to Ship',
        'Ready for Pickup',
        'Shipped',
        'Out for Delivery',
        'Delivered',
        'Cancelled',
        'Returned',
        'placed',
        'confirmed',
        'processing',
        'packed',
        'ready_to_ship',
        'ready_for_pickup',
        'shipped',
        'delivered',
        'cancelled',
        'returned',
      ],
      default: 'Order Placed',
    },
    subtotal: {
      type: Number,
      required: true,
    },
    delivery: {
      type: Number,
      default: 0,
    },
    discount: {
      type: Number,
      default: 0,
    },
    total: {
      type: Number,
      required: true,
    },
    transactionId: {
      type: String,
      default: '',
      index: true,
    },
    paymentGateway: {
      type: String,
      default: 'AppsicaPay',
    },
    paymentVerifiedAt: {
      type: Date,
      default: null,
    },
    courierName: {
      type: String,
      default: 'BlueDart Express',
    },
    trackingNumber: {
      type: String,
      default: '',
    },
    estimatedDeliveryDate: {
      type: Date,
      default: null,
    },
    statusHistory: [statusHistorySchema],
    cancelReason: {
      type: String,
      default: '',
    },
    returnReason: {
      type: String,
      default: '',
    },
    // Delivery Partner Assignment & Lifecycle
    deliveryPartner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    deliveryStatus: {
      type: String,
      enum: [
        'Unassigned',
        'Assigned',
        'Accepted',
        'Arrived at Pickup',
        'Picked Up',
        'In Transit',
        'Out for Delivery',
        'Delivered',
        'Delivery Attempt Failed',
        'Rescheduled',
        'Returned to Vendor',
        'Cancelled',
        'Reassigned',
      ],
      default: 'Unassigned',
      index: true,
    },
    deliveryFee: {
      type: Number,
      default: 50,
    },
    deliveryAssignedAt: {
      type: Date,
      default: null,
    },
    deliveryAcceptedAt: {
      type: Date,
      default: null,
    },
    deliveryArrivedPickupAt: {
      type: Date,
      default: null,
    },
    deliveryPickedUpAt: {
      type: Date,
      default: null,
    },
    deliveryOutForDeliveryAt: {
      type: Date,
      default: null,
    },
    deliveryDeliveredAt: {
      type: Date,
      default: null,
    },
    deliveryFailedAt: {
      type: Date,
      default: null,
    },
    deliveryFailureReason: {
      type: String,
      default: '',
    },
    deliveryNotes: {
      type: String,
      default: '',
    },
    pickupNotes: {
      type: String,
      default: '',
    },
    pickupExceptionReported: {
      type: Boolean,
      default: false,
    },
    pickupExceptionReason: {
      type: String,
      default: '',
    },
    pickupProofImage: {
      type: String,
      default: '',
    },
    deliveryProofImage: {
      type: String,
      default: '',
    },
    deliveryOtp: {
      type: String,
      default: '',
    },
    deliveryOtpExpiresAt: {
      type: Date,
      default: null,
    },
    deliveryOtpAttempts: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Order', orderSchema);
