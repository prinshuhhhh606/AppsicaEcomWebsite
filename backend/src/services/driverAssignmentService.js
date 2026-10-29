/**
 * Smart Driver Assignment Engine
 * Automated multi-tiered dispatch with radius expansion & concurrency safety
 */

const Order = require('../models/order');
const User = require('../models/user');
const SystemSetting = require('../models/systemSetting');
const AssignmentAudit = require('../models/assignmentAudit');
const DeliveryNotification = require('../models/deliveryNotification');
const VendorNotification = require('../models/vendorNotification');
const AdminNotification = require('../models/adminNotification');
const GeoService = require('./geoService');
const { getIO } = require('../socket');

// Map of active timer timeouts per order to handle offer expirations cleanly
const activeOfferTimers = new Map();

class DriverAssignmentService {
  /**
   * Retrieves platform global assignment configuration
   */
  static async getConfig() {
    let settings = await SystemSetting.findOne({ key: 'global_config' });
    if (!settings) {
      settings = await SystemSetting.create({ key: 'global_config' });
    }
    return {
      autoAssignmentEnabled: settings.autoAssignmentEnabled ?? true,
      assignmentMode: settings.assignmentMode || 'hybrid',
      initialDriverSearchRadiusKm: settings.initialDriverSearchRadiusKm || 3,
      driverRadiusExpansionSteps: settings.driverRadiusExpansionSteps?.length
        ? settings.driverRadiusExpansionSteps
        : [3, 5, 8, 15],
      driverOfferTimeoutSeconds: settings.driverOfferTimeoutSeconds || 60,
      maxAssignmentRetries: settings.maxAssignmentRetries || 3,
    };
  }

  /**
   * Finds candidate active drivers within a specified radius from the pickup location
   */
  static async findEligibleDrivers({ pickupLat, pickupLng, radiusKm, excludedDriverIds = [] }) {
    // 1. Fetch all approved & online delivery partners
    const drivers = await User.find({
      role: 'delivery',
      deliveryStatus: 'approved',
      isOnline: true,
      isBlocked: { $ne: true },
      _id: { $nin: excludedDriverIds },
    }).select(
      'name phone email vehicleType vehicleNumber currentLocation deliveryRating totalDeliveriesCount maxConcurrentOrders driverAvailability'
    );

    const candidates = [];

    for (const driver of drivers) {
      const driverLoc = driver.currentLocation || { lat: 19.0760, lng: 72.8777 };
      const distKm = GeoService.calculateHaversineDistance(
        pickupLat,
        pickupLng,
        driverLoc.lat,
        driverLoc.lng
      );

      // Check radius constraint
      if (distKm <= radiusKm) {
        // Check active concurrent orders count
        const activeOrdersCount = await Order.countDocuments({
          deliveryPartner: driver._id,
          deliveryStatus: {
            $in: ['Assigned', 'Accepted', 'Arrived at Pickup', 'Picked Up', 'In Transit', 'Out for Delivery'],
          },
        });

        const maxAllowed = driver.maxConcurrentOrders || 3;
        if (activeOrdersCount < maxAllowed) {
          const { roadDistanceKm, estimatedMinutes } = GeoService.calculateDrivingEta(
            distKm,
            driver.vehicleType
          );

          candidates.push({
            driver,
            distanceKm: distKm,
            roadDistanceKm,
            estimatedMinutes,
            activeOrdersCount,
          });
        }
      }
    }

    // Rank candidate drivers:
    // 1. Shortest estimated pickup time / distance
    // 2. Lowest active orders workload
    // 3. Higher rating
    candidates.sort((a, b) => {
      if (a.estimatedMinutes !== b.estimatedMinutes) {
        return a.estimatedMinutes - b.estimatedMinutes;
      }
      if (a.activeOrdersCount !== b.activeOrdersCount) {
        return a.activeOrdersCount - b.activeOrdersCount;
      }
      return (b.driver.deliveryRating || 5) - (a.driver.deliveryRating || 5);
    });

    return candidates;
  }

