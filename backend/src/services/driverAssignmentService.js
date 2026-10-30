/**
 * Smart Driver Assignment Engine
 * Automated multi-tiered dispatch with radius expansion, accept/reject auto-rerouting,
 * atomic concurrency safety, and persistent server-restart recovery.
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

// Map of active timer timeouts per order to handle offer expirations cleanly in-memory
const activeOfferTimers = new Map();
let sweeperIntervalId = null;

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
      initialDriverSearchRadiusKm: settings.initialDriverSearchRadiusKm || 10,
      driverRadiusExpansionSteps: settings.driverRadiusExpansionSteps?.length
        ? settings.driverRadiusExpansionSteps
        : [10, 15],
      driverOfferTimeoutSeconds: settings.driverOfferTimeoutSeconds || 60,
      maxAssignmentRetries: settings.maxAssignmentRetries || 5,
    };
  }

  /**
   * Finds candidate active drivers within a specified radius from the pickup location
   * - Prioritizes valid live GPS coordinates
   * - Fallback to registered deliveryAddress only when requireLiveGps is false
   * - Filters by role, approval, online status, blocked status, availability, and active capacity
   * - Sorts candidate drivers strictly nearest to farthest using Haversine formula
   */
  static async findEligibleDrivers({
    pickupLat,
    pickupLng,
    radiusKm = 10,
    excludedDriverIds = [],
    requireLiveGps = false,
  }) {
    // 1. Fetch all approved & online delivery partners
    const drivers = await User.find({
      role: 'delivery',
      deliveryStatus: 'approved',
      isOnline: true,
      isBlocked: { $ne: true },
      driverAvailability: { $nin: ['busy', 'offline'] },
      _id: { $nin: excludedDriverIds },
    }).select(
      'name phone email vehicleType vehicleNumber currentLocation deliveryAddress useGpsLocation deliveryRating totalDeliveriesCount maxConcurrentOrders driverAvailability'
    );

    const candidates = [];

    for (const driver of drivers) {
      let driverLoc = null;
      let hasLiveGps = false;

      // 1. Check live GPS coordinates
      if (driver.currentLocation?.lat && driver.currentLocation?.lng) {
        const lat = Number(driver.currentLocation.lat);
        const lng = Number(driver.currentLocation.lng);
        if (!isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0) {
          driverLoc = { lat, lng };
          hasLiveGps = true;
        }
      }

      // If live GPS is required and driver does not have valid live coordinates, skip
      if (requireLiveGps && !hasLiveGps) {
        continue;
      }

      // 2. If no live GPS, fallback to verified registered deliveryAddress only when requireLiveGps is false
      if (!driverLoc && driver.deliveryAddress?.lat && driver.deliveryAddress?.lng) {
        const lat = Number(driver.deliveryAddress.lat);
        const lng = Number(driver.deliveryAddress.lng);
        if (!isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0) {
          driverLoc = { lat, lng };
        }
      }

      // Invalid or missing coordinates
      if (!driverLoc) {
        continue;
      }

      const distKm = GeoService.calculateHaversineDistance(
        pickupLat,
        pickupLng,
        driverLoc.lat,
        driverLoc.lng
      );

      // Check radius constraint (e.g. 10 km)
      if (distKm <= radiusKm) {
        // Check active concurrent orders count
        const activeOrdersCount = await Order.countDocuments({
          deliveryPartner: driver._id,
          deliveryStatus: {
            $in: [
              'Assigned',
              'Accepted',
              'Arrived at Pickup',
              'Reached Pickup',
              'Picked Up',
              'In Transit',
              'Out for Delivery',
            ],
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
            hasLiveGps,
          });
        }
      }
    }

    // Rank candidate drivers:
    // 1. Shortest distance / ETA (nearest driver first)
    // 2. Lowest active orders workload
    // 3. Higher rating
    candidates.sort((a, b) => {
      if (a.distanceKm !== b.distanceKm) {
        return a.distanceKm - b.distanceKm;
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
    const order = await Order.findById(orderId).populate('items.vendor', 'name storeName storeLocation phone businessAddress');
    if (!order) {
      throw new Error(`Order #${orderId} not found`);
    }

    // If order is designated for standard courier shipment (Pan-India delivery outside local radius), skip local bike rider assignment
    if (order.deliveryMode === 'standard_courier') {
      const GeoService = require('./geoService');
      const dest = GeoService.geocodeLocation(order.shippingAddress || {});
      const dist = (dest.lat && order.pickupLocation?.lat)
        ? GeoService.calculateHaversineDistance(order.pickupLocation.lat, order.pickupLocation.lng, dest.lat, dest.lng)
        : null;

      if (dist === null || dist > 20) {
        return {
          success: true,
          status: 'Standard Courier',
          message: 'Order designated for standard courier shipment',
          order,
        };
      }
    }

    // If order already has an active driver or is delivered/cancelled, abort
    if (
      order.deliveryPartner &&
      ['Accepted', 'Reached Pickup', 'Picked Up', 'In Transit', 'Out for Delivery', 'Delivered'].includes(order.deliveryStatus)
    ) {
      return { success: false, reason: `Order already in progress (${order.deliveryStatus})` };
    }

    // 1. Determine seller pickup location (Never default to Mumbai!)
    let pickupLat = null;
    let pickupLng = null;
    let pickupAddress = '';
    let storeName = 'Seller Hub';

    if (
      order.pickupLocation?.lat !== null &&
      order.pickupLocation?.lat !== undefined &&
      order.pickupLocation?.lng !== null &&
      order.pickupLocation?.lng !== undefined &&
      !isNaN(Number(order.pickupLocation.lat)) &&
      !isNaN(Number(order.pickupLocation.lng)) &&
      Number(order.pickupLocation.lat) !== 0 &&
      Number(order.pickupLocation.lng) !== 0
    ) {
      pickupLat = Number(order.pickupLocation.lat);
      pickupLng = Number(order.pickupLocation.lng);
      pickupAddress = order.pickupLocation.address || pickupAddress;
      storeName = order.pickupLocation.storeName || storeName;
    } else {
      let primaryVendor = order.vendor || order.items.find((i) => i.vendor)?.vendor;
      if (primaryVendor) {
        const vendorId = primaryVendor._id || primaryVendor;
        try {
          const fetchedVendor = await User.findById(vendorId).select('name storeName storeLocation phone businessAddress');
          if (fetchedVendor) primaryVendor = fetchedVendor;
        } catch (e) {}
      }

      if (primaryVendor) {
        storeName = primaryVendor.storeName || primaryVendor.name || storeName;
        if (
          primaryVendor.storeLocation?.lat !== null &&
          primaryVendor.storeLocation?.lat !== undefined &&
          primaryVendor.storeLocation?.lng !== null &&
          primaryVendor.storeLocation?.lng !== undefined &&
          !isNaN(Number(primaryVendor.storeLocation.lat)) &&
          !isNaN(Number(primaryVendor.storeLocation.lng)) &&
          Number(primaryVendor.storeLocation.lat) !== 0 &&
          Number(primaryVendor.storeLocation.lng) !== 0
        ) {
          pickupLat = Number(primaryVendor.storeLocation.lat);
          pickupLng = Number(primaryVendor.storeLocation.lng);
          pickupAddress = primaryVendor.storeLocation.address || primaryVendor.storeLocation.city || primaryVendor.businessAddress || pickupAddress;
        } else if (primaryVendor.businessAddress) {
          const geocoded = GeoService.geocodeLocation({ address: primaryVendor.businessAddress });
          if (geocoded.isResolved && geocoded.lat && geocoded.lng) {
            pickupLat = geocoded.lat;
            pickupLng = geocoded.lng;
            pickupAddress = primaryVendor.businessAddress;
          }
        }
      }

      if (pickupLat !== null && pickupLng !== null) {
        order.pickupLocation = {
          lat: pickupLat,
          lng: pickupLng,
          address: pickupAddress,
          storeName,
        };
        await order.save();
      }
    }

    // 2. Determine customer destination coordinates
    let destLat = null;
    let destLng = null;

    if (
      order.shippingCoordinates?.lat !== null &&
      order.shippingCoordinates?.lat !== undefined &&
      order.shippingCoordinates?.lng !== null &&
      order.shippingCoordinates?.lng !== undefined &&
      !isNaN(Number(order.shippingCoordinates.lat)) &&
      !isNaN(Number(order.shippingCoordinates.lng)) &&
      Number(order.shippingCoordinates.lat) !== 0 &&
      Number(order.shippingCoordinates.lng) !== 0
    ) {
      destLat = Number(order.shippingCoordinates.lat);
      destLng = Number(order.shippingCoordinates.lng);
    } else if (order.shippingAddress) {
      const geocodedDest = GeoService.geocodeLocation(order.shippingAddress);
      if (geocodedDest.isResolved && geocodedDest.lat && geocodedDest.lng) {
        destLat = geocodedDest.lat;
        destLng = geocodedDest.lng;
        order.shippingCoordinates = { lat: destLat, lng: destLng };
        await order.save();
      }
    }

    // 3. Location Verification Check: Missing or invalid seller/customer coordinates
    if (pickupLat === null || pickupLng === null || destLat === null || destLng === null) {
      order.deliveryStatus = 'LOCATION_VERIFICATION_REQUIRED';
      order.statusHistory.push({
        status: 'LOCATION_VERIFICATION_REQUIRED',
        timestamp: new Date(),
        note: `GPS coordinates could not be resolved (${pickupLat === null ? 'Seller' : 'Customer'} coordinates missing). Location verification required.`,
      });
      await order.save();

      return {
        success: false,
        status: 'LOCATION_VERIFICATION_REQUIRED',
        message: 'Customer or seller GPS coordinates are missing or invalid. Please verify addresses before dispatch.',
      };
    }

    // 4. Calculate Distance between Seller Pickup and Customer Destination using Haversine formula
    const customerDistanceKm = GeoService.calculateHaversineDistance(
      pickupLat,
      pickupLng,
      destLat,
      destLng
    );
    order.customerDistanceKm = customerDistanceKm;

    const localDeliveryRadiusKm = order.localDeliveryRadiusKm || 10;

    // 5. Check if distance > localDeliveryRadiusKm (default 10 km)
    // Exactly 10 km counts as local delivery (<= localDeliveryRadiusKm)
    if (customerDistanceKm > localDeliveryRadiusKm) {
      order.deliveryMode = 'standard_courier';
      order.deliveryStatus = 'OUTSIDE_LOCAL_RADIUS';
      await order.save();

      // Trigger Pan-India Courier Booking
      try {
        const CourierService = require('./courierService');
        const courierRes = await CourierService.bookCourierShipment(order._id);

        if (courierRes.success) {
          return {
            success: true,
            status: 'COURIER_BOOKED',
            deliveryMode: 'standard_courier',
            distanceKm: customerDistanceKm,
            awbCode: courierRes.awbCode,
            courierName: courierRes.courierName,
            shippingLabelUrl: courierRes.shippingLabelUrl,
            message: `Order dispatched via Pan-India Courier (${courierRes.courierName}). AWB: ${courierRes.awbCode}.`,
            order: courierRes.order,
          };
        }

        // If credentials are not configured or booking was unserviceable/failed
        order.statusHistory.push({
          status: 'OUTSIDE_LOCAL_RADIUS',
          timestamp: new Date(),
          note: `Customer delivery location is ${customerDistanceKm} km away (> ${localDeliveryRadiusKm} km local radius). ${courierRes.error || 'Courier dispatch pending.'}`,
        });
        await order.save();

        return {
          success: false,
          status: 'OUTSIDE_LOCAL_RADIUS',
          distanceKm: customerDistanceKm,
          deliveryMode: 'standard_courier',
          error: courierRes.error,
          requiresConfiguration: courierRes.requiresConfiguration,
          message: courierRes.error || `Customer location is outside ${localDeliveryRadiusKm} km local delivery radius. Will be dispatched via courier.`,
        };
      } catch (courierErr) {
        return {
          success: false,
          status: 'OUTSIDE_LOCAL_RADIUS',
          distanceKm: customerDistanceKm,
          deliveryMode: 'standard_courier',
          error: courierErr.message,
          message: `Customer location is outside ${localDeliveryRadiusKm} km local delivery radius (${customerDistanceKm} km). Will be dispatched via courier.`,
        };
      }
    }

    // Customer is within local radius (<= localDeliveryRadiusKm)
    order.deliveryMode = 'local';

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
      order.deliveryStatus = 'Pending Assignment';
      order.statusHistory.push({
        status: 'Pending Assignment',
        timestamp: new Date(),
        note: `No eligible drivers found within max radius (${expansionTiers[expansionTiers.length - 1]} km). Requires manual dispatch or retry.`,
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

      const primaryVendor = order.items.find((i) => i.vendor)?.vendor;
      // Notify Seller & Admin
      try {
        if (primaryVendor?._id) {
          await VendorNotification.create({
            recipient: primaryVendor._id,
            title: 'Manual Assignment Required ⚠️',
            message: `Order #${order.orderId} is packed and ready, but no nearby delivery partners were available. Please assign a driver manually.`,
            type: 'ORDER_UPDATE',
            orderId: order.orderId,
          });
        }
      } catch (vnErr) {
        console.warn('Vendor notification notice:', vnErr.message);
      }

      try {
        await AdminNotification.create({
          title: 'Driver Assignment Needed 🛵',
          message: `Automatic driver search for Order #${order.orderId} reached max radius without an available driver. Please review and assign manually.`,
          type: 'NEW_ORDER',
          severity: 'warning',
          link: '/admin/delivery-assignments',
        });
      } catch (anErr) {
        console.warn('Admin notification notice:', anErr.message);
      }

      // Broadcast update to real-time clients
      try {
        const io = getIO();
        if (io) {
          io.emit('order:pending_assignment', { orderId: order.orderId, orderIdDb: order._id });
          io.emit('order:awaiting_assignment', { orderId: order.orderId, orderIdDb: order._id });
        }
      } catch (e) {}

      return {
        success: false,
        status: 'Pending Assignment',
        message: 'No eligible delivery partner found within pickup radius',
      };
    }

    // =========================================================================
    // Atomic Assignment Offer creation (Concurrency-safe race prevention)
    // =========================================================================
    const candidateDriver = selectedCandidate.driver;
    const expiresAt = new Date(Date.now() + config.driverOfferTimeoutSeconds * 1000);

    const offerData = {
      driver: candidateDriver._id,
      offeredAt: new Date(),
      expiresAt,
      distanceKm: selectedCandidate.distanceKm,
      estimatedMinutes: selectedCandidate.estimatedMinutes,
    };

    const historyEntry = {
      driver: candidateDriver._id,
      driverName: candidateDriver.name,
      offeredAt: new Date(),
      status: 'offered',
      searchRadiusKm: usedTierRadius,
    };

    const statusEntry = {
      status: 'Driver Offer Sent',
      timestamp: new Date(),
      note: `Delivery assignment offer sent to ${candidateDriver.name} (${selectedCandidate.distanceKm} km away, est. ${selectedCandidate.estimatedMinutes} mins). Offer expires in ${config.driverOfferTimeoutSeconds}s.`,
    };

    // ATOMIC LOCK: Ensures only ONE process can transition the order from unassigned / pending status
    const lockedOrder = await Order.findOneAndUpdate(
      {
        _id: order._id,
        deliveryStatus: {
          $in: [
            'Unassigned',
            'Pending Assignment',
            'Awaiting Assignment',
            'Assignment Pending',
            'Assignment Retrying',
          ],
        },
      },
      {
        $set: {
          deliveryPartner: candidateDriver._id,
          deliveryStatus: 'Offer Sent',
          assignmentMode: config.assignmentMode,
          currentAssignmentOffer: offerData,
          pickupLocation: order.pickupLocation,
          shippingCoordinates: order.shippingCoordinates,
          customerDistanceKm,
          localDeliveryRadiusKm,
          deliveryMode: 'local',
          pickupOtp: order.pickupOtp || Math.floor(1000 + Math.random() * 9000).toString(),
          deliveryOtp: order.deliveryOtp || Math.floor(1000 + Math.random() * 9000).toString(),
        },
        $inc: { assignmentAttempts: 1 },
        $push: {
          assignmentHistory: historyEntry,
          statusHistory: statusEntry,
        },
      },
      { returnDocument: 'after' }
    );

    if (!lockedOrder) {
      console.log(`[AutoAssignment Atomic Lock] Order #${order.orderId} was already claimed by another concurrent assignment.`);
      const currentOrder = await Order.findById(order._id);
      return {
        success: false,
        reason: 'Order was already claimed or assigned by concurrent request',
        status: currentOrder?.deliveryStatus,
        order: currentOrder,
      };
    }

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
          totalAmount: order.total,
          itemCount: order.items?.length || 1,
          expiresAt,
          timeoutSeconds: config.driverOfferTimeoutSeconds,
        });

        io.emit('order:offer_sent', {
          orderId: order.orderId,
          driverId: candidateDriver._id,
          driverName: candidateDriver.name,
          expiresAt,
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
   * - Atomically confirms assignment
   * - Validates driver eligibility, online status, and capacity
   * - Updates driver availability if capacity filled
   * - Emits notifications to driver, seller, and admin
   */
  static async handleDriverAccept(orderId, driverId) {
    // Clear timeout timer
    const key = orderId.toString();
    if (activeOfferTimers.has(key)) {
      clearTimeout(activeOfferTimers.get(key));
      activeOfferTimers.delete(key);
    }

    // 1. Validate driver exists, is approved, online, and not blocked
    const driver = await User.findById(driverId);
    if (!driver || driver.role !== 'delivery' || driver.deliveryStatus !== 'approved' || !driver.isOnline || driver.isBlocked) {
      throw new Error('Driver is not eligible to accept orders');
    }

    // 2. Validate driver capacity limit at acceptance time
    // Only count OTHER active IN-PROGRESS deliveries already confirmed/accepted by this driver
    const activeOrdersCount = await Order.countDocuments({
      _id: { $ne: orderId },
      deliveryPartner: driver._id,
      deliveryStatus: {
        $in: [
          'Accepted',
          'Arrived at Pickup',
          'Reached Pickup',
          'Picked Up',
          'In Transit',
          'Out for Delivery',
        ],
      },
    });
    const maxAllowed = driver.maxConcurrentOrders || 3;
    if (activeOrdersCount >= maxAllowed) {
      throw new Error(`Capacity limit reached. You currently have ${activeOrdersCount} active deliveries in progress (Maximum allowed: ${maxAllowed}). Complete your existing deliveries before accepting more.`);
    }

    // 3. Atomically confirm assignment
    const now = new Date();
    const updatedOrder = await Order.findOneAndUpdate(
      {
        _id: orderId,
        $and: [
          {
            $or: [
              { deliveryPartner: driver._id },
              { deliveryPartner: driver._id.toString() },
            ],
          },
          {
            $or: [
              { 'currentAssignmentOffer.expiresAt': { $gt: now } },
              { 'currentAssignmentOffer.expiresAt': null },
              { deliveryStatus: { $in: ['Assigned', 'assigned'] } },
            ],
          },
        ],
        deliveryStatus: { $in: ['Offer Sent', 'Driver Offer Sent', 'Assigned', 'assigned'] },
      },
      {
        $set: {
          deliveryStatus: 'Accepted',
          orderStatus: 'Accepted',
          deliveryAcceptedAt: now,
          'currentAssignmentOffer.respondedAt': now,
        },
        $push: {
          statusHistory: {
            status: 'Accepted',
            timestamp: now,
            note: `Delivery assignment accepted by ${driver.name}. Assignment confirmed.`,
          },
        },
      },
      { returnDocument: 'after' }
    );

    if (!updatedOrder) {
      const curOrder = await Order.findById(orderId);
      if (curOrder && curOrder.deliveryStatus === 'Accepted' && curOrder.deliveryPartner?.toString() === driverId.toString()) {
        return { success: true, message: 'Already accepted', order: curOrder };
      }
      if (curOrder && curOrder.currentAssignmentOffer?.expiresAt && now > curOrder.currentAssignmentOffer.expiresAt) {
        throw new Error('This offer has expired. The order has been re-routed to another partner.');
      }
      if (curOrder && curOrder.deliveryPartner && curOrder.deliveryPartner.toString() !== driverId.toString()) {
        throw new Error('This order has already been assigned to another partner.');
      }
      throw new Error(`Order cannot be accepted in current status: ${curOrder?.deliveryStatus || 'Unknown'}`);
    }

    // 4. Update items and assignment history entry
    let orderNeedsSave = false;
    if (Array.isArray(updatedOrder.items)) {
      updatedOrder.items.forEach((item) => {
        if (!item.deliveryPartner || item.deliveryPartner.toString() === driverId.toString()) {
          item.deliveryStatus = 'Accepted';
          orderNeedsSave = true;
        }
      });
    }

    const lastHistory = updatedOrder.assignmentHistory && updatedOrder.assignmentHistory.length > 0
      ? updatedOrder.assignmentHistory[updatedOrder.assignmentHistory.length - 1]
      : null;
    if (lastHistory && lastHistory.driver?.toString() === driverId.toString()) {
      lastHistory.status = 'accepted';
      lastHistory.respondedAt = now;
      orderNeedsSave = true;
    }

    if (orderNeedsSave) {
      await updatedOrder.save();
    }

    // 5. Update driver availability: if active orders reach maxAllowed, set driverAvailability = 'busy'
    if (activeOrdersCount + 1 >= maxAllowed) {
      driver.driverAvailability = 'busy';
      await driver.save();
    }

    // 6. Audit log
    await AssignmentAudit.create({
      order: updatedOrder._id,
      orderId: updatedOrder.orderId,
      action: 'OFFER_ACCEPTED',
      driver: driver._id,
      driverName: driver.name,
      performedBy: 'DRIVER',
    });

    // 7. Notifications
    await DeliveryNotification.create({
      recipient: driver._id,
      title: 'Order Confirmed! 🛵',
      message: `You accepted Order #${updatedOrder.orderId}. Proceed to seller store for pickup.`,
      type: 'assignment',
      orderId: updatedOrder.orderId,
    });

    const primaryVendor = updatedOrder.items?.find((i) => i.vendor)?.vendor;
    if (primaryVendor) {
      try {
        await VendorNotification.create({
          recipient: primaryVendor._id || primaryVendor,
          title: 'Driver Confirmed 🛵',
          message: `Delivery partner ${driver.name} accepted Order #${updatedOrder.orderId} and is on their way to your store.`,
          type: 'ORDER_UPDATE',
          orderId: updatedOrder.orderId,
        });
      } catch (vnErr) {}
    }

    // 8. Real-time broadcast
    try {
      const io = getIO();
      if (io) {
        io.emit('order:assigned', {
          orderId: updatedOrder.orderId,
          orderIdDb: updatedOrder._id,
          driverId: driver._id,
          driverName: driver.name,
          driverPhone: driver.phone,
          deliveryStatus: 'Accepted',
        });
        io.emit(`driver:${driver._id}:accepted`, {
          orderId: updatedOrder.orderId,
          deliveryStatus: 'Accepted',
        });
        io.emit('order:offer_accepted', {
          orderId: updatedOrder.orderId,
          driverId: driver._id,
          driverName: driver.name,
        });
      }
    } catch (e) {}

    return {
      success: true,
      message: 'Assignment accepted successfully',
      order: updatedOrder,
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

    const prevOrder = await Order.findById(orderId);
    const wasManual = prevOrder?.assignmentMode === 'manual' || prevOrder?.deliveryStatus === 'Assigned' || prevOrder?.deliveryStatus === 'assigned';

    const now = new Date();
    const lockedOrder = await Order.findOneAndUpdate(
      {
        _id: orderId,
        $or: [
          { deliveryPartner: driverId },
          { deliveryPartner: driverId.toString() },
        ],
        deliveryStatus: { $in: ['Offer Sent', 'Driver Offer Sent', 'Assigned', 'assigned'] },
      },
      {
        $set: {
          deliveryPartner: null,
          deliveryStatus: wasManual ? 'Declined' : 'Assignment Retrying',
          orderStatus: wasManual ? 'Declined' : prevOrder?.orderStatus || 'Packed',
          'currentAssignmentOffer.driver': null,
          'currentAssignmentOffer.expiresAt': null,
        },
        $push: {
          statusHistory: {
            status: 'Offer Declined',
            timestamp: now,
            note: `Delivery assignment declined by driver. Reason: ${reason}.${wasManual ? ' Returned to seller for reassignment.' : ' Advancing to next candidate.'}`,
          },
        },
      },
      { returnDocument: 'after' }
    );

    if (!lockedOrder) {
      const cur = await Order.findById(orderId);
      return { success: false, message: 'Offer already handled or expired', order: cur };
    }

    const lastHistory = lockedOrder.assignmentHistory[lockedOrder.assignmentHistory.length - 1];
    if (lastHistory && lastHistory.driver?.toString() === driverId.toString()) {
      lastHistory.status = 'rejected';
      lastHistory.respondedAt = now;
      lastHistory.reason = reason;
      await lockedOrder.save();
    }

    const driver = await User.findById(driverId).select('name');
    await AssignmentAudit.create({
      order: lockedOrder._id,
      orderId: lockedOrder.orderId,
      action: 'OFFER_REJECTED',
      driver: driverId,
      driverName: driver?.name || '',
      reason,
      performedBy: 'DRIVER',
    });

    // Notify the primary seller that the driver declined so they can reassign
    try {
      const primaryVendor = lockedOrder.items?.find((i) => i.vendor)?.vendor;
      if (primaryVendor) {
        await VendorNotification.create({
          recipient: primaryVendor._id || primaryVendor,
          title: 'Delivery Partner Declined Order ⚠️',
          message: `Delivery partner "${driver?.name || 'Assigned rider'}" declined Order #${lockedOrder.orderId} (Reason: ${reason}). You can assign another delivery partner now.`,
          type: 'ORDER_UPDATE',
          orderId: lockedOrder.orderId,
        });
      }
    } catch (notifErr) {
      console.warn('Vendor decline notification warning:', notifErr.message);
    }

    try {
      const io = getIO();
      if (io) {
        io.emit('order:offer_declined', {
          orderId: lockedOrder.orderId,
          orderIdDb: lockedOrder._id,
          driverId,
          reason,
        });
        io.emit('order:declined', {
          orderId: lockedOrder.orderId,
          orderIdDb: lockedOrder._id,
          driverId,
          reason,
        });
        io.emit(`driver:${driverId}:declined`, {
          orderId: lockedOrder.orderId,
          orderIdDb: lockedOrder._id,
        });
        io.emit(`driver:${driverId}:offer_expired`, {
          orderId: lockedOrder.orderId,
        });
      }
    } catch (e) {}

    // Advance to next driver candidate if this was an auto-assignment, otherwise return to seller
    if (!wasManual) {
      return await this.startAutoAssignment(lockedOrder._id, 'SYSTEM');
    }

    return {
      success: true,
      status: 'Declined',
      message: 'Assignment declined and returned to seller for re-assignment',
      order: lockedOrder,
    };
  }

  /**
   * Called when an offer expires without response
   */
  static async handleOfferTimeout(orderId, driverId) {
    const key = orderId.toString();
    activeOfferTimers.delete(key);

    const now = new Date();
    const lockedOrder = await Order.findOneAndUpdate(
      {
        _id: orderId,
        deliveryPartner: driverId,
        deliveryStatus: { $in: ['Offer Sent', 'Driver Offer Sent'] },
      },
      {
        $set: {
          deliveryPartner: null,
          deliveryStatus: 'Assignment Retrying',
        },
        $push: {
          statusHistory: {
            status: 'Offer Expired',
            timestamp: now,
            note: `Driver offer timed out after 60s without response. Advancing to next candidate.`,
          },
        },
      },
      { returnDocument: 'after' }
    );

    if (!lockedOrder) return; // Order was already accepted or handled

    const lastHistory = lockedOrder.assignmentHistory[lockedOrder.assignmentHistory.length - 1];
    if (lastHistory && lastHistory.driver?.toString() === driverId.toString()) {
      lastHistory.status = 'expired';
      lastHistory.respondedAt = now;
      lastHistory.reason = 'Driver response timed out';
      await lockedOrder.save();
    }

    const driver = await User.findById(driverId).select('name');
    await AssignmentAudit.create({
      order: lockedOrder._id,
      orderId: lockedOrder.orderId,
      action: 'OFFER_EXPIRED',
      driver: driverId,
      driverName: driver?.name || '',
      reason: 'Offer timeout expired',
      performedBy: 'SYSTEM',
    });

    try {
      const io = getIO();
      if (io) {
        io.emit(`driver:${driverId}:offer_expired`, {
          orderId: lockedOrder.orderId,
          message: 'Offer expired and re-routed to next partner',
        });
        io.emit('order:offer_expired', {
          orderId: lockedOrder.orderId,
          driverId,
        });
      }
    } catch (e) {}

    // Advance to next driver candidate
    return await this.startAutoAssignment(lockedOrder._id, 'SYSTEM');
  }

  /**
   * Clears in-memory active offer timer for an order
   */
  static clearOfferTimer(orderId) {
    if (!orderId) return;
    const key = orderId.toString();
    if (activeOfferTimers.has(key)) {
      clearTimeout(activeOfferTimers.get(key));
      activeOfferTimers.delete(key);
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
    order.orderStatus = 'Assigned';
    order.assignmentMode = 'manual';
    order.deliveryFee = fee;
    order.deliveryAssignedAt = new Date();

    // Reset currentAssignmentOffer
    order.currentAssignmentOffer = {
      driver: null,
      offeredAt: null,
      expiresAt: null,
      distanceKm: 0,
      estimatedMinutes: 0,
    };

    if (order.items && order.items.length > 0) {
      order.items.forEach((it) => {
        it.deliveryPartner = driver._id;
        it.deliveryStatus = 'Assigned';
        if (['Pending', 'Confirmed', 'Processing', 'Packed'].includes(it.itemStatus)) {
          it.itemStatus = 'Ready for Pickup';
        }
      });
    }

    if (['Order Placed', 'Confirmed', 'Processing'].includes(order.orderStatus)) {
      order.orderStatus = 'Ready for Pickup';
    }

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
        io.emit(`driver:${driver._id}:assigned`, {
          orderId: order.orderId,
          orderIdDb: order._id,
          deliveryStatus: 'Assigned',
        });
        io.emit(`driver:${driver._id}:offer`, {
          orderId: order.orderId,
          orderIdDb: order._id,
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

  /**
   * Retries pending assignment orders when an eligible driver is available
   * Avoids duplicate rapid retries and thrashing loops
   */
  static async retryPendingAssignments() {
    try {
      const config = await this.getConfig();
      if (!config.autoAssignmentEnabled) return;

      const minRetryIntervalMs = 30000; // 30s minimum debounce between retry attempts
      const now = new Date();

      const pendingOrders = await Order.find({
        deliveryStatus: { $in: ['Pending Assignment', 'Assignment Retrying'] },
        assignmentAttempts: { $lt: config.maxAssignmentRetries || 5 },
      })
        .sort({ updatedAt: 1 })
        .limit(10);

      for (const order of pendingOrders) {
        const lastUpdate = order.updatedAt ? new Date(order.updatedAt).getTime() : 0;
        if (now.getTime() - lastUpdate < minRetryIntervalMs) {
          continue; // Skip too-recent attempt
        }

        console.log(`[AutoAssignment Retry] Retrying pending Order #${order.orderId} (Attempt ${order.assignmentAttempts + 1}/${config.maxAssignmentRetries || 5})...`);
        try {
          await this.startAutoAssignment(order._id, 'SYSTEM');
        } catch (err) {
          console.warn(`[AutoAssignment Retry Error] Order #${order.orderId}:`, err.message);
        }
      }
    } catch (err) {
      console.warn('[AutoAssignment Retry] Failed to query pending orders:', err.message);
    }
  }

  /**
   * Called when a driver updates availability to available, toggles online, or finishes delivery
   */
  static async onDriverAvailable(driverId) {
    try {
      setTimeout(() => {
        DriverAssignmentService.retryPendingAssignments().catch(() => {});
      }, 1000);
    } catch (e) {}
  }

  /**
   * Periodic background sweeper to catch expired offers and retry pending assignments
   */
  static async sweepExpiredOffersAndRetries() {
    try {
      const now = new Date();
      const expiredOrders = await Order.find({
        deliveryStatus: { $in: ['Offer Sent', 'Driver Offer Sent'] },
        'currentAssignmentOffer.expiresAt': { $lte: now },
        deliveryPartner: { $ne: null },
      });

      for (const order of expiredOrders) {
        console.log(`[AutoAssignment Sweeper] Expiring stale offer for Order #${order.orderId}...`);
        await this.handleOfferTimeout(order._id, order.deliveryPartner);
      }

      await this.retryPendingAssignments();
    } catch (err) {
      console.warn('[AutoAssignment Sweeper] Error:', err.message);
    }
  }

  /**
   * Starts periodic background sweeper interval (default: every 30 seconds)
   */
  static startBackgroundSweeper(intervalMs = 30000) {
    if (sweeperIntervalId) return;
    sweeperIntervalId = setInterval(() => {
      DriverAssignmentService.sweepExpiredOffersAndRetries().catch((err) => {
        console.warn('[AutoAssignment Sweeper] Error:', err.message);
      });
    }, intervalMs);
    console.log('[AutoAssignment Sweeper] Background sweeper started (interval: 30s)');
  }

  /**
   * Recovers pending offers on server restart:
   * - Reschedules timer if expiresAt is still in the future
   * - Handles timeout if expiresAt expired during downtime
   * - Checks pending assignment orders
   */
  static async recoverPendingOffersOnStartup() {
    try {
      const now = new Date();
      const activeOffers = await Order.find({
        deliveryStatus: { $in: ['Offer Sent', 'Driver Offer Sent'] },
        deliveryPartner: { $ne: null },
      });

      console.log(`[AutoAssignment Startup] Recovering ${activeOffers.length} pending offer(s)...`);
      for (const order of activeOffers) {
        const expiresAt = order.currentAssignmentOffer?.expiresAt;
        const driverId = order.deliveryPartner;

        if (!expiresAt || now >= new Date(expiresAt)) {
          console.log(`[AutoAssignment Startup] Order #${order.orderId} offer expired during downtime. Processing timeout...`);
          await this.handleOfferTimeout(order._id, driverId);
        } else {
          const remainingSec = Math.max(1, Math.round((new Date(expiresAt).getTime() - now.getTime()) / 1000));
          console.log(`[AutoAssignment Startup] Rescheduling timer for Order #${order.orderId} (${remainingSec}s remaining).`);
          this.scheduleOfferTimeout(order._id, driverId, remainingSec);
        }
      }

      await this.retryPendingAssignments();
    } catch (err) {
      console.warn('[AutoAssignment Startup] Error:', err.message);
    }
  }
}

module.exports = DriverAssignmentService;
