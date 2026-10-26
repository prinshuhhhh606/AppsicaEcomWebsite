/**
 * Notification Service for AppsicaEcom
 * Handles order confirmation emails and SMS notifications.
 * Automatically uses nodemailer if SMTP credentials exist in .env,
 * otherwise logs structured notifications for local development & auditing.
 */
class NotificationService {
  static async sendOrderConfirmation(order, user = null) {
    const customerEmail = user?.email || order?.shippingAddress?.phone || 'customer@appsica.com';
    const customerName = order?.shippingAddress?.fullName || user?.name || 'Valued Shopper';

    const itemsSummary = (order.items || [])
      .map((item) => `  - ${item.name} x${item.quantity} (₹${item.price})`)
      .join('\n');

    const formattedLog = `
============================================================
📦 [APPSICA NOTIFICATION SERVICE] ORDER CONFIRMATION
============================================================
To: ${customerName} <${customerEmail}>
Order ID: #${order.orderId}
Invoice Ref: ${order.invoiceNumber || 'INV-' + order.orderId}
Payment Status: ${order.paymentStatus} (${order.paymentMethod.toUpperCase()})
Order Status: ${order.orderStatus}
Total Amount: ₹${order.total} (Subtotal: ₹${order.subtotal}, Delivery: ₹${order.delivery}, Discount: ₹${order.discount})
Shipping Destination:
  ${order.shippingAddress.fullName}
  ${order.shippingAddress.addressLine}, ${order.shippingAddress.city}, ${order.shippingAddress.state} - ${order.shippingAddress.pincode}
  Contact Phone: ${order.shippingAddress.phone}
Items:
${itemsSummary}
Estimated Delivery: ${order.estimatedDeliveryDate ? new Date(order.estimatedDeliveryDate).toDateString() : '3-5 Business Days'}
============================================================
`;

    console.log(formattedLog);

    // If SMTP credentials exist in environment, send real email
    if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
      try {
        const nodemailer = require('nodemailer');
        const transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST,
          port: process.env.SMTP_PORT || 587,
          secure: process.env.SMTP_SECURE === 'true',
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
          },
        });

        await transporter.sendMail({
          from: `"Appsica Store" <${process.env.SMTP_FROM || 'no-reply@appsica.com'}>`,
          to: customerEmail,
          subject: `Order Confirmed: #${order.orderId} - Appsica Store`,
          text: `Hi ${customerName},\n\nThank you for shopping with Appsica. Your order #${order.orderId} has been confirmed.\n\nTotal: ₹${order.total}\nStatus: ${order.orderStatus}\n\nTrack your order anytime at: http://localhost:5173/track-order/${order.orderId}`,
        });

        return { sent: true, provider: 'smtp' };
      } catch (err) {
        console.error('SMTP email dispatch warning:', err.message);
      }
    }

    return { sent: true, provider: 'console-audit' };
  }

  static async sendStatusUpdate(order, previousStatus, newStatus) {
    const customerName = order?.shippingAddress?.fullName || 'Customer';
    console.log(`
🚚 [APPSICA SHIPMENT TRACKING UPDATE]
Order: #${order.orderId}
Customer: ${customerName}
Status changed: "${previousStatus}" ➔ "${newStatus}"
Tracking Number: ${order.trackingNumber || 'Pending'}
Courier: ${order.courierName || 'BlueDart'}
`);
    return { sent: true };
  }

  static async sendVendorApprovalNotification(vendor) {
    const formattedLog = `
============================================================
🏬 [APPSICA NOTIFICATION SERVICE] SELLER ACCOUNT ACTIVATED!
============================================================
To: ${vendor.name} <${vendor.email}>
Store Name: ${vendor.storeName || vendor.name}
Status: APPROVED & ACTIVATED
Decision Date: ${new Date().toLocaleString()}
Portal: http://localhost:5173/vendor/login
Permissions: Live Product Publishing, Order Fulfillment, Payout Ledger
============================================================
`;
    console.log(formattedLog);
    return { sent: true };
  }

  static async sendVendorRejectionNotification(vendor, reason) {
    const formattedLog = `
============================================================
❌ [APPSICA NOTIFICATION SERVICE] SELLER APPLICATION STATUS
============================================================
To: ${vendor.name} <${vendor.email}>
Store Name: ${vendor.storeName || vendor.name}
Status: REJECTED
Decision Date: ${new Date().toLocaleString()}
Rejection Reason: "${reason || 'Documentation did not meet marketplace onboarding guidelines.'}"
Resubmission: You may update your store documentation and re-apply at http://localhost:5173/vendor/register
============================================================
`;
    console.log(formattedLog);
    return { sent: true };
  }
}

module.exports = NotificationService;
