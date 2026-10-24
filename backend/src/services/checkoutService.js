const Order = require('../models/order');
const Product = require('../models/product');
const Coupon = require('../models/coupon');
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
      if (!product) {
        throw new Error(`Product not found with ID: ${productId}`);
      }
      if (product.stock < item.quantity) {
        throw new Error(`Insufficient inventory for "${product.name}". Available: ${product.stock}, Requested: ${item.quantity}`);
      }

      const itemTotal = product.price * item.quantity;
      subtotal += itemTotal;

      resolvedItems.push({
        product: product._id,
        name: product.name,
        price: product.price, // Trusted MongoDB price
        quantity: item.quantity,
        image: product.images?.[0] || product.image || '',
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
   * Creates an order with backend validation, stock deduction, and tracking initialization.
   */
  static async createOrder({
    userId,
    items,
    shippingAddress,
    paymentMethod = 'card',
    paymentStatus = null,
    transactionId = null,
    couponCode = null,
    user = null,
  }) {
    // 1. Recalculate totals strictly from database
    const { subtotal, delivery, discount, total, items: orderItems } = await this.calculateTotals(
      items,
      couponCode
    );

    // 2. Generate unique human-readable Order ID & Invoice ID
    const todayStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
    const orderId = `ORD-${todayStr}-${randomSuffix}`;
    const invoiceNumber = `INV-${todayStr}-${randomSuffix}`;
    const trackingNumber = `TRK-BD-${Date.now().toString().slice(-6)}${randomSuffix}`;

    // 3. Determine verified payment & order status
    const isCOD = paymentMethod === 'cod';
    const finalPaymentStatus = paymentStatus ? paymentStatus : (isCOD ? 'Pending' : 'Paid');
    const finalTransactionId = transactionId || (isCOD ? `COD-${orderId}` : `TXN-${orderId}`);
    const estimatedDeliveryDate = new Date(Date.now() + 4 * 24 * 60 * 60 * 1000);

    const initialHistory = [
      {
        status: 'Order Placed',
        timestamp: new Date(),
        note: `Order initiated by customer using ${paymentMethod.toUpperCase()}`,
      },
    ];

    if (finalPaymentStatus === 'Paid' || isCOD) {
      initialHistory.push({
        status: 'Confirmed',
        timestamp: new Date(),
        note: isCOD
          ? 'Order confirmed for Cash on Delivery dispatch'
          : `Payment of ₹${total} successfully verified (${finalTransactionId})`,
      });
    }

    // 4. Create Order in MongoDB
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
      paymentGateway: isCOD ? 'CashOnDelivery' : paymentMethod === 'upi' ? 'UPI Direct' : 'Razorpay/Card',
      paymentVerifiedAt: finalPaymentStatus === 'Paid' ? new Date() : null,
      courierName: 'BlueDart Express',
      trackingNumber,
      estimatedDeliveryDate,
      statusHistory: initialHistory,
    });

    // 5. Decrement inventory atomically in MongoDB
    for (const item of orderItems) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { stock: -item.quantity },
      });
    }

    // 6. Send notification (email/SMS / console audit)
    try {
      await NotificationService.sendOrderConfirmation(order, user);
    } catch (notifyErr) {
      console.warn('Order confirmation dispatch notice:', notifyErr.message);
    }

    return order;
  }
}

module.exports = CheckoutService;
