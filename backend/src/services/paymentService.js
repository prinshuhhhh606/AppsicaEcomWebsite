const Payment = require('../models/payment');
const Order = require('../models/order');

class PaymentService {
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
      // Create payment log for record
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
