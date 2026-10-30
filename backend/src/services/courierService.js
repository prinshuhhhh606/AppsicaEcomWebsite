const SystemSetting = require('../models/systemSetting');
const Order = require('../models/order');
const User = require('../models/user');
const AdminNotification = require('../models/adminNotification');
const VendorNotification = require('../models/vendorNotification');
const CourierFactory = require('./courier/CourierFactory');
const { getIO } = require('../socket');

class CourierService {
  /**
   * Retrieves active courier configuration from SystemSetting
   */
  static async getConfig() {
    let settings = await SystemSetting.findOne({ key: 'global_config' });
    if (!settings) {
      settings = await SystemSetting.create({ key: 'global_config' });
    }
    return {
      panIndiaDeliveryEnabled: settings.panIndiaDeliveryEnabled ?? true,
      defaultCourierProvider: settings.defaultCourierProvider || 'shiprocket',
      courierPriority: settings.courierPriority?.length
        ? settings.courierPriority
        : ['shiprocket', 'delhivery', 'bluedart'],
      courierProviders: settings.courierProviders || {},
      shippingRules: settings.shippingRules || {
        defaultShippingCharge: 79,
        freeShippingThreshold: 999,
        codEnabled: true,
      },
    };
  }

  static providerInstances = new Map();

  static setProvider(name, instance) {
    this.providerInstances.set(String(name).toLowerCase(), instance);
  }

  static clearProviders() {
    this.providerInstances.clear();
  }

  /**
   * Instantiates the preferred or fallback courier provider (singleton / cache supported)
   */
  static async getProvider(preferredName = null) {
    const config = await this.getConfig();
    const providerName = String(preferredName || config.defaultCourierProvider || 'shiprocket').toLowerCase();
    if (this.providerInstances.has(providerName)) {
      return this.providerInstances.get(providerName);
    }
    const providerConfig = config.courierProviders[providerName] || {};
    const instance = CourierFactory.getProvider(providerName, providerConfig);
    this.providerInstances.set(providerName, instance);
    return instance;
  }

  /**
   * Validate Indian 6-digit PIN code format
   */
  static isValidPincode(pin) {
    return /^[1-9][0-9]{5}$/.test(String(pin || '').trim());
  }

  /**
   * Check PIN code serviceability across pickup and delivery destinations
   */
  static async checkServiceability({ pickupPincode, deliveryPincode, weightKg = 0.5, cod = false, orderValue = 500 }) {
    if (!this.isValidPincode(pickupPincode)) {
      return {
        serviceable: false,
        availableCouriers: [],
        reason: `Invalid Seller Pickup PIN code: "${pickupPincode}". Must be a valid 6-digit Indian PIN code.`,
      };
    }

    if (!this.isValidPincode(deliveryPincode)) {
      return {
        serviceable: false,
        availableCouriers: [],
        reason: `Invalid Customer Destination PIN code: "${deliveryPincode}". Must be a valid 6-digit Indian PIN code.`,
      };
    }

    const config = await this.getConfig();
    if (!config.panIndiaDeliveryEnabled) {
      return {
        serviceable: false,
        availableCouriers: [],
        reason: 'Pan-India Courier Delivery is currently disabled by Platform Administration.',
      };
    }

    // Attempt serviceability check with configured providers by priority
    const priorityList = config.courierPriority || ['shiprocket', 'delhivery', 'bluedart'];
    let lastReason = 'Route could not be verified by configured courier providers';

    for (const providerName of priorityList) {
      const provider = await this.getProvider(providerName);
      if (!provider.hasCredentials()) {
        continue;
      }

      const res = await provider.checkServiceability({
        pickupPincode,
        deliveryPincode,
        weightKg,
        cod,
        orderValue,
      });

      if (res.serviceable && res.availableCouriers.length > 0) {
        return {
          serviceable: true,
          provider: providerName,
          availableCouriers: res.availableCouriers,
          recommendedCourier: res.recommendedCourier,
        };
      }
      if (res.reason) {
        lastReason = res.reason;
      }
    }

    // If none of the providers have active credentials configured
    const primaryProvider = await this.getProvider(config.defaultCourierProvider);
    if (!primaryProvider.hasCredentials()) {
      return {
        serviceable: false,
        requiresConfiguration: true,
        reason: `Courier credentials not configured for ${config.defaultCourierProvider.toUpperCase()}. Please configure API credentials in Admin Shipping Management.`,
      };
    }

    return {
      serviceable: false,
      availableCouriers: [],
      reason: lastReason,
    };
  }

