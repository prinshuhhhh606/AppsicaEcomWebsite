const Payment = require('../models/payment');
const Order = require('../models/order');

class PaymentService {
  /**
   * Verify an online payment transaction server-side before order creation
   */
  static async verifyPayment({
    transactionId,
    paymentMethod = 'card',
    status = 'success',
    amount = 0,
    details = {},
  }) {
    // 1. If status is explicitly failed or declined
    if (status === 'failed' || status === 'failure' || status === 'declined') {
      return {
        verified: false,
        message: 'Payment verification failed: Transaction was declined or cancelled by the user/gateway.',
      };
    }

    // 2. Validate transaction reference for online payments
    if (!transactionId || typeof transactionId !== 'string' || !transactionId.trim()) {
      return {
        verified: false,
        message: 'Payment verification failed: Valid payment gateway transaction identifier is required.',
      };
    }

    // 3. Optional Razorpay HMAC signature check (if keys provided in environment)
    if (
      process.env.RAZORPAY_KEY_SECRET &&
      details?.razorpay_order_id &&
      details?.razorpay_payment_id &&
      details?.razorpay_signature
    ) {
      const crypto = require('crypto');
      const expectedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
        .update(`${details.razorpay_order_id}|${details.razorpay_payment_id}`)
        .digest('hex');

      if (expectedSignature !== details.razorpay_signature) {
        return {
          verified: false,
          message: 'Payment verification failed: Invalid Razorpay digital signature.',
        };
      }
    }

    return {
      verified: true,
      transactionId: transactionId.trim(),
      paymentMethod,
      amount,
      details,
    };
  }

  /**
   * Initiate payment for an existing order (backward-compatible)
   */
  static async initiate(orderId, userId = null) {
    const order = await Order.findOne({ $or: [{ _id: orderId }, { orderId }] });
    if (!order) {
      throw new Error('Order not found');
    }

    const transactionId = `TXN-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    const payment = await Payment.create({
      order: order._id,
      user: userId || order.user || null,
      transactionId,
      amount: order.total,
      currency: 'INR',
      paymentMethod: order.paymentMethod,
      status: 'pending',
    });

    return {
      paymentId: payment._id,
      transactionId,
      amount: order.total,
      currency: 'INR',
      orderId: order.orderId,
    };
  }

  /**
   * Post-order verification webhook / callback (backward-compatible)
   */
  static async verify({ transactionId, paymentId, orderId, status = 'success', details = {} }) {
    let order = null;
    if (orderId) {
      order = await Order.findOne({ $or: [{ _id: orderId }, { orderId }] });
    }

    let query = null;
    if (transactionId) query = { transactionId };
    else if (paymentId) query = { _id: paymentId };
    else if (order) query = { order: order._id };

    let payment = query ? await Payment.findOne(query) : null;

    if (!payment && order) {
      payment = await Payment.create({
        order: order._id,
        user: order.user || null,
        transactionId: transactionId || order.transactionId || `TXN-${order.orderId}`,
        amount: order.total,
        currency: 'INR',
        paymentMethod: order.paymentMethod,
        status: status === 'success' ? 'success' : 'failed',
        details,
      });
    } else if (payment) {
      payment.status = status === 'success' ? 'success' : 'failed';
      payment.details = details;
      if (transactionId) payment.transactionId = transactionId;
      await payment.save();
    }

    if (order || (payment && payment.order)) {
      const targetOrderId = order ? order._id : payment.order;
      const isSuccess = status === 'success';

      const updatedOrder = await Order.findByIdAndUpdate(
        targetOrderId,
        {
          paymentStatus: isSuccess ? 'Paid' : 'Failed',
          orderStatus: isSuccess ? 'Confirmed' : 'Cancelled',
          paymentVerifiedAt: isSuccess ? new Date() : null,
          transactionId: transactionId || (payment ? payment.transactionId : `TXN-${Date.now()}`),
        },
        { new: true }
      );

      return {
        payment,
        order: updatedOrder,
        verified: isSuccess,
      };
    }

    return { payment, verified: status === 'success' };
  }

  /**
   * Refund an order payment (Admin)
   */
  static async refund(paymentId) {
    const payment = await Payment.findById(paymentId);
    if (!payment) {
      throw new Error('Payment not found');
    }

    payment.status = 'refunded';
    await payment.save();

    await Order.findByIdAndUpdate(payment.order, {
      paymentStatus: 'Refunded',
      orderStatus: 'Cancelled',
      cancelReason: 'Payment refunded by administrator',
    });

    return payment;
  }
}

module.exports = PaymentService;