  /**
   * Main Dispatch: Initiates automatic driver assignment for an order
   */
  static async startAutoAssignment(orderId, triggeredBy = 'SYSTEM') {
    const config = await this.getConfig();

    if (!config.autoAssignmentEnabled && config.assignmentMode === 'manual') {
      console.log(`[AutoAssignment] Disabled by admin configuration for Order #${orderId}`);
      return { success: false, reason: 'Auto assignment is disabled by system policy' };
    }

    // Load order
    const order = await Order.findById(orderId).populate('items.vendor', 'name storeName storeLocation phone');
    if (!order) {
      throw new Error(`Order #${orderId} not found`);
    }

    // If order already has an active driver or is delivered/cancelled, abort
    if (
      order.deliveryPartner &&
      ['Accepted', 'Picked Up', 'In Transit', 'Out for Delivery', 'Delivered'].includes(order.deliveryStatus)
    ) {
      return { success: false, reason: `Order already in progress (${order.deliveryStatus})` };
    }

    // Determine pickup location from seller
    let pickupLat = 19.0760;
    let pickupLng = 72.8777;
    let pickupAddress = 'Store Pickup Center';
    let storeName = 'Seller Hub';

    const primaryVendor = order.items.find((i) => i.vendor)?.vendor;
    if (primaryVendor) {
      storeName = primaryVendor.storeName || primaryVendor.name;
      if (primaryVendor.storeLocation?.lat && primaryVendor.storeLocation?.lng) {
        pickupLat = primaryVendor.storeLocation.lat;
        pickupLng = primaryVendor.storeLocation.lng;
        pickupAddress = primaryVendor.storeLocation.address || primaryVendor.storeLocation.city || pickupAddress;
      }
    }

    // Store resolved pickup location on order
    order.pickupLocation = {
      lat: pickupLat,
      lng: pickupLng,
      address: pickupAddress,
      storeName,
    };

    // Determine excluded driver IDs (drivers who rejected or timed out in this assignment cycle)
    const previouslyAttemptedDrivers = (order.assignmentHistory || [])
      .filter((h) => ['rejected', 'expired'].includes(h.status))
      .map((h) => h.driver.toString());

    // Search across radius expansion tiers
    const expansionTiers = config.driverRadiusExpansionSteps;
    let selectedCandidate = null;
    let usedTierRadius = expansionTiers[0];

    for (const radiusKm of expansionTiers) {
      const candidates = await this.findEligibleDrivers({
        pickupLat,
        pickupLng,
        radiusKm,
        excludedDriverIds: previouslyAttemptedDrivers,
      });

      if (candidates.length > 0) {
        selectedCandidate = candidates[0];
        usedTierRadius = radiusKm;
        break;
      }
    }

    // If no eligible driver found across all expansion steps
    if (!selectedCandidate) {
      order.deliveryStatus = 'Awaiting Assignment';
      order.statusHistory.push({
        status: 'Awaiting Driver Assignment',
        timestamp: new Date(),
        note: `No eligible drivers found within max radius (${expansionTiers[expansionTiers.length - 1]} km). Requires manual dispatch.`,
      });
      await order.save();

      // Log failure in audit
      await AssignmentAudit.create({
        order: order._id,
        orderId: order.orderId,
        action: 'AUTO_ASSIGNMENT_FAILED',
        searchRadiusKm: expansionTiers[expansionTiers.length - 1],
        reason: 'No available online drivers in delivery zone',
        performedBy: triggeredBy,
      });

      // Notify Seller & Admin
      if (primaryVendor?._id) {
        await VendorNotification.create({
          recipient: primaryVendor._id,
          title: 'Manual Assignment Required ⚠️',
          message: `Order #${order.orderId} is packed and ready, but no nearby delivery partners were available. Please assign a driver manually.`,
          type: 'ORDER_UPDATE',
          orderId: order.orderId,
        });
      }

      await AdminNotification.create({
        title: 'Driver Assignment Needed 🛵',
        message: `Automatic driver search for Order #${order.orderId} reached max radius without an available driver. Please review and assign manually.`,
        type: 'ORDER',
        severity: 'warning',
        link: '/admin/delivery-assignments',
      });

      // Broadcast update to real-time clients
      try {
        const io = getIO();
        if (io) {
          io.emit('order:awaiting_assignment', { orderId: order.orderId, orderIdDb: order._id });
        }
      } catch (e) {}

      return {
        success: false,
        status: 'Awaiting Assignment',
        message: 'No available driver found in service area',
      };
    }

    // =========================================================================
    // Atomic Assignment Offer creation
    // =========================================================================
    const candidateDriver = selectedCandidate.driver;
    const expiresAt = new Date(Date.now() + config.driverOfferTimeoutSeconds * 1000);

    // Atomically transition order to 'Offer Sent'
    order.deliveryPartner = candidateDriver._id;
    order.deliveryStatus = 'Offer Sent';
    order.assignmentMode = config.assignmentMode;
    order.assignmentAttempts = (order.assignmentAttempts || 0) + 1;
    order.currentAssignmentOffer = {
      driver: candidateDriver._id,
      offeredAt: new Date(),
      expiresAt,
      distanceKm: selectedCandidate.distanceKm,
      estimatedMinutes: selectedCandidate.estimatedMinutes,
    };

    order.assignmentHistory.push({
      driver: candidateDriver._id,
      driverName: candidateDriver.name,
      offeredAt: new Date(),
      status: 'offered',
      searchRadiusKm: usedTierRadius,
    });

    order.statusHistory.push({
      status: 'Driver Offer Sent',
      timestamp: new Date(),
      note: `Delivery assignment offer sent to ${candidateDriver.name} (${selectedCandidate.distanceKm} km away, est. ${selectedCandidate.estimatedMinutes} mins). Offer expires in ${config.driverOfferTimeoutSeconds}s.`,
    });

    await order.save();

    // Audit log
    await AssignmentAudit.create({
      order: order._id,
      orderId: order.orderId,
      action: 'OFFER_SENT',
      driver: candidateDriver._id,
      driverName: candidateDriver.name,
      searchRadiusKm: usedTierRadius,
      distanceToPickupKm: selectedCandidate.distanceKm,
      estimatedMinutes: selectedCandidate.estimatedMinutes,
      performedBy: triggeredBy,
    });

    // Send driver in-app notification
    await DeliveryNotification.create({
      recipient: candidateDriver._id,
      title: 'New Delivery Offer 🛵',
      message: `New Order #${order.orderId} offered to you from ${storeName} (${selectedCandidate.distanceKm} km away). Accept within ${config.driverOfferTimeoutSeconds} seconds.`,
      type: 'assignment',
      orderId: order.orderId,
    });

    // Real-time Socket.IO emission to candidate driver & seller
    try {
      const io = getIO();
      if (io) {
        io.emit(`driver:${candidateDriver._id}:offer`, {
          orderId: order.orderId,
          orderIdDb: order._id,
          pickupStore: storeName,
          pickupAddress,
          distanceKm: selectedCandidate.distanceKm,
          estimatedMinutes: selectedCandidate.estimatedMinutes,
          deliveryFee: order.deliveryFee || 50,
          customerCity: order.shippingAddress?.city,
          expiresAt,
          timeoutSeconds: config.driverOfferTimeoutSeconds,
        });

        io.emit('order:offer_sent', {
          orderId: order.orderId,
          driverId: candidateDriver._id,
          driverName: candidateDriver.name,
        });
      }
    } catch (socketErr) {
      console.warn('Socket notification notice:', socketErr.message);
    }

    // Schedule automatic timeout trigger
    this.scheduleOfferTimeout(order._id, candidateDriver._id, config.driverOfferTimeoutSeconds);

    return {
      success: true,
      status: 'Offer Sent',
      offeredTo: candidateDriver.name,
      expiresAt,
      distanceKm: selectedCandidate.distanceKm,
      estimatedMinutes: selectedCandidate.estimatedMinutes,
    };
  }