  /**
   * Calculate shipping rate and estimated delivery date for an order
   */
  static async calculateShippingRate({
    pickupPincode,
    deliveryPincode,
    weightKg = 0.5,
    cod = false,
    orderSubtotal = 0,
    length = 10,
    breadth = 10,
    height = 10,
  }) {
    const config = await this.getConfig();
    const rules = config.shippingRules || {};

    // Check free shipping threshold
    if (rules.freeShippingThreshold && orderSubtotal >= rules.freeShippingThreshold) {
      return {
        success: true,
        isFreeShipping: true,
        rate: 0,
        estimatedDays: '3-5 business days',
        courierName: 'Standard Express Courier',
      };
    }

    const serv = await this.checkServiceability({
      pickupPincode,
      deliveryPincode,
      weightKg,
      cod,
      orderValue: orderSubtotal,
    });

    if (serv.serviceable && serv.recommendedCourier) {
      return {
        success: true,
        isFreeShipping: false,
        rate: Math.round(serv.recommendedCourier.rate || rules.defaultShippingCharge || 79),
        estimatedDays: `${serv.recommendedCourier.estimatedDays || 3} business days`,
        courierName: serv.recommendedCourier.name,
        availableCouriers: serv.availableCouriers,
      };
    }

    // Default standard rate fallback if route is serviceable by policy
    return {
      success: serv.serviceable,
      isFreeShipping: false,
      rate: rules.defaultShippingCharge || 79,
      estimatedDays: '3-5 business days',
      courierName: 'Standard Courier',
      reason: serv.reason,
    };
  }

