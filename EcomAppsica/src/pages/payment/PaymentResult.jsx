import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  Check,
  Package,
  ArrowRight,
  ShieldCheck,
  CreditCard,
  MapPin,
  Calendar,
  Truck,
  CircleAlert,
  RotateCcw,
  ShoppingBag
} from 'lucide-react';
import { orderService } from '../../services/orderService';
import { formatPrice } from '../../utils/formatPrice';
import './PaymentResult.css';

export default function PaymentResult() {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('orderId') || '';

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Always fetch real order status from backend database
  useEffect(() => {
    if (!orderId) {
      setError('No order identifier provided.');
      setLoading(false);
      return;
    }

    let active = true;
    setLoading(true);

    orderService
      .getById(orderId)
      .then((res) => {
        if (!active) return;
        const fetchedOrder = res?.order || res?.data?.order || res;
        if (!fetchedOrder || !fetchedOrder.orderId) {
          setError('Order details could not be verified on the server.');
        } else {
          setOrder(fetchedOrder);
        }
      })
      .catch((err) => {
        if (!active) return;
        setError(err?.response?.data?.message || err?.message || 'Order verification could not be completed.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [orderId]);

  if (loading) {
    return (
      <div className="container store-page payment-result-page">
        <div className="payment-success-card" style={{ padding: '4rem 2rem' }}>
          <div
            style={{
              width: 48,
              height: 48,
              border: '4px solid rgba(99,102,241,0.2)',
              borderTopColor: '#6366f1',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 1.5rem',
            }}
          />
          <h2>Verifying payment with bank servers…</h2>
          <p style={{ color: '#94a3b8', fontSize: '0.95rem' }}>
            Fetching verified transaction records directly from Appsica store database.
          </p>
        </div>
      </div>
    );
  }

  // Error or Not Found - Never display a fake success
  if (error || !order) {
    return (
      <div className="container store-page payment-result-page">
        <div className="payment-success-card">
          <div
            style={{
              width: 68,
              height: 68,
              borderRadius: '50%',
              background: 'rgba(239,68,68,0.15)',
              border: '2px solid rgba(239,68,68,0.3)',
              color: '#ef4444',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.5rem',
            }}
          >
            <CircleAlert size={36} />
          </div>
          <h1>Transaction Verification Failed</h1>
          <p className="subtitle">
            {error || 'No verified order record was found on the server for this transaction.'}
          </p>
          <div className="payment-actions">
            <Link to="/cart" className="btn btn-primary">
              Return to Cart
            </Link>
            <Link to="/products" className="btn btn-secondary">
              Browse Store
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Payment Status: Strictly from Backend
  const isPaid = order.paymentStatus === 'Paid';
  const isPending = order.paymentStatus === 'Pending';
  const isFailed = order.paymentStatus === 'Failed';
  const isCOD = order.paymentMethod === 'cod';

  const orderNumber = order.orderId;
  const invoiceNumber = order.invoiceNumber || `INV-${orderNumber}`;
  const txnId = order.transactionId || (isCOD ? `COD-${orderNumber}` : `TXN-${orderNumber}`);
  const estDate = order.estimatedDeliveryDate
    ? new Date(order.estimatedDeliveryDate).toLocaleDateString('en-IN', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : 'Within 3-5 Business Days';

  return (
    <div className="container store-page payment-result-page">
      <section className="payment-success-card" style={{ maxWidth: 740 }}>
        {/* Animated Status Badge */}
        {isFailed ? (
          <div
            className="success-badge-icon"
            style={{
              background: 'rgba(239,68,68,0.15)',
              borderColor: 'rgba(239,68,68,0.4)',
              color: '#ef4444',
              boxShadow: '0 0 30px rgba(239,68,68,0.25)',
            }}
          >
            <CircleAlert size={40} strokeWidth={2.5} />
          </div>
        ) : (
          <div className="success-badge-icon">
            <Check size={40} strokeWidth={2.5} />
          </div>
        )}

        <span
          className="eyebrow"
          style={{
            color: isFailed ? '#ef4444' : isPending ? '#fbbf24' : '#10b981',
            letterSpacing: '0.08em',
          }}
        >
          {isFailed
            ? 'PAYMENT NOT COMPLETED'
            : isCOD
            ? 'ORDER PLACED · CASH ON DELIVERY'
            : 'VERIFIED & CONFIRMED BY APPSICA BACKEND'}
        </span>

        <h1>
          {isFailed
            ? 'Payment Failed'
            : isCOD
            ? 'Order Confirmed!'
            : 'Payment Successful & Order Confirmed!'}
        </h1>

        <p className="subtitle">
          {isFailed
            ? 'Your payment transaction was declined or interrupted. Please try again with another payment method.'
            : isCOD
            ? `Your order #${orderNumber} has been recorded in the database. Please keep exact cash ready upon delivery.`
            : `Your payment was verified by banking gateway and order #${orderNumber} has been confirmed.`}
        </p>

        {/* Transaction & Order Summary Card */}
        <div className="txn-receipt-box">
          <div className="txn-receipt-row">
            <span className="label">Order ID</span>
            <span className="value">
              <code style={{ fontSize: '0.95rem', color: '#818cf8' }}>#{orderNumber}</code>
            </span>
          </div>

          <div className="txn-receipt-row">
            <span className="label">Invoice Reference</span>
            <span className="value">
              <code>{invoiceNumber}</code>
            </span>
          </div>

          <div className="txn-receipt-row">
            <span className="label">Payment Status</span>
            <span className="value">
              <span
                className="receipt-paid-badge"
                style={{
                  background: isPaid
                    ? 'rgba(16,185,129,0.15)'
                    : isPending
                    ? 'rgba(245,158,11,0.15)'
                    : 'rgba(239,68,68,0.15)',
                  color: isPaid ? '#34d399' : isPending ? '#fbbf24' : '#ef4444',
                }}
              >
                {isPaid ? <Check size={14} /> : <Calendar size={14} />} {order.paymentStatus}
              </span>
            </span>
          </div>

          <div className="txn-receipt-row">
            <span className="label">Payment Method</span>
            <span className="value">
              {order.paymentMethod === 'cod'
                ? 'Cash on Delivery (COD)'
                : order.paymentMethod === 'upi'
                ? 'UPI Direct Transfer'
                : order.paymentMethod === 'razorpay'
                ? 'Razorpay Secure'
                : 'Credit / Debit Card'}
            </span>
          </div>

          <div className="txn-receipt-row">
            <span className="label">Transaction Reference</span>
            <span className="value">
              <small>{txnId}</small>
            </span>
          </div>

          <div className="txn-receipt-row">
            <span className="label">Estimated Delivery</span>
            <span className="value" style={{ color: '#38bdf8' }}>
              <Truck size={15} style={{ verticalAlign: 'middle', marginRight: 4 }} /> {estDate}
            </span>
          </div>

          {/* Ordered Products Itemized List */}
          <div style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <span style={{ fontSize: '0.85rem', color: '#94a3b8', textTransform: 'uppercase', display: 'block', marginBottom: '0.75rem' }}>
              Ordered Items ({order.items?.length || 0})
            </span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {order.items?.map((item, idx) => (
                <div
                  key={item._id || idx}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '1rem',
                    background: 'rgba(255,255,255,0.02)',
                    padding: '0.65rem 0.85rem',
                    borderRadius: 8,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    {item.image ? (
                      <img
                        src={item.image}
                        alt={item.name}
                        style={{ width: 44, height: 44, objectFit: 'cover', borderRadius: 6 }}
                      />
                    ) : (
                      <div
                        style={{
                          width: 44,
                          height: 44,
                          borderRadius: 6,
                          background: 'rgba(255,255,255,0.05)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <ShoppingBag size={20} color="#94a3b8" />
                      </div>
                    )}
                    <div>
                      <h4 style={{ margin: 0, fontSize: '0.9rem', color: '#f1f5f9' }}>{item.name}</h4>
                      <small style={{ color: '#94a3b8' }}>
                        Qty: {item.quantity} × {formatPrice(item.price)}
                      </small>
                    </div>
                  </div>
                  <strong style={{ color: '#f8fafc', fontSize: '0.92rem' }}>
                    {formatPrice(item.price * item.quantity)}
                  </strong>
                </div>
              ))}
            </div>
          </div>

          {/* Cost Breakdown */}
          <div style={{ marginTop: '1.25rem', paddingTop: '0.75rem', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="txn-receipt-row">
              <span className="label">Subtotal</span>
              <span className="value">{formatPrice(order.subtotal)}</span>
            </div>
            {order.discount > 0 && (
              <div className="txn-receipt-row">
                <span className="label" style={{ color: '#34d399' }}>Discount</span>
                <span className="value" style={{ color: '#34d399' }}>-{formatPrice(order.discount)}</span>
              </div>
            )}
            <div className="txn-receipt-row">
              <span className="label">Delivery Charges</span>
              <span className="value">{order.delivery === 0 ? 'Free' : formatPrice(order.delivery)}</span>
            </div>
            <div className="txn-receipt-row txn-total-row">
              <span className="label" style={{ fontSize: '1.05rem', color: '#f8fafc' }}>
                Total Paid Amount
              </span>
              <span className="value">{formatPrice(order.total)}</span>
            </div>
          </div>

          {/* Shipping Address */}
          {order.shippingAddress && (
            <div className="receipt-address-box">
              <b>
                <MapPin size={13} style={{ verticalAlign: 'middle', marginRight: 4 }} /> Delivery Destination
              </b>
              <p>
                <strong>{order.shippingAddress.fullName}</strong> ({order.shippingAddress.phone})<br />
                {order.shippingAddress.addressLine}, {order.shippingAddress.city}, {order.shippingAddress.state} -{' '}
                {order.shippingAddress.pincode}
              </p>
            </div>
          )}
        </div>

        {/* 3 Required Action Buttons */}
        <div className="payment-actions">
          <Link to={`/track-order/${order.orderId}`} className="btn btn-primary btn-lg">
            <Truck size={18} /> Track Order Progress
          </Link>

          <Link to="/my-orders" className="btn btn-secondary btn-lg">
            <Package size={18} /> View My Orders
          </Link>

          <Link to="/products" className="btn btn-secondary btn-lg">
            Continue Shopping <ArrowRight size={17} />
          </Link>
        </div>
      </section>
    </div>
  );
}
