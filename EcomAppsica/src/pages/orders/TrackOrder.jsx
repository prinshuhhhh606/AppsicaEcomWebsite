import React, { useState, useEffect, useContext } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ShoppingBag,
  CheckCircle,
  Package,
  Layers,
  Truck,
  Compass,
  CheckCheck,
  RefreshCw,
  ArrowLeft,
  CircleAlert,
  MapPin,
  Calendar,
  XCircle,
  RotateCcw,
  ShieldCheck,
  Clock,
  Bike,
  KeyRound,
  Phone,
} from 'lucide-react';
import { orderService } from '../../services/orderService';
import { NotificationContext } from '../../context/NotificationContextValue';
import { formatPrice } from '../../utils/formatPrice';
import './TrackOrder.css';

const ICONS_MAP = {
  'Order Placed': ShoppingBag,
  'Confirmed': CheckCircle,
  'Processing': Package,
  'Packed': Layers,
  'Ready to Ship': Layers,
  'Ready for Pickup': Layers,
  'Shipped': Truck,
  'Shipped / Picked Up': Truck,
  'Picked Up': Truck,
  'Out for Delivery': Compass,
  'Delivered': CheckCheck,
};

export default function TrackOrder() {
  const { orderId } = useParams();
  const { toast } = useContext(NotificationContext);

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [cancelModal, setCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelBusy, setCancelBusy] = useState(false);

  const fetchTracking = async (isManual = false, isSilent = false) => {
    if (isManual) setRefreshing(true);
    else if (!isSilent) setLoading(true);
    if (!isSilent) setError('');

    try {
      const res = await orderService.trackOrder(orderId);
      setData(res);
      if (isManual) toast.success('Tracking status refreshed from backend database.');
    } catch (err) {
      if (!isSilent) {
        setError(err?.response?.data?.message || err?.message || 'Could not retrieve tracking details.');
      }
    } finally {
      if (!isSilent) setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchTracking();

    // Live auto-polling every 6 seconds to update shipment status automatically
    const interval = setInterval(() => {
      fetchTracking(false, true);
    }, 6000);

    return () => clearInterval(interval);
  }, [orderId]);

  const handleCancelOrder = async (e) => {
    e.preventDefault();
    if (!cancelReason.trim()) return;
    setCancelBusy(true);

    try {
      await orderService.cancelOrder(orderId, cancelReason);
      toast.success('Order cancelled successfully.');
      setCancelModal(false);
      fetchTracking();
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.message || 'Failed to cancel order.');
    } finally {
      setCancelBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="container store-page track-order-page">
        <div style={{ textAlign: 'center', padding: '5rem 0' }}>
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
          <h2>Loading live order milestones…</h2>
          <p style={{ color: '#94a3b8' }}>Querying shipment updates for #{orderId}</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="container store-page track-order-page">
        <div className="track-card" style={{ textAlign: 'center', padding: '3.5rem 2rem' }}>
          <CircleAlert size={48} color="#ef4444" style={{ margin: '0 auto 1rem' }} />
          <h2>Order Not Found</h2>
          <p style={{ color: '#94a3b8', marginBottom: '1.5rem' }}>
            {error || 'We could not locate this order record in the database.'}
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
            <Link to="/my-orders" className="btn btn-primary">
              View My Orders
            </Link>
            <Link to="/products" className="btn btn-secondary">
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const {
    status,
    paymentStatus,
    paymentMethod,
    courierName,
    trackingNumber,
    estimatedDeliveryDate,
    shippingAddress,
    isCancelled,
    isReturned,
    cancelReason: serverCancelReason,
    milestones = [],
    history = [],
    order,
  } = data;

  const cancellable = ['Order Placed', 'Confirmed', 'Processing'].includes(status);
  const completedCount = milestones.filter((m) => m.completed).length;
  const progressPercent = Math.max(0, Math.min(100, ((completedCount - 1) / (milestones.length - 1)) * 100));

  const estFormatted = estimatedDeliveryDate
    ? new Date(estimatedDeliveryDate).toLocaleDateString('en-IN', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : 'Within 3-5 Business Days';

  return (
    <div className="container store-page track-order-page">
      <div className="breadcrumb" style={{ marginBottom: '1.5rem' }}>
        <Link to="/my-orders">
          <ArrowLeft size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} /> Back to My Orders
        </Link>
      </div>

      <div className="track-order-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <span className="eyebrow" style={{ color: '#818cf8', margin: 0 }}>
              LIVE SHIPMENT TRACKING
            </span>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                background: 'rgba(16, 185, 129, 0.15)',
                color: '#34d399',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                padding: '2px 8px',
                borderRadius: 999,
                fontSize: '0.72rem',
                fontWeight: 600,
              }}
            >
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  backgroundColor: '#10b981',
                  boxShadow: '0 0 6px #10b981',
                }}
              />
              Live Sync Active
            </span>
          </div>
          <h1 style={{ margin: '0.25rem 0' }}>Track Order #{orderId}</h1>
          <p style={{ color: '#94a3b8', margin: 0 }}>
            Real-time status updates powered by Appsica Logistics Network
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <button
            className="btn btn-secondary"
            onClick={() => fetchTracking(true)}
            disabled={refreshing}
            title="Refresh latest status from server"
          >
            <RefreshCw size={16} className={refreshing ? 'spin-icon' : ''} />
            {refreshing ? 'Updating…' : 'Refresh Status'}
          </button>

          {cancellable && (
            <button
              className="btn btn-danger"
              style={{ background: 'rgba(239,68,68,0.15)', color: '#ef4444', borderColor: 'rgba(239,68,68,0.3)' }}
              onClick={() => setCancelModal(true)}
            >
              Cancel Order
            </button>
          )}
        </div>
      </div>

      {/* Cancelled Banner */}
      {isCancelled && (
        <div
          style={{
            background: 'rgba(239,68,68,0.12)',
            border: '1px solid rgba(239,68,68,0.3)',
            borderRadius: 12,
            padding: '1.25rem 1.5rem',
            marginBottom: '1.75rem',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
          }}
        >
          <XCircle size={28} color="#ef4444" style={{ flexShrink: 0 }} />
          <div>
            <h4 style={{ margin: 0, color: '#f87171' }}>Order Cancelled</h4>
            <p style={{ margin: '0.25rem 0 0', color: '#cbd5e1', fontSize: '0.9rem' }}>
              Reason: {serverCancelReason || 'Customer requested cancellation.'} (Inventory stock has been restored to database).
            </p>
          </div>
        </div>
      )}

      {/* Returned Banner */}
      {isReturned && (
        <div
          style={{
            background: 'rgba(245,158,11,0.12)',
            border: '1px solid rgba(245,158,11,0.3)',
            borderRadius: 12,
            padding: '1.25rem 1.5rem',
            marginBottom: '1.75rem',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
          }}
        >
          <RotateCcw size={28} color="#fbbf24" style={{ flexShrink: 0 }} />
          <div>
            <h4 style={{ margin: 0, color: '#fbbf24' }}>Return Initiated</h4>
            <p style={{ margin: '0.25rem 0 0', color: '#cbd5e1', fontSize: '0.9rem' }}>
              Our logistics partner will contact you for pickup.
            </p>
          </div>
        </div>
      )}

      {/* Secure Customer Delivery OTP Banner */}
      {data.deliveryOtp && (status === 'Out for Delivery' || data.deliveryStatus === 'Out for Delivery') && (
        <div
          style={{
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(99, 102, 241, 0.12) 100%)',
            border: '2px solid rgba(16, 185, 129, 0.4)',
            borderRadius: 16,
            padding: '1.25rem 1.75rem',
            marginBottom: '1.75rem',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem',
            boxShadow: '0 8px 30px rgba(16, 185, 129, 0.15)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: 12,
                background: '#10b981',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
              }}
            >
              <KeyRound size={24} />
            </div>
            <div>
              <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#34d399', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Secure Proof of Delivery
              </div>
              <h3 style={{ margin: '0.2rem 0', color: '#f8fafc', fontSize: '1.15rem' }}>
                Your Delivery Verification OTP
              </h3>
              <p style={{ margin: 0, fontSize: '0.82rem', color: '#cbd5e1' }}>
                Please share this code with your delivery partner only when you inspect and receive your package.
              </p>
            </div>
          </div>

          <div
            style={{
              background: '#0f172a',
              border: '2px solid #10b981',
              borderRadius: 12,
              padding: '0.5rem 1.5rem',
              fontSize: '1.8rem',
              fontWeight: 900,
              fontFamily: 'monospace',
              letterSpacing: '0.25em',
              color: '#34d399',
              boxShadow: '0 0 15px rgba(16, 185, 129, 0.25)',
            }}
          >
            {data.deliveryOtp}
          </div>
        </div>
      )}

      {/* Assigned Delivery Partner Card */}
      {data.deliveryPartner && (
        <div
          style={{
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: 14,
            padding: '1rem 1.5rem',
            marginBottom: '1.75rem',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Bike size={24} color="#34d399" />
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>
                Assigned Fleet Delivery Agent
              </div>
              <div style={{ fontSize: '1rem', fontWeight: 700, color: '#f8fafc' }}>
                {data.deliveryPartner.name}
              </div>
              <div style={{ fontSize: '0.8rem', color: '#cbd5e1' }}>
                Vehicle: {data.deliveryPartner.vehicleNumber || 'Electric 2W'} ({data.deliveryPartner.vehicleType || 'bike'}) • Rating: ⭐ {data.deliveryPartner.deliveryRating || '5.0'}
              </div>
            </div>
          </div>

          {data.deliveryPartner.phone && (
            <a
              href={`tel:${data.deliveryPartner.phone}`}
              className="btn btn-secondary btn-sm"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
            >
              <Phone size={14} color="#34d399" /> Contact Delivery Agent
            </a>
          )}
        </div>
      )}

      {/* 7-Step Interactive Milestone Stepper */}
      <div className="track-card">
        <h3 style={{ margin: '0 0 1.5rem', fontSize: '1.15rem', color: '#f8fafc' }}>
          Delivery Progress Milestones (7 Stages)
        </h3>

        <div className="timeline-stepper">
          <div className="timeline-track-bg" />
          {!isCancelled && !isReturned && (
            <div className="timeline-track-fill" style={{ width: `${progressPercent}%` }} />
          )}

          {milestones.map((m, idx) => {
            const Icon = ICONS_MAP[m.step] || Package;
            const nodeClass = m.isCurrent ? 'current' : m.completed ? 'completed' : 'pending';

            return (
              <div key={m.step} className={`timeline-node ${nodeClass}`}>
                <div className="timeline-circle">
                  <Icon size={20} strokeWidth={2} />
                </div>
                <span className="timeline-node-title">{m.step}</span>
                {m.timestamp && (
                  <span className="timeline-node-date">
                    {new Date(m.timestamp).toLocaleDateString('en-IN', {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Logistics & Tracking Strip */}
      <div className="courier-strip">
        <div>
          <span className="courier-stat-label">Assigned Courier</span>
          <span className="courier-stat-value">{courierName}</span>
        </div>

        <div>
          <span className="courier-stat-label">Tracking Number / AWB</span>
          <span className="courier-stat-value" style={{ fontFamily: 'monospace', color: '#818cf8' }}>
            {trackingNumber}
          </span>
        </div>

        <div>
          <span className="courier-stat-label">Estimated Delivery</span>
          <span className="courier-stat-value" style={{ color: '#38bdf8' }}>
            <Calendar size={15} style={{ verticalAlign: 'middle', marginRight: 4 }} />
            {estFormatted}
          </span>
        </div>

        <div>
          <span className="courier-stat-label">Payment Status</span>
          <span className="courier-stat-value">
            <span
              className="badge"
              style={{
                background:
                  paymentStatus === 'Paid'
                    ? 'rgba(16,185,129,0.15)'
                    : paymentStatus === 'Pending'
                    ? 'rgba(245,158,11,0.15)'
                    : 'rgba(239,68,68,0.15)',
                color:
                  paymentStatus === 'Paid'
                    ? '#34d399'
                    : paymentStatus === 'Pending'
                    ? '#fbbf24'
                    : '#ef4444',
                padding: '0.2rem 0.6rem',
                borderRadius: 4,
              }}
            >
              {paymentStatus} ({paymentMethod.toUpperCase()})
            </span>
          </span>
        </div>
      </div>

      {/* Details Grid: Items & Shipping */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem' }}>
        {/* Ordered Items */}
        <div className="track-card">
          <h3 style={{ margin: '0 0 1rem', fontSize: '1.1rem', color: '#f8fafc' }}>
            Items in this Shipment ({order?.items?.length || 0})
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {order?.items?.map((item, idx) => (
              <div
                key={item._id || idx}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.75rem',
                  background: 'rgba(255,255,255,0.02)',
                  borderRadius: 8,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                  {item.image ? (
                    <img
                      src={item.image}
                      alt={item.name}
                      style={{ width: 48, height: 48, objectFit: 'cover', borderRadius: 6 }}
                    />
                  ) : (
                    <div
                      style={{
                        width: 48,
                        height: 48,
                        borderRadius: 6,
                        background: 'rgba(255,255,255,0.05)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <ShoppingBag size={22} color="#94a3b8" />
                    </div>
                  )}
                  <div>
                    <h4 style={{ margin: 0, fontSize: '0.92rem', color: '#f1f5f9' }}>{item.name}</h4>
                    <small style={{ color: '#94a3b8' }}>
                      Qty: {item.quantity} × {formatPrice(item.price)}
                    </small>
                  </div>
                </div>
                <strong style={{ color: '#f8fafc' }}>{formatPrice(item.price * item.quantity)}</strong>
              </div>
            ))}
          </div>

          <div style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem', color: '#94a3b8' }}>
              <span>Subtotal</span>
              <span>{formatPrice(order?.subtotal || 0)}</span>
            </div>
            {order?.discount > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem', color: '#34d399' }}>
                <span>Discount</span>
                <span>-{formatPrice(order?.discount)}</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem', color: '#94a3b8' }}>
              <span>Delivery</span>
              <span>{order?.delivery === 0 ? 'Free' : formatPrice(order?.delivery || 0)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px dashed rgba(255,255,255,0.15)', fontSize: '1.1rem', fontWeight: 'bold' }}>
              <span>Total</span>
              <span style={{ color: '#818cf8' }}>{formatPrice(order?.total || 0)}</span>
            </div>
          </div>
        </div>

        {/* Shipping Destination & Timeline History */}
        <div className="track-card">
          <h3 style={{ margin: '0 0 1rem', fontSize: '1.1rem', color: '#f8fafc' }}>
            Shipping Destination
          </h3>

          {shippingAddress && (
            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: 8, marginBottom: '1.5rem' }}>
              <strong style={{ display: 'block', color: '#f8fafc', marginBottom: '0.25rem' }}>
                {shippingAddress.fullName}
              </strong>
              <p style={{ margin: 0, color: '#cbd5e1', fontSize: '0.9rem', lineHeight: 1.5 }}>
                {shippingAddress.addressLine}, {shippingAddress.city}, {shippingAddress.state} - {shippingAddress.pincode}
              </p>
              <small style={{ color: '#94a3b8', display: 'block', marginTop: '0.5rem' }}>
                Contact Phone: {shippingAddress.phone}
              </small>
            </div>
          )}

          <h3 style={{ margin: '0 0 1rem', fontSize: '1.1rem', color: '#f8fafc' }}>
            Event Log History
          </h3>

          <div className="history-feed">
            {history.map((h, idx) => (
              <div key={idx} className="history-item">
                <Clock size={16} color="#6366f1" style={{ flexShrink: 0, marginTop: 2 }} />
                <div>
                  <b style={{ color: '#f1f5f9', fontSize: '0.9rem', display: 'block' }}>{h.status}</b>
                  <p style={{ margin: '0.2rem 0', color: '#94a3b8', fontSize: '0.85rem' }}>
                    {h.note || 'Milestone achieved'}
                  </p>
                  <small style={{ color: '#64748b' }}>
                    {new Date(h.timestamp).toLocaleString('en-IN', {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    })}
                  </small>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Cancel Order Modal */}
      {cancelModal && (
        <div className="admin-modal-overlay">
          <div className="admin-modal" style={{ maxWidth: 480 }}>
            <div className="admin-modal-header">
              <h2>Cancel Order #{orderId}</h2>
              <button className="admin-modal-close" onClick={() => setCancelModal(false)}>✕</button>
            </div>
            <form onSubmit={handleCancelOrder} style={{ padding: '1.5rem' }}>
              <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '1rem' }}>
                Are you sure you want to cancel this order? Once cancelled, your items will be released back into inventory.
              </p>
              <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                <label className="form-label">Reason for cancellation *</label>
                <select
                  className="form-input"
                  required
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                >
                  <option value="">Select a reason...</option>
                  <option value="Changed my mind">Changed my mind</option>
                  <option value="Ordered by mistake">Ordered by mistake</option>
                  <option value="Found better price elsewhere">Found better price elsewhere</option>
                  <option value="Delivery time too long">Delivery time too long</option>
                  <option value="Incorrect shipping address entered">Incorrect shipping address entered</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setCancelModal(false)}
                >
                  Keep Order
                </button>
                <button
                  type="submit"
                  className="btn btn-danger"
                  disabled={cancelBusy || !cancelReason}
                >
                  {cancelBusy ? 'Cancelling…' : 'Confirm Cancellation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
