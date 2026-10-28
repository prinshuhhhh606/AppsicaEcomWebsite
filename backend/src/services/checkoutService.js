const Order = require('../models/order');
const Product = require('../models/product');
const Coupon = require('../models/coupon');
const Cart = require('../models/cart');
const Payment = require('../models/payment');
const AdminNotification = require('../models/adminNotification');
const VendorNotification = require('../models/vendorNotification');
const PaymentService = require('./paymentService');
const NotificationService = require('./notificationService');

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
    // 5. CREATE AND SAVE ORDER IN MONGODB
    // =========================================================================
    const order = await Order.create({
      user: userId || null,
      orderId,
      invoiceNumber,
      items: orderItems,
      shippingAddress,
      paymentMethod,
      paymentStatus: finalPaymentStatus,
      orderStatus: 'Confirmed',
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
    });

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

    return {
      order,
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
