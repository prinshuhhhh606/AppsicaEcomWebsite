const Order = require('../models/order');
const Product = require('../models/product');
const Coupon = require('../models/coupon');
const Cart = require('../models/cart');
const Payment = require('../models/payment');
const User = require('../models/user');
const AdminNotification = require('../models/adminNotification');
const VendorNotification = require('../models/vendorNotification');
const PaymentService = require('./paymentService');
const NotificationService = require('./notificationService');
const GeoService = require('./geoService');
const DriverAssignmentService = require('./driverAssignmentService');

class CheckoutService {
  /**
   * Recalculates subtotal, delivery, and discounts strictly from backend MongoDB data.
   * Client-submitted prices are never trusted.
   */
  static async calculateTotals(items, couponCode = null) {
    let subtotal = 0;
    const resolvedItems = [];

    for (const item of items) {
      const productId = item.product?._id || item.product || item._id || item.productId;
      const product = await Product.findById(productId);
      if (!product || product.isArchived) {
        throw new Error(`Product "${product ? product.name : productId}" is no longer available.`);
      }
      if (product.isActive === false) {
        throw new Error(
          `Product "${product.name}" has been temporarily deactivated by the seller and cannot be ordered.`
        );
      }
      if (product.vendor && product.vendorStatus !== 'approved') {
        throw new Error(`Product "${product.name}" is not currently available for purchase.`);
      }
      if (product.stock < item.quantity) {
        throw new Error(
          `Insufficient inventory for "${product.name}". Available: ${product.stock}, Requested: ${item.quantity}`
        );
      }

      const itemTotal = product.price * item.quantity;
      subtotal += itemTotal;

      resolvedItems.push({
        product: product._id,
        name: product.name,
        price: product.price, // Trusted MongoDB price
        quantity: item.quantity,
        image: product.images?.[0] || product.image || '',
        vendor: product.vendor || null,
        itemStatus: 'Pending',
      });
    }

    const delivery = subtotal >= 999 || subtotal === 0 ? 0 : 79;
    let discount = 0;

    if (couponCode) {
      const coupon = await Coupon.findOne({
        code: couponCode.toUpperCase().trim(),
        isActive: true,
      });

      if (coupon) {
        const isNotExpired = !coupon.expiryDate || new Date(coupon.expiryDate) > new Date();
        if (isNotExpired && subtotal >= (coupon.minOrderAmount || 0)) {
          if (coupon.discountType === 'percent') {
            discount = (subtotal * coupon.discountValue) / 100;
            if (coupon.maxDiscount && discount > coupon.maxDiscount) {
              discount = coupon.maxDiscount;
            }
          } else {
            discount = coupon.discountValue;
          }
          discount = Math.min(discount, subtotal);
        }
      }
    }

    const total = Math.max(0, subtotal + delivery - discount);

    return {
      subtotal: Math.round(subtotal),
      delivery: Math.round(delivery),
      discount: Math.round(discount),
      total: Math.round(total),
      items: resolvedItems,
    };
  }