  /**
   * Books a real Pan-India Courier Shipment with the configured provider
   * Idempotent & Concurrency-safe: prevents duplicate booking on repeated clicks
   */
  static async bookCourierShipment(orderId, sellerVendorId = null) {
    const order = await Order.findById(orderId).populate('user', 'name email phone');
    if (!order) {
      throw new Error(`Order #${orderId} not found`);
    }

    // 1. Prevent duplicate bookings: If already booked or in transit, abort cleanly
    if (
      order.courierBookingStatus === 'BOOKED' &&
      order.awbCode &&
      ['Shipped', 'In Transit', 'Out for Delivery', 'Delivered'].includes(order.orderStatus)
    ) {
      return {
        success: true,
        status: 'ALREADY_BOOKED',
        message: `Order #${order.orderId} is already booked with AWB ${order.awbCode}`,
        awbCode: order.awbCode,
        courierName: order.courierName,
        trackingNumber: order.trackingNumber,
        labelUrl: order.shippingLabelUrl,
        order,
      };
    }

    // 2. Validate Payment / COD authorization
    const isCOD = String(order.paymentMethod).toLowerCase() === 'cod';
    const isPaid = String(order.paymentStatus).toLowerCase() === 'paid';
    if (!isCOD && !isPaid) {
      const err = new Error(`Cannot book courier shipment: Order payment is ${order.paymentStatus}. Payment must be completed or marked Cash on Delivery.`);
      err.statusCode = 400;
      throw err;
    }

    // 3. Resolve and validate PIN codes
    const pickupPin = String(order.pickupLocation?.pincode || '').trim();
    let effectivePickupPin = pickupPin;

    if (!this.isValidPincode(effectivePickupPin)) {
      // Lookup from vendor profile
      const vendorId = order.vendor || (order.items?.[0]?.vendor);
      if (vendorId) {
        const vendor = await User.findById(vendorId);
        if (vendor?.storeLocation?.pincode && this.isValidPincode(vendor.storeLocation.pincode)) {
          effectivePickupPin = String(vendor.storeLocation.pincode).trim();
          order.pickupLocation.pincode = effectivePickupPin;
        }
      }
    }

    const deliveryPin = String(order.shippingAddress?.pincode || '').trim();

    if (!this.isValidPincode(effectivePickupPin)) {
      order.courierBookingStatus = 'FAILED';
      order.courierBookingError = `Seller pickup PIN code is missing or invalid: "${effectivePickupPin}". Please update store address.`;
      await order.save();
      return {
        success: false,
        status: 'FAILED',
        error: order.courierBookingError,
      };
    }

    if (!this.isValidPincode(deliveryPin)) {
      order.courierBookingStatus = 'FAILED';
      order.courierBookingError = `Customer delivery PIN code is missing or invalid: "${deliveryPin}". Address verification required.`;
      await order.save();
      return {
        success: false,
        status: 'FAILED',
        error: order.courierBookingError,
      };
    }

    // 4. ATOMIC LOCK: Lock order for booking to prevent race conditions
    const lockedOrder = await Order.findOneAndUpdate(
      {
        _id: order._id,
        courierBookingStatus: { $in: ['UNBOOKED', 'FAILED', 'RETRY_PENDING'] },
      },
      {
        $set: {
          courierBookingStatus: 'BOOKING_INITIATED',
          deliveryMode: 'standard_courier',
        },
      },
      { returnDocument: 'after' }
    );

    if (!lockedOrder) {
      console.log(`[Courier Lock] Order #${order.orderId} booking was already initiated concurrently.`);
      const curOrder = await Order.findById(order._id);
      return {
        success: curOrder.courierBookingStatus === 'BOOKED',
        status: curOrder.courierBookingStatus,
        message: 'Order was already processed by another booking request',
        awbCode: curOrder.awbCode,
        order: curOrder,
      };
    }

    // 5. Select Courier Provider
    const config = await this.getConfig();
    const providerName = order.courierProvider || config.defaultCourierProvider || 'shiprocket';
    const provider = await this.getProvider(providerName);

    if (!provider.hasCredentials()) {
      lockedOrder.courierBookingStatus = 'FAILED';
      lockedOrder.courierBookingError = `Courier partner (${providerName.toUpperCase()}) credentials are not configured in Admin Settings. Integration configuration required.`;
      lockedOrder.statusHistory.push({
        status: 'Courier Booking Failed',
        timestamp: new Date(),
        note: lockedOrder.courierBookingError,
      });
      await lockedOrder.save();

      return {
        success: false,
        status: 'CONFIGURATION_REQUIRED',
        error: lockedOrder.courierBookingError,
        requiresConfiguration: true,
      };
    }

    // 6. Check Serviceability with Provider
    const serviceCheck = await provider.checkServiceability({
      pickupPincode: effectivePickupPin,
      deliveryPincode: deliveryPin,
      weightKg: lockedOrder.packageWeightKg || 0.5,
      cod: isCOD,
      orderValue: lockedOrder.total,
    });

    if (!serviceCheck.serviceable) {
      lockedOrder.courierBookingStatus = 'FAILED';
      lockedOrder.courierBookingError = serviceCheck.reason || 'Destination PIN code is not serviceable by courier partner';
      lockedOrder.statusHistory.push({
        status: 'Courier Booking Failed',
        timestamp: new Date(),
        note: `Serviceability check failed: ${lockedOrder.courierBookingError}`,
      });
      await lockedOrder.save();

      return {
        success: false,
        status: 'NOT_SERVICEABLE',
        error: lockedOrder.courierBookingError,
      };
    }

    // 7. Create Shipment with Provider API
    const shipmentRes = await provider.createShipment(lockedOrder);
    if (!shipmentRes.success || !shipmentRes.shipmentId) {
      lockedOrder.courierBookingStatus = 'FAILED';
      lockedOrder.courierBookingError = shipmentRes.error || 'Failed to create shipment on courier portal';
      lockedOrder.statusHistory.push({
        status: 'Courier Booking Failed',
        timestamp: new Date(),
        note: `Provider shipment creation failed: ${lockedOrder.courierBookingError}`,
      });
      await lockedOrder.save();

      return {
        success: false,
        status: 'FAILED',
        error: lockedOrder.courierBookingError,
      };
    }

    // 8. Generate AWB
    const awbRes = await provider.generateAWB({
      shipmentId: shipmentRes.shipmentId,
      courierId: serviceCheck.recommendedCourier?.id,
    });

    if (!awbRes.success || !awbRes.awbCode) {
      lockedOrder.courierBookingStatus = 'RETRY_PENDING';
      lockedOrder.courierShipmentId = shipmentRes.shipmentId;
      lockedOrder.courierOrderId = shipmentRes.orderId;
      lockedOrder.courierBookingError = awbRes.error || 'Shipment created but AWB assignment failed. Retry AWB generation.';
      lockedOrder.statusHistory.push({
        status: 'AWB Generation Failed',
        timestamp: new Date(),
        note: lockedOrder.courierBookingError,
      });
      await lockedOrder.save();

      return {
        success: false,
        status: 'RETRY_PENDING',
        error: lockedOrder.courierBookingError,
        shipmentId: shipmentRes.shipmentId,
      };
    }

    // 9. Request Pickup & Generate Label (Non-blocking if provider queue is busy)
    let pickupToken = '';
    let scheduledDate = new Date();
    try {
      const pickupRes = await provider.requestPickup({ shipmentIds: [shipmentRes.shipmentId] });
      if (pickupRes.success) {
        pickupToken = pickupRes.pickupToken;
        scheduledDate = pickupRes.scheduledDate;
      }
    } catch (e) {
      console.warn('Courier pickup scheduling notice:', e.message);
    }

    let labelUrl = '';
    try {
      const labelRes = await provider.generateShippingLabel({ shipmentIds: [shipmentRes.shipmentId] });
      if (labelRes.success) {
        labelUrl = labelRes.labelUrl;
      }
    } catch (e) {
      console.warn('Courier label generation notice:', e.message);
    }

    // 10. Persist Confirmed Booking State to MongoDB
    lockedOrder.courierProvider = providerName;
    lockedOrder.courierShipmentId = shipmentRes.shipmentId;
    lockedOrder.courierOrderId = shipmentRes.orderId;
    lockedOrder.awbCode = awbRes.awbCode;
    lockedOrder.trackingNumber = awbRes.awbCode;
    lockedOrder.courierName = awbRes.courierName || 'Shiprocket Express';
    lockedOrder.shippingLabelUrl = labelUrl;
    lockedOrder.courierBookingStatus = 'BOOKED';
    lockedOrder.courierBookingError = '';
    lockedOrder.courierPickupStatus = 'SCHEDULED';
    lockedOrder.courierPickupToken = pickupToken;
    lockedOrder.courierPickupScheduledDate = scheduledDate;
    lockedOrder.orderStatus = 'Shipped';
    lockedOrder.deliveryStatus = 'In Transit';

    const bookingNote = `Shipment booked with ${lockedOrder.courierName}. AWB: ${awbRes.awbCode}. Pickup scheduled.`;
    lockedOrder.statusHistory.push({
      status: 'Shipped',
      timestamp: new Date(),
      note: bookingNote,
    });

    lockedOrder.courierTrackingEvents.push({
      status: 'BOOKED',
      activity: bookingNote,
      location: order.pickupLocation?.address || 'Seller Store',
      timestamp: new Date(),
    });

    await lockedOrder.save();

    // 11. Send Notifications to Seller & Admin
    try {
      const vendorId = order.vendor || (order.items?.[0]?.vendor);
      if (vendorId) {
        await VendorNotification.create({
          recipient: vendorId,
          title: 'Courier Shipment Booked 📦',
          message: `Order #${order.orderId} booked via ${lockedOrder.courierName}. AWB: ${awbRes.awbCode}. Ready for courier pickup.`,
          type: 'ORDER_UPDATE',
          orderId: order.orderId,
        });
      }
    } catch (notifErr) {}

    try {
      await AdminNotification.create({
        title: 'Pan-India Courier Booked 🚚',
        message: `Order #${order.orderId} booked with ${lockedOrder.courierName} (AWB: ${awbRes.awbCode}).`,
        type: 'ORDER_READY_FOR_PICKUP',
        severity: 'info',
        link: `/admin/shipping?search=${order.orderId}`,
      });
    } catch (adminErr) {}

    // 12. Real-time Socket.IO Broadcast
    try {
      const io = getIO();
      if (io) {
        io.emit('order:courier_booked', {
          orderId: lockedOrder.orderId,
          orderIdDb: lockedOrder._id,
          awbCode: awbRes.awbCode,
          courierName: lockedOrder.courierName,
          shippingLabelUrl: labelUrl,
          orderStatus: lockedOrder.orderStatus,
          deliveryStatus: lockedOrder.deliveryStatus,
        });
      }
    } catch (socketErr) {}

    return {
      success: true,
      status: 'BOOKED',
      awbCode: awbRes.awbCode,
      courierName: lockedOrder.courierName,
      shipmentId: shipmentRes.shipmentId,
      shippingLabelUrl: labelUrl,
      order: lockedOrder,
    };
  }