  /**
   * Schedules expiration timer for an active driver offer
   */
  static scheduleOfferTimeout(orderId, driverId, timeoutSeconds) {
    const key = orderId.toString();

    // Clear existing timer if any
    if (activeOfferTimers.has(key)) {
      clearTimeout(activeOfferTimers.get(key));
    }

    const timer = setTimeout(async () => {
      try {
        await DriverAssignmentService.handleOfferTimeout(orderId, driverId);
      } catch (err) {
        console.warn(`[AssignmentTimeout Error] for Order ${orderId}:`, err.message);
      } finally {
        activeOfferTimers.delete(key);
      }
    }, timeoutSeconds * 1000);

    activeOfferTimers.set(key, timer);
  }

  /**
   * Called when a driver accepts the offered delivery
   */
  static async handleDriverAccept(orderId, driverId) {
    // Clear timeout timer
    const key = orderId.toString();
    if (activeOfferTimers.has(key)) {
      clearTimeout(activeOfferTimers.get(key));
      activeOfferTimers.delete(key);
    }

    const order = await Order.findById(orderId).populate('user', 'name phone email');
    if (!order) {
      throw new Error('Order not found');
    }

    // Concurrency verification
    if (order.deliveryPartner && order.deliveryPartner.toString() !== driverId.toString()) {
      throw new Error('This order has already been assigned to another partner.');
    }

    if (order.deliveryStatus !== 'Offer Sent' && order.deliveryStatus !== 'Assigned') {
      if (order.deliveryStatus === 'Accepted') {
        return { success: true, message: 'Already accepted', order };
      }
      throw new Error(`Order cannot be accepted in current status: ${order.deliveryStatus}`);
    }

    // Update order status to Accepted
    order.deliveryStatus = 'Accepted';
    order.deliveryAcceptedAt = new Date();

    // Update assignment history
    const lastHistory = order.assignmentHistory[order.assignmentHistory.length - 1];
    if (lastHistory && lastHistory.driver?.toString() === driverId.toString()) {
      lastHistory.status = 'accepted';
      lastHistory.respondedAt = new Date();
    }

    order.statusHistory.push({
      status: 'Delivery Accepted',
      timestamp: new Date(),
      note: `Delivery assignment accepted by agent. Ready for pickup.`,
    });

    await order.save();

    const driver = await User.findById(driverId).select('name phone vehicleType');

    // Audit log
    await AssignmentAudit.create({
      order: order._id,
      orderId: order.orderId,
      action: 'OFFER_ACCEPTED',
      driver: driverId,
      driverName: driver?.name || 'Driver',
      performedBy: 'DRIVER',
    });

    // Notify driver
    await DeliveryNotification.create({
      recipient: driverId,
      title: 'Order Confirmed! 🛵',
      message: `You accepted Order #${order.orderId}. Proceed to seller store for pickup.`,
      type: 'assignment',
      orderId: order.orderId,
    });

    // Real-time broadcast
    try {
      const io = getIO();
      if (io) {
        io.emit('order:assigned', {
          orderId: order.orderId,
          orderIdDb: order._id,
          driverId,
          driverName: driver?.name,
          driverPhone: driver?.phone,
          deliveryStatus: 'Accepted',
        });
      }
    } catch (e) {}

    return {
      success: true,
      message: 'Assignment accepted successfully',
      order,
    };
  }

