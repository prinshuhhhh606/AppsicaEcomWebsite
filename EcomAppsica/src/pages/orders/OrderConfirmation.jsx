import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  Check,
  Package,
  Truck,
  ArrowRight,
  ShoppingBag,
  MapPin,
  Calendar,
  CreditCard,
  CircleAlert
} from 'lucide-react';
import { orderService } from '../../services/orderService';
import { formatPrice } from '../../utils/formatPrice';

export default function OrderConfirmation() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id || id === 'placed') {
      setLoading(false);
      return;
    }

    let active = true;
    setLoading(true);

    orderService
      .getById(id)
      .then((res) => {
        if (!active) return;
        const fetched = res?.order || res?.data?.order || res;
        setOrder(fetched);
      })
      .catch((err) => {
        if (!active) return;
        setError(err?.response?.data?.message || err?.message || 'Could not load order confirmation.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [id]);

  if (loading) {
    return (
      <div className="container store-page" style={{ padding: '4rem 1rem', textAlign: 'center' }}>
        <div
          style={{
            width: 44,
            height: 44,
            border: '3px solid rgba(99,102,241,0.2)',
            borderTopColor: '#6366f1',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 1rem',
          }}
        />
        <h2>Confirming your order details…</h2>
        <p style={{ color: '#94a3b8' }}>Retrieving order #{id} from database</p>
      </div>
    );
  }

  const orderId = order?.orderId || id;
  const isPaid = order?.paymentStatus === 'Paid';
  const isPending = order?.paymentStatus === 'Pending';

  return (
    <div className="container store-page" style={{ maxWidth: 740, margin: '0 auto', paddingBottom: '5rem' }}>
      <div
        style={{
          background: 'rgba(18, 20, 29, 0.9)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: 20,
          padding: '2.75rem 2rem',
          textAlign: 'center',
          boxShadow: '0 10px 40px rgba(0, 0, 0, 0.4)',
        }}
      >
        {/* Animated Checkmark Badge */}
        <div
          style={{
            width: 72,
            height: 72,
            borderRadius: '50%',
            background: 'rgba(16, 185, 129, 0.15)',
            border: '2px solid rgba(16, 185, 129, 0.4)',
            color: '#10b981',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1.5rem',
            boxShadow: '0 0 30px rgba(16, 185, 129, 0.25)',
          }}
        >
          <Check size={40} strokeWidth={2.5} />
        </div>

        <span className="eyebrow" style={{ color: '#10b981', letterSpacing: '0.08em' }}>
          OFFICIAL ORDER CONFIRMATION
        </span>
        <h1 style={{ fontSize: '2rem', color: '#f8fafc', margin: '0.25rem 0 0.5rem' }}>
          Order Confirmed! Good choice.
        </h1>
        <p style={{ color: '#94a3b8', fontSize: '0.95rem', maxWidth: 480, margin: '0 auto 2rem' }}>
          Thank you for shopping with Appsica. Your order has been recorded into the store database and is now being prepared for fulfillment.
        </p>

        {/* Order Details Receipt Box */}
        <div
          style={{
            background: 'rgba(255, 255, 255, 0.025)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: 14,
            padding: '1.75rem',
            textAlign: 'left',
            marginBottom: '2rem',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.65rem 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            <span style={{ color: '#94a3b8' }}>Order ID</span>
            <span style={{ color: '#818cf8', fontWeight: 'bold' }}>#{orderId}</span>
          </div>

          {order?.invoiceNumber && (
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.65rem 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <span style={{ color: '#94a3b8' }}>Invoice Reference</span>
              <span style={{ color: '#f1f5f9', fontFamily: 'monospace' }}>{order.invoiceNumber}</span>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.65rem 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            <span style={{ color: '#94a3b8' }}>Order Status</span>
            <span style={{ color: '#10b981', fontWeight: 600 }}>{order?.orderStatus || 'Confirmed'}</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.65rem 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            <span style={{ color: '#94a3b8' }}>Payment Status</span>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                padding: '0.2rem 0.6rem',
                borderRadius: 4,
                fontWeight: 600,
                fontSize: '0.8rem',
                background: isPaid ? 'rgba(16,185,129,0.15)' : 'rgba(245,158,11,0.15)',
                color: isPaid ? '#34d399' : '#fbbf24',
              }}
            >
              <Check size={12} /> {order?.paymentStatus || 'Pending'} ({order?.paymentMethod?.toUpperCase() || 'COD'})
            </span>
          </div>

          {order?.courierName && (
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.65rem 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <span style={{ color: '#94a3b8' }}>Assigned Logistics</span>
              <span style={{ color: '#38bdf8' }}>
                <Truck size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} />
                {order.courierName} ({order.trackingNumber || 'Pending AWB'})
              </span>
            </div>
          )}

          {/* Itemized Products */}
          {order?.items && order.items.length > 0 && (
            <div style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              <span style={{ fontSize: '0.85rem', color: '#94a3b8', textTransform: 'uppercase', display: 'block', marginBottom: '0.75rem' }}>
                Ordered Products ({order.items.length})
              </span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                {order.items.map((item, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.6rem 0.8rem',
                      background: 'rgba(255,255,255,0.02)',
                      borderRadius: 8,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      {item.image ? (
                        <img src={item.image} alt={item.name} style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 6 }} />
                      ) : (
                        <div style={{ width: 40, height: 40, borderRadius: 6, background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <ShoppingBag size={18} color="#94a3b8" />
                        </div>
                      )}
                      <div>
                        <div style={{ color: '#f8fafc', fontSize: '0.9rem', fontWeight: 500 }}>{item.name}</div>
                        <small style={{ color: '#94a3b8' }}>Qty: {item.quantity} × {formatPrice(item.price)}</small>
                      </div>
                    </div>
                    <strong style={{ color: '#f8fafc' }}>{formatPrice(item.price * item.quantity)}</strong>
                  </div>
                ))}
              </div>

              {/* Price Breakdown */}
              <div style={{ marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.35rem 0', color: '#94a3b8' }}>
                  <span>Subtotal</span>
                  <span>{formatPrice(order.subtotal)}</span>
                </div>
                {order.discount > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.35rem 0', color: '#34d399' }}>
                    <span>Discount</span>
                    <span>-{formatPrice(order.discount)}</span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.35rem 0', color: '#94a3b8' }}>
                  <span>Delivery Charges</span>
                  <span>{order.delivery === 0 ? 'Free' : formatPrice(order.delivery)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem 0 0', borderTop: '1px dashed rgba(255,255,255,0.15)', fontSize: '1.15rem', fontWeight: 'bold' }}>
                  <span>Total Amount</span>
                  <span style={{ color: '#818cf8' }}>{formatPrice(order.total)}</span>
                </div>
              </div>
            </div>
          )}

          {/* Shipping Address */}
          {order?.shippingAddress && (
            <div style={{ background: 'rgba(255,255,255,0.02)', borderRadius: 10, padding: '1rem', marginTop: '1.25rem', border: '1px solid rgba(255,255,255,0.05)' }}>
              <b style={{ display: 'block', fontSize: '0.82rem', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '0.35rem' }}>
                <MapPin size={13} style={{ verticalAlign: 'middle', marginRight: 4 }} /> Delivery Destination
              </b>
              <p style={{ margin: 0, color: '#cbd5e1', fontSize: '0.9rem', lineHeight: 1.4 }}>
                <strong>{order.shippingAddress.fullName}</strong> ({order.shippingAddress.phone})<br />
                {order.shippingAddress.addressLine}, {order.shippingAddress.city}, {order.shippingAddress.state} - {order.shippingAddress.pincode}
              </p>
            </div>
          )}
        </div>

        {/* 3 Required Action Buttons */}
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link to={`/track-order/${orderId}`} className="btn btn-primary btn-lg">
            <Truck size={18} /> Track Order
          </Link>

          <Link to="/my-orders" className="btn btn-secondary btn-lg">
            <Package size={18} /> View My Orders
          </Link>

          <Link to="/products" className="btn btn-secondary btn-lg">
            Continue Shopping <ArrowRight size={17} />
          </Link>
        </div>
      </div>
    </div>
  );
}