  /**
   * Track shipment and synchronize milestones with courier API
   */
  static async trackShipment(awbCode, orderId = null) {
    if (!awbCode) {
      throw new Error('AWB code is required for tracking');
    }

    const order = orderId
      ? await Order.findById(orderId)
      : await Order.findOne({ $or: [{ awbCode }, { trackingNumber: awbCode }] });

    const providerName = order?.courierProvider || 'shiprocket';
    const provider = await this.getProvider(providerName);

    const trackingRes = await provider.trackShipment({
      awbCode,
      shipmentId: order?.courierShipmentId,
    });

    if (order && trackingRes.success) {
      // Append new unique tracking events
      const existingTimestamps = new Set(
        (order.courierTrackingEvents || []).map((e) => new Date(e.timestamp).getTime())
      );

      for (const ev of trackingRes.trackingEvents || []) {
        const evTime = new Date(ev.timestamp).getTime();
        if (!existingTimestamps.has(evTime)) {
          order.courierTrackingEvents.push({
            status: ev.status,
            activity: ev.activity,
            location: ev.location,
            timestamp: ev.timestamp,
          });
          existingTimestamps.add(evTime);
        }
      }

      // Sync status milestones
      const curStatus = String(trackingRes.currentStatus).toUpperCase();
      if (curStatus.includes('DELIVERED') && order.orderStatus !== 'Delivered') {
        order.orderStatus = 'Delivered';
        order.deliveryStatus = 'Delivered';
        order.paymentStatus = 'Paid';
        order.deliveryDeliveredAt = trackingRes.deliveredDate || new Date();
        order.statusHistory.push({
          status: 'Delivered',
          timestamp: new Date(),
          note: `Delivered via ${order.courierName || 'Courier Partner'}. AWB: ${awbCode}`,
        });
      } else if (curStatus.includes('OUT FOR DELIVERY') && order.deliveryStatus !== 'Out for Delivery') {
        order.deliveryStatus = 'Out for Delivery';
        order.orderStatus = 'Out for Delivery';
        order.deliveryOutForDeliveryAt = new Date();
      }

      await order.save();
    }

    return {
      success: trackingRes.success,
      awbCode,
      currentStatus: trackingRes.currentStatus || (order?.deliveryStatus) || 'In Transit',
      courierName: trackingRes.courierName || order?.courierName || 'Courier Partner',
      trackingEvents: order?.courierTrackingEvents?.length
        ? order.courierTrackingEvents
        : trackingRes.trackingEvents || [],
      deliveredDate: trackingRes.deliveredDate || order?.deliveryDeliveredAt || null,
      order,
    };
  }