  /**
   * Called when a driver declines/rejects the offered delivery
   */
  static async handleDriverReject(orderId, driverId, reason = 'Driver declined') {
    // Clear timeout timer
    const key = orderId.toString();
    if (activeOfferTimers.has(key)) {
      clearTimeout(activeOfferTimers.get(key));
      activeOfferTimers.delete(key);
    }

    const order = await Order.findById(orderId);
    if (!order) return;

    // Record rejection in history
    const lastHistory = order.assignmentHistory[order.assignmentHistory.length - 1];
    if (lastHistory && lastHistory.driver?.toString() === driverId.toString()) {
      lastHistory.status = 'rejected';
      lastHistory.respondedAt = new Date();
      lastHistory.reason = reason;
    }

    order.deliveryPartner = null;
    order.deliveryStatus = 'Assignment Retrying';
    order.statusHistory.push({
      status: 'Offer Declined',
      timestamp: new Date(),
      note: `Delivery offer declined by driver. Reason: ${reason}. Advancing to next candidate.`,
    });
    await order.save();

    // Audit log
    const driver = await User.findById(driverId).select('name');
    await AssignmentAudit.create({
      order: order._id,
      orderId: order.orderId,
      action: 'OFFER_REJECTED',
      driver: driverId,
      driverName: driver?.name || '',
      reason,
      performedBy: 'DRIVER',
    });

    // Immediately trigger auto-assignment to find next driver
    return await this.startAutoAssignment(order._id, 'SYSTEM');
  }

