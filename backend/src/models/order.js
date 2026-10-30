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
    parentOrderId: {
      type: String,
      default: null,
      index: true,
    },
    isSubOrder: {
      type: Boolean,
      default: false,
      index: true,
    },
    hasSubOrders: {
      type: Boolean,
      default: false,
    },
    vendor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
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
        'Assigned',
        'Accepted',
        'Declined',
        'OUTSIDE_LOCAL_RADIUS',
        'LOCATION_VERIFICATION_REQUIRED',
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
        'assigned',
        'accepted',
        'declined',
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
        'Assignment Pending',
        'Pending Assignment',
        'Offer Sent',
        'Driver Offer Sent',
        'DRIVER_ASSIGNED',
        'Assigned',
        'Accepted',
        'Arrived at Pickup',
        'Reached Pickup',
        'Picked Up',
        'In Transit',
        'Out for Delivery',
        'Delivered',
        'Delivery Attempt Failed',
        'Rescheduled',
        'Assignment Retrying',
        'Awaiting Assignment',
        'Returned to Vendor',
        'Cancelled',
        'Reassigned',
        'Declined',
        'OUTSIDE_LOCAL_RADIUS',
        'LOCATION_VERIFICATION_REQUIRED',
        'Location Verification Required',
        'assigned',
        'accepted',
        'declined',
        'unassigned',
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
    pickupOtp: {
      type: String,
      default: '',
    },
    pickupOtpExpiresAt: {
      type: Date,
      default: null,
    },
    pickupOtpVerified: {
      type: Boolean,
      default: false,
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
    pickupLocation: {
      lat: { type: Number, default: null },
      lng: { type: Number, default: null },
      address: { type: String, default: '' },
      storeName: { type: String, default: '' },
    },
    shippingCoordinates: {
      lat: { type: Number, default: null },
      lng: { type: Number, default: null },
    },
    customerDistanceKm: {
      type: Number,
      default: null,
    },
    localDeliveryRadiusKm: {
      type: Number,
      default: 10,
    },
    deliveryMode: {
      type: String,
      enum: ['local', 'standard_courier'],
      default: 'local',
      index: true,
    },
    assignmentMode: {
      type: String,
      enum: ['automatic', 'manual', 'hybrid'],
      default: 'hybrid',
    },
    assignmentAttempts: {
      type: Number,
      default: 0,
    },
    currentAssignmentOffer: {
      driver: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
      offeredAt: { type: Date, default: null },
      expiresAt: { type: Date, default: null },
      distanceKm: { type: Number, default: 0 },
      estimatedMinutes: { type: Number, default: 0 },
    },
    assignmentHistory: [
      {
        driver: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        driverName: { type: String, default: '' },
        offeredAt: { type: Date, default: Date.now },
        respondedAt: { type: Date, default: null },
        status: { type: String, enum: ['offered', 'accepted', 'rejected', 'expired'], default: 'offered' },
        reason: { type: String, default: '' },
        searchRadiusKm: { type: Number, default: 3 },
      },
    ],
    // Pan-India Courier Shipment Fields
    courierProvider: {
      type: String,
      enum: ['shiprocket', 'delhivery', 'bluedart'],
      default: 'shiprocket',
    },
    courierShipmentId: {
      type: String,
      default: '',
      index: true,
    },
    courierOrderId: {
      type: String,
      default: '',
    },
    awbCode: {
      type: String,
      default: '',
      index: true,
    },
    shippingLabelUrl: {
      type: String,
      default: '',
    },
    courierBookingStatus: {
      type: String,
      enum: ['UNBOOKED', 'BOOKING_INITIATED', 'BOOKED', 'FAILED', 'RETRY_PENDING', 'CANCELLED'],
      default: 'UNBOOKED',
      index: true,
    },
    courierBookingError: {
      type: String,
      default: '',
    },
    courierPickupStatus: {
      type: String,
      enum: ['PENDING', 'SCHEDULED', 'PICKED_UP', 'FAILED'],
      default: 'PENDING',
    },
    courierPickupToken: {
      type: String,
      default: '',
    },
    courierPickupScheduledDate: {
      type: Date,
      default: null,
    },
    packageWeightKg: {
      type: Number,
      default: 0.5,
    },
    packageDimensions: {
      length: { type: Number, default: 10 },
      width: { type: Number, default: 10 },
      height: { type: Number, default: 10 },
    },
    courierTrackingEvents: [
      {
        status: { type: String, default: '' },
        activity: { type: String, default: '' },
        location: { type: String, default: '' },
        timestamp: { type: Date, default: Date.now },
      },
    ],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Order', orderSchema);