  /**
   * Verifies payment server-side, validates idempotency, and creates order with safe inventory deduction and multi-vendor notifications.
   */
  static async verifyPaymentAndCreateOrder({
    userId,
    items,
    shippingAddress,
    paymentMethod = 'card',
    paymentStatus = null,
    transactionId = null,
    paymentDetails = {},
    couponCode = null,
    user = null,
  }) {
    const isCOD = paymentMethod === 'cod';

    // =========================================================================
    // 0. VALIDATE SHIPPING DESTINATION & 6-DIGIT INDIAN PIN CODE
    // =========================================================================
    if (!shippingAddress || !shippingAddress.fullName || !shippingAddress.addressLine || !shippingAddress.city) {
      const err = new Error('Valid shipping address details (Name, Address, City, PIN code) are required.');
      err.statusCode = 400;
      throw err;
    }
    const pin = String(shippingAddress.pincode || '').trim();
    if (!/^[1-9][0-9]{5}$/.test(pin)) {
      const err = new Error('Invalid PIN code: Must be exactly 6 digits without starting with 0 (e.g. 452001).');
      err.statusCode = 400;
      throw err;
    }

    // =========================================================================
    // 1. SERVER-SIDE PAYMENT VERIFICATION (Never trust frontend state alone)
    // =========================================================================
    if (!isCOD) {
      const verification = await PaymentService.verifyPayment({
        transactionId,
        paymentMethod,
        status: paymentStatus === 'Failed' || paymentStatus === 'failed' ? 'failed' : 'success',
        details: paymentDetails,
      });

      if (!verification.verified) {
        // Record failed payment attempt for audit logs
        try {
          if (transactionId) {
            await Payment.create({
              order: null,
              user: userId || null,
              transactionId: transactionId.trim(),
              amount: 0,
              currency: 'INR',
              paymentMethod,
              status: 'failed',
              details: { reason: verification.message, raw: paymentDetails },
            });
          }
        } catch (logErr) {
          console.warn('Payment failure logging notice:', logErr.message);
        }

        const err = new Error(
          verification.message || 'Payment verification failed. Your card or wallet was not charged.'
        );
        err.statusCode = 400;
        throw err;
      }
    }

    // =========================================================================
    // 2. IDEMPOTENCY CHECK (Ensure order is created once even on duplicate callbacks)
    // =========================================================================
    if (transactionId) {
      const existingOrder = await Order.findOne({ transactionId: transactionId.trim() })
        .populate('items.product', 'name images')
        .populate('user', 'name email phone');

      if (existingOrder) {
        console.log(`ℹ️ [IDEMPOTENT] Duplicate payment callback received for TXN: ${transactionId}. Returning existing order #${existingOrder.orderId}`);
        return {
          order: existingOrder,
          isDuplicate: true,
        };
      }
    }

    // =========================================================================
    
    // =========================================================================
    // 3. SERVER-SIDE DELIVERY ELIGIBILITY & SMART ZONE VALIDATION
    // =========================================================================
    let destCoords = null;
    let orderDeliveryMode = 'local';

    if (shippingAddress) {
      const pin = String(shippingAddress.pincode || '').trim();
      if (!/^[1-9][0-9]{5}$/.test(pin)) {
        const err = new Error('Invalid PIN code: Must be exactly 6 digits without starting with 0 (e.g. 452001).');
        err.statusCode = 400;
        throw err;
      }

      destCoords = GeoService.geocodeLocation(shippingAddress);

      for (const item of items) {
        const productId = item.product?._id || item.product || item._id || item.productId;
        const product = await Product.findById(productId);
        if (product && product.vendor) {
          const seller = await User.findById(product.vendor);
          if (seller) {
            const eligibility = await GeoService.checkDeliveryEligibility({
              seller,
              product,
              destination: { ...shippingAddress, ...destCoords },
            });

            if (!eligibility.eligible) {
              const err = new Error(
                `Product "${product.name}" cannot be delivered to your address (${shippingAddress.city || shippingAddress.pincode}): ${eligibility.message || eligibility.reason}`
              );
              err.statusCode = 400;
              throw err;
            }

            if (eligibility.deliveryMode === 'standard_courier') {
              orderDeliveryMode = 'standard_courier';
            }
          }
        }
      }
    }

    // 3. RECALCULATE TOTALS & VALIDATE INVENTORY FROM MONGODB
    // =========================================================================
    const { subtotal, delivery, discount, total, items: orderItems } = await this.calculateTotals(
      items,
      couponCode
    );

    // =========================================================================
    // 4. GENERATE UNIQUE HUMAN-READABLE ORDER & INVOICE IDENTIFIERS
    // =========================================================================
    const todayStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
    const orderId = `ORD-${todayStr}-${randomSuffix}`;
    const invoiceNumber = `INV-${todayStr}-${randomSuffix}`;
    const trackingNumber = `TRK-BD-${Date.now().toString().slice(-6)}${randomSuffix}`;

    const finalPaymentStatus = isCOD ? 'Pending' : 'Paid';
    const finalTransactionId = transactionId
      ? transactionId.trim()
      : isCOD
      ? `COD-${orderId}`
      : `TXN-${orderId}`;
    const estimatedDeliveryDate = new Date(Date.now() + 4 * 24 * 60 * 60 * 1000);

    const initialHistory = [
      {
        status: 'Order Placed',
        timestamp: new Date(),
        note: `Order initiated by customer using ${paymentMethod.toUpperCase()}`,
      },
      {
        status: 'Confirmed',
        timestamp: new Date(),
        note: isCOD
          ? 'Order confirmed for Cash on Delivery dispatch'
          : `Payment of ₹${total} successfully verified (${finalTransactionId})`,
      },
    ];

    // =========================================================================
    // 5. RESOLVE SELLER PICKUP LOCATION SNAPSHOT
    // =========================================================================
    let pickupLocation = {
      lat: 19.0760,
      lng: 72.8777,
      address: 'Central Logistics Hub, Mumbai',
      storeName: 'Appsica Store',
    };

    const firstSellerVendorId = orderItems.find((it) => it.vendor)?.vendor;
    if (firstSellerVendorId) {
      const seller = await User.findById(firstSellerVendorId);
      if (seller) {
        const storeLoc = seller.storeLocation || {};
        pickupLocation = {
          lat: typeof storeLoc.lat === 'number' && !isNaN(storeLoc.lat) ? storeLoc.lat : 19.0760,
          lng: typeof storeLoc.lng === 'number' && !isNaN(storeLoc.lng) ? storeLoc.lng : 72.8777,
          address: storeLoc.address || seller.businessAddress || 'Store Pickup Center',
          storeName: seller.storeName || seller.name || 'Store',
        };
      }
    }

    // =========================================================================
    // 6. GROUP ITEMS BY VENDOR FOR MULTI-VENDOR SUB-ORDERS
    // =========================================================================
    const vendorMap = new Map();
    for (const it of orderItems) {
      const vId = it.vendor ? it.vendor.toString() : 'platform';
      if (!vendorMap.has(vId)) {
        vendorMap.set(vId, []);
      }
      vendorMap.get(vId).push(it);
    }
    const distinctVendorCount = vendorMap.size;
    const isMultiVendor = distinctVendorCount > 1;

    // Generated pickup & delivery OTPs
    const generatedPickupOtp = Math.floor(1000 + Math.random() * 9000).toString();
    const generatedDeliveryOtp = Math.floor(1000 + Math.random() * 9000).toString();

    // Calculate customer distance from pickup if available
    let resolvedCustomerDistanceKm = null;
    if (pickupLocation.lat && pickupLocation.lng && destCoords?.lat && destCoords?.lng) {
      resolvedCustomerDistanceKm = GeoService.calculateHaversineDistance(
        pickupLocation.lat,
        pickupLocation.lng,
        destCoords.lat,
        destCoords.lng
      );
    }

    const primaryVendorUser = orderItems.find((it) => it.vendor)?.vendor || null;

    // CREATE PARENT ORDER (Represents total checkout & customer invoice)
    const order = await Order.create({
      user: userId || null,
      orderId,
      invoiceNumber,
      vendor: isMultiVendor ? null : primaryVendorUser,
      items: orderItems,
      shippingAddress,
      pickupLocation,
      paymentMethod,
      paymentStatus: finalPaymentStatus,
      orderStatus: 'Confirmed',
      deliveryMode: orderDeliveryMode,
      subtotal,
      delivery,
      discount,
      total,
      transactionId: finalTransactionId,
      paymentGateway: isCOD
        ? 'CashOnDelivery'
        : paymentMethod === 'upi'
        ? 'UPI Direct'
        : paymentMethod === 'razorpay'
        ? 'Razorpay'
        : 'Credit/Debit Card',
      paymentVerifiedAt: finalPaymentStatus === 'Paid' ? new Date() : null,
      courierName: 'BlueDart Express',
      trackingNumber,
      estimatedDeliveryDate,
      statusHistory: initialHistory,
      shippingCoordinates: destCoords
        ? { lat: destCoords.lat, lng: destCoords.lng }
        : shippingAddress
        ? GeoService.geocodeLocation(shippingAddress)
        : { lat: null, lng: null },
      customerDistanceKm: resolvedCustomerDistanceKm,
      localDeliveryRadiusKm: 10,
      pickupOtp: generatedPickupOtp,
      deliveryOtp: generatedDeliveryOtp,
      hasSubOrders: isMultiVendor,
      isSubOrder: false,
    });

    // If customer purchased from multiple sellers, create separate seller-wise sub-orders
    const subOrders = [];
    if (isMultiVendor) {
      let subIdx = 1;
      for (const [vendorIdStr, vendorItemsList] of vendorMap.entries()) {
        const subOrderId = `${orderId}-V${subIdx}`;
        const subInvoiceNumber = `${invoiceNumber}-V${subIdx}`;
        const subSubtotal = vendorItemsList.reduce((acc, it) => acc + (it.price * it.quantity), 0);

        let subPickupLocation = { lat: null, lng: null, address: '', storeName: 'Seller Store' };
        let subSeller = null;
        if (vendorIdStr !== 'platform') {
          subSeller = await User.findById(vendorIdStr);
          if (subSeller) {
            const loc = subSeller.storeLocation || {};
            subPickupLocation = {
              lat: typeof loc.lat === 'number' && !isNaN(loc.lat) ? loc.lat : null,
              lng: typeof loc.lng === 'number' && !isNaN(loc.lng) ? loc.lng : null,
              address: loc.address || subSeller.businessAddress || 'Store Pickup Center',
              storeName: subSeller.storeName || subSeller.name || 'Store',
            };
          }
        }

        let subDistanceKm = null;
        let subDeliveryMode = 'local';
        if (subPickupLocation.lat && subPickupLocation.lng && destCoords?.lat && destCoords?.lng) {
          subDistanceKm = GeoService.calculateHaversineDistance(
            subPickupLocation.lat,
            subPickupLocation.lng,
            destCoords.lat,
            destCoords.lng
          );
          if (subDistanceKm > (subSeller?.defaultDeliveryRadiusKm || 10)) {
            subDeliveryMode = 'standard_courier';
          }
        }

        const subOrder = await Order.create({
          user: userId || null,
          orderId: subOrderId,
          parentOrderId: order.orderId,
          isSubOrder: true,
          hasSubOrders: false,
          vendor: vendorIdStr !== 'platform' ? vendorIdStr : null,
          invoiceNumber: subInvoiceNumber,
          items: vendorItemsList,
          shippingAddress,
          pickupLocation: subPickupLocation,
          paymentMethod,
          paymentStatus: finalPaymentStatus,
          orderStatus: 'Confirmed',
          deliveryMode: subDeliveryMode,
          deliveryStatus: 'Unassigned',
          subtotal: subSubtotal,
          delivery: 0,
          discount: 0,
          total: subSubtotal,
          transactionId: `${finalTransactionId}-V${subIdx}`,
          paymentGateway: order.paymentGateway,
          paymentVerifiedAt: order.paymentVerifiedAt,
          courierName: 'BlueDart Express',
          trackingNumber: `${trackingNumber}-V${subIdx}`,
          estimatedDeliveryDate,
          statusHistory: initialHistory,
          shippingCoordinates: order.shippingCoordinates,
          customerDistanceKm: subDistanceKm,
          localDeliveryRadiusKm: subSeller?.defaultDeliveryRadiusKm || 10,
          pickupOtp: Math.floor(1000 + Math.random() * 9000).toString(),
          deliveryOtp: Math.floor(1000 + Math.random() * 9000).toString(),
        });

        subOrders.push(subOrder);
        subIdx++;
      }
    }

    // =========================================================================
    // 6. RECORD VERIFIED PAYMENT TRANSACTION
    // =========================================================================
    try {
      await Payment.create({
        order: order._id,
        user: userId || null,
        transactionId: finalTransactionId,
        amount: order.total,
        currency: 'INR',
        paymentMethod: order.paymentMethod,
        status: isCOD ? 'pending' : 'success',
        details: paymentDetails || {},
      });
    } catch (payLogErr) {
      console.warn('Payment record save warning:', payLogErr.message);
    }

    // =========================================================================
    // 7. ATOMICAL INVENTORY DECREMENT
    // =========================================================================
    for (const item of orderItems) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { stock: -item.quantity },
      });
    }

    // =========================================================================
    // 8. CLEAR USER'S PURCHASED CART ITEMS
    // =========================================================================
    if (userId) {
      try {
        await Cart.findOneAndUpdate({ user: userId }, { $set: { items: [] } });
      } catch (cartErr) {
        console.warn('Cart clearance notice:', cartErr.message);
      }
    }

    // =========================================================================
    // 9. MULTI-VENDOR & ADMIN NOTIFICATIONS (Guaranteed Non-duplicate)
    // =========================================================================
    // A. Notify Admin
    try {
      await AdminNotification.create({
        title: 'New Paid Order Placed 🛍️',
        message: `Order #${order.orderId} for ₹${order.total} (${order.paymentMethod.toUpperCase()}) placed by ${order.shippingAddress.fullName}.`,
        type: 'NEW_ORDER',
        severity: 'info',
        link: `/admin/orders?search=${order.orderId}`,
      });
    } catch (adminNotifErr) {
      console.warn('Admin notification notice:', adminNotifErr.message);
    }

    // B. Split and Notify Relevant Sellers (Each seller receives alert for their items only)
    try {
      const vendorIds = [
        ...new Set(order.items.map((it) => it.vendor?.toString()).filter(Boolean)),
      ];

      for (const vendorId of vendorIds) {
        const sellerItems = order.items.filter((it) => it.vendor?.toString() === vendorId);
        const sellerSubtotal = sellerItems.reduce((acc, it) => acc + it.price * it.quantity, 0);

        await VendorNotification.create({
          recipient: vendorId,
          title: 'New Paid Order Received! 📦',
          message: `Order #${order.orderId} containing ${sellerItems.length} product(s) from your store (₹${sellerSubtotal}) has been verified and confirmed.`,
          type: 'NEW_ORDER',
          orderId: order.orderId,
          amount: sellerSubtotal,
          link: `/vendor/orders?id=${order.orderId}`,
        });
      }
    } catch (vendorNotifErr) {
      console.warn('Vendor notification notice:', vendorNotifErr.message);
    }

    // C. Dispatch Customer Email / Console Audit
    try {
      await NotificationService.sendOrderConfirmation(order, user);
    } catch (notifyErr) {
      console.warn('Order confirmation dispatch notice:', notifyErr.message);
    }

    
    // D. Driver dispatch is NOT triggered prematurely at checkout.
    // In accordance with business rules, driver dispatch is triggered when the seller
    // marks the order as "Packed / Ready for Driver Pickup" in the Seller Central portal.

    return {
      order,
      subOrders: subOrders.length > 0 ? subOrders : undefined,
      isDuplicate: false,
    };
  }

  /**
   * Backward-compatible createOrder wrapper
   */
  static async createOrder(params) {
    const res = await this.verifyPaymentAndCreateOrder(params);
    return res.order;
  }
}

module.exports = CheckoutService;