  /**
   * Called when an offer expires without response
   */
  static async handleOfferTimeout(orderId, driverId) {
    const order = await Order.findById(orderId);
    if (!order) return;

    // Only proceed if still awaiting this specific driver's response
    if (
      order.deliveryStatus === 'Offer Sent' &&
      order.deliveryPartner &&
      order.deliveryPartner.toString() === driverId.toString()
    ) {
      const lastHistory = order.assignmentHistory[order.assignmentHistory.length - 1];
      if (lastHistory && lastHistory.driver?.toString() === driverId.toString()) {
        lastHistory.status = 'expired';
        lastHistory.respondedAt = new Date();
        lastHistory.reason = 'Driver response timed out';
      }

      order.deliveryPartner = null;
      order.deliveryStatus = 'Assignment Retrying';
      order.statusHistory.push({
        status: 'Offer Expired',
        timestamp: new Date(),
        note: `Driver offer timed out without response. Expanding search radius.`,
      });
      await order.save();

      // Audit log
      const driver = await User.findById(driverId).select('name');
      await AssignmentAudit.create({
        order: order._id,
        orderId: order.orderId,
        action: 'OFFER_EXPIRED',
        driver: driverId,
        driverName: driver?.name || '',
        reason: 'Offer timeout expired',
        performedBy: 'SYSTEM',
      });

      // Notify candidate driver that offer has expired
      try {
        const io = getIO();
        if (io) {
          io.emit(`driver:${driverId}:offer_expired`, {
            orderId: order.orderId,
            message: 'Offer expired and re-routed to next partner',
          });
        }
      } catch (e) {}

      // Advance to next driver candidate
      return await this.startAutoAssignment(order._id, 'SYSTEM');
    }
  }

  /**
   * Manual override assignment by Admin or Seller
   */
  static async manualAssign(orderId, driverId, performedBy = 'ADMIN', fee = 50) {
    const key = orderId.toString();
    if (activeOfferTimers.has(key)) {
      clearTimeout(activeOfferTimers.get(key));
      activeOfferTimers.delete(key);
    }

    const order = await Order.findById(orderId);
    if (!order) throw new Error('Order not found');

    const driver = await User.findById(driverId);
    if (!driver || driver.role !== 'delivery') {
      throw new Error('Selected user is not an active delivery partner');
    }

    order.deliveryPartner = driver._id;
    order.deliveryStatus = 'Assigned';
    order.deliveryFee = fee;
    order.deliveryAssignedAt = new Date();

    order.statusHistory.push({
      status: 'Driver Assigned Manually',
      timestamp: new Date(),
      note: `Delivery assigned manually to ${driver.name} by ${performedBy}.`,
    });

    await order.save();

    await AssignmentAudit.create({
      order: order._id,
      orderId: order.orderId,
      action: 'MANUAL_ASSIGNMENT',
      driver: driver._id,
      driverName: driver.name,
      performedBy,
    });

    await DeliveryNotification.create({
      recipient: driver._id,
      title: 'Order Assigned 🛵',
      message: `Order #${order.orderId} has been manually assigned to you. Check your assigned deliveries.`,
      type: 'assignment',
      orderId: order.orderId,
    });

    try {
      const io = getIO();
      if (io) {
        io.emit('order:assigned', {
          orderId: order.orderId,
          orderIdDb: order._id,
          driverId: driver._id,
          driverName: driver.name,
          deliveryStatus: 'Assigned',
        });
      }
    } catch (e) {}

    return {
      success: true,
      message: `Driver ${driver.name} assigned successfully`,
      order,
    };
  }
}

module.exports = DriverAssignmentService;