  /**
   * Process authenticated courier provider webhook
   * Deduplicates events & updates shipment status safely
   */
  static async handleWebhook(providerName, payload, headers) {
    const provider = await this.getProvider(providerName);
    const parsed = provider.handleWebhook(payload, headers);

    if (!parsed.isValid || (!parsed.awbCode && !parsed.shipmentId)) {
      return { success: false, reason: 'Invalid webhook payload structure' };
    }

    const order = await Order.findOne({
      $or: [
        { awbCode: parsed.awbCode },
        { trackingNumber: parsed.awbCode },
        ...(parsed.shipmentId ? [{ courierShipmentId: parsed.shipmentId }] : []),
      ],
    });

    if (!order) {
      return { success: false, reason: `No order record matches AWB: ${parsed.awbCode}` };
    }

    // Deduplicate event by activity + timestamp window (within 60 seconds)
    const eventTime = new Date(parsed.timestamp).getTime();
    const isDuplicate = (order.courierTrackingEvents || []).some(
      (ev) =>
        ev.activity === parsed.activity &&
        Math.abs(new Date(ev.timestamp).getTime() - eventTime) < 60000
    );

    if (isDuplicate) {
      return { success: true, duplicate: true, message: 'Event already recorded' };
    }

    // Push new event
    order.courierTrackingEvents.push({
      status: parsed.currentStatus,
      activity: parsed.activity || parsed.currentStatus,
      location: parsed.location || '',
      timestamp: parsed.timestamp || new Date(),
    });

    const statusNorm = String(parsed.currentStatus).toUpperCase();
    if (statusNorm.includes('DELIVERED')) {
      order.orderStatus = 'Delivered';
      order.deliveryStatus = 'Delivered';
      order.paymentStatus = 'Paid';
      order.deliveryDeliveredAt = new Date();
      order.statusHistory.push({
        status: 'Delivered',
        timestamp: new Date(),
        note: `Verified delivered via ${providerName.toUpperCase()} webhook. AWB: ${parsed.awbCode}`,
      });
    } else if (statusNorm.includes('OUT FOR DELIVERY')) {
      order.orderStatus = 'Out for Delivery';
      order.deliveryStatus = 'Out for Delivery';
      order.deliveryOutForDeliveryAt = new Date();
    } else if (statusNorm.includes('PICKED UP')) {
      order.deliveryStatus = 'In Transit';
      order.courierPickupStatus = 'PICKED_UP';
      order.deliveryPickedUpAt = new Date();
    } else if (statusNorm.includes('CANCEL')) {
      order.courierBookingStatus = 'CANCELLED';
    }

    await order.save();

    // Broadcast update to real-time clients
    try {
      const io = getIO();
      if (io) {
        io.emit('order:tracking_updated', {
          orderId: order.orderId,
          orderIdDb: order._id,
          awbCode: parsed.awbCode,
          status: parsed.currentStatus,
          activity: parsed.activity,
          location: parsed.location,
        });
      }
    } catch (e) {}

    return {
      success: true,
      orderId: order.orderId,
      awbCode: parsed.awbCode,
      status: parsed.currentStatus,
    };
  }
}

module.exports = CourierService;
