import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Truck,
  MapPin,
  Phone,
  Navigation,
  KeyRound,
  ShieldCheck,
  AlertTriangle,
  RefreshCw,
  CheckCircle,
  DollarSign,
  Package,
  Clock,
  Compass
} from 'lucide-react';
import { deliveryService } from '../../services/deliveryService';
import { formatPrice } from '../../utils/formatPrice';

export default function ActiveDeliveries() {
  const [activeOrders, setActiveOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // OTP Verification Modal
  const [otpModal, setOtpModal] = useState({ open: false, order: null, otp: '', notes: '' });
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [otpError, setOtpError] = useState('');

  // Delivery Failed Modal
  const [failModal, setFailModal] = useState({ open: false, order: null, reason: 'Customer unavailable / phone unanswered', notes: '' });
  const [reportingFail, setReportingFail] = useState(false);

  const loadActiveDeliveries = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await deliveryService.getAssignedOrders({ status: 'active' });
      if (res?.success) {
        setActiveOrders(res.orders || []);
      }
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Failed to load active deliveries');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadActiveDeliveries();
  }, []);

  const handleStartOutForDelivery = async (orderId) => {
    try {
      const res = await deliveryService.startOutForDelivery(orderId);
      if (res?.success) {
        setSuccess(`Order #${orderId} is now OUT FOR DELIVERY! Customer has received their delivery OTP.`);
        setActiveOrders((prev) =>
          prev.map((o) => (o.orderId === orderId || o._id === orderId ? { ...o, deliveryStatus: 'Out for Delivery' } : o))
        );
        setTimeout(() => setSuccess(''), 4000);
      }
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to update Out for Delivery');
      setTimeout(() => setError(''), 4000);
    }
  };

  const handleVerifyOtpSubmit = async (e) => {
    e.preventDefault();
    if (!otpModal.order || !otpModal.otp) return;
    setVerifyingOtp(true);
    setOtpError('');

    try {
      const res = await deliveryService.verifyOtp(
        otpModal.order.orderId || otpModal.order._id,
        otpModal.otp,
        { notes: otpModal.notes }
      );
      if (res?.success) {
        setSuccess(`🎉 Order #${otpModal.order.orderId} DELIVERED! +₹${res.earned || 60} credited to your earnings.`);
        setActiveOrders((prev) => prev.filter((o) => o._id !== otpModal.order._id));
        setOtpModal({ open: false, order: null, otp: '', notes: '' });
        setTimeout(() => setSuccess(''), 5000);
      }
    } catch (err) {
      setOtpError(err?.response?.data?.message || 'Invalid Delivery OTP. Please double-check with customer.');
    } finally {
      setVerifyingOtp(false);
    }
  };

  const handleReportFailedSubmit = async (e) => {
    e.preventDefault();
    if (!failModal.order) return;
    setReportingFail(true);

    try {
      const res = await deliveryService.reportDeliveryFailed(
        failModal.order.orderId || failModal.order._id,
        { reason: failModal.reason, notes: failModal.notes }
      );
      if (res?.success) {
        setSuccess(`Delivery attempt failure recorded for #${failModal.order.orderId}. Scheduled for follow-up.`);
        setActiveOrders((prev) => prev.filter((o) => o._id !== failModal.order._id));
        setFailModal({ open: false, order: null, reason: 'Customer unavailable / phone unanswered', notes: '' });
        setTimeout(() => setSuccess(''), 4000);
      }
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to record failure');
    } finally {
      setReportingFail(false);
    }
  };

  return (
    <div>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
          marginBottom: '1.5rem',
        }}
      >
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, margin: '0 0 0.25rem', color: '#f8fafc' }}>
            Active Final Mile Deliveries
          </h2>
          <p style={{ margin: 0, fontSize: '0.85rem', color: '#94a3b8' }}>
            Navigate to customer destinations, collect COD payments, and verify delivery via customer OTP.
          </p>
        </div>

        <button
          onClick={loadActiveDeliveries}
          className="deliv-btn deliv-btn-secondary"
          disabled={loading}
          style={{ minHeight: 38 }}
        >
          <RefreshCw size={16} className={loading ? 'spin-icon' : ''} />
          <span>Refresh Active</span>
        </button>
      </div>

      {error && (
        <div style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 10, padding: '0.85rem', marginBottom: '1rem', color: '#f87171' }}>
          {error}
        </div>
      )}

      {success && (
        <div style={{ background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 10, padding: '0.85rem', marginBottom: '1rem', color: '#34d399' }}>
          {success}
        </div>
      )}

      {/* Active Orders List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem 0', color: '#94a3b8' }}>
          <RefreshCw size={28} className="spin-icon" style={{ margin: '0 auto 0.5rem' }} />
          <p>Querying active transit parcels…</p>
        </div>
      ) : activeOrders.length === 0 ? (
        <div className="deliv-card" style={{ textAlign: 'center', padding: '3.5rem 1.5rem', color: '#94a3b8' }}>
          <CheckCircle size={46} color="#10b981" style={{ margin: '0 auto 0.75rem' }} />
          <h3 style={{ margin: '0 0 0.25rem', color: '#f8fafc' }}>No Active Parcels in Transit</h3>
          <p style={{ margin: '0 0 1.25rem', fontSize: '0.88rem' }}>
            You have no parcels out on the road. Check pending pickups to collect more orders.
          </p>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
            <Link to="/delivery/pickups" className="deliv-btn deliv-btn-primary">
              View Vendor Pickups →
            </Link>
            <Link to="/delivery/assigned" className="deliv-btn deliv-btn-secondary">
              View Assigned Orders
            </Link>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {activeOrders.map((ord) => {
            const status = ord.deliveryStatus || 'Picked Up';
            const isOutForDelivery = status === 'Out for Delivery';
            const isCod = ord.paymentMethod === 'cod' && ord.paymentStatus !== 'Paid';

            const custAddress = `${ord.shippingAddress?.fullName}, ${ord.shippingAddress?.addressLine}, ${ord.shippingAddress?.city} - ${ord.shippingAddress?.pincode}`;
            const mapQuery = encodeURIComponent(custAddress);
            const mapUrl = `https://www.google.com/maps/search/?api=1&query=${mapQuery}`;

            return (
              <div
                key={ord._id}
                className="deliv-order-card"
                style={{
                  borderLeft: isOutForDelivery ? '4px solid #a855f7' : '4px solid #06b6d4',
                  boxShadow: isOutForDelivery ? '0 8px 30px rgba(168, 85, 247, 0.15)' : 'none',
                }}
              >
                {/* Header Row */}
                <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem', marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <span style={{ fontSize: '1.2rem', fontWeight: 800, color: '#f8fafc' }}>
                      #{ord.orderId}
                    </span>
                    <span className={`deliv-badge ${isOutForDelivery ? 'deliv-badge-out' : 'deliv-badge-picked'}`}>
                      {status}
                    </span>
                  </div>

                  {/* COD Cash Collection Alert */}
                  {isCod ? (
                    <div
                      style={{
                        background: 'rgba(239, 68, 68, 0.15)',
                        border: '1px solid rgba(239, 68, 68, 0.35)',
                        color: '#f87171',
                        padding: '4px 10px',
                        borderRadius: 8,
                        fontSize: '0.85rem',
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                      }}
                    >
                      <DollarSign size={16} /> Collect COD Cash: {formatPrice(ord.total || 0)}
                    </div>
                  ) : (
                    <div
                      style={{
                        background: 'rgba(16, 185, 129, 0.15)',
                        color: '#34d399',
                        padding: '4px 10px',
                        borderRadius: 8,
                        fontSize: '0.82rem',
                        fontWeight: 700,
                      }}
                    >
                      ✓ Prepaid ({ord.paymentMethod?.toUpperCase()})
                    </div>
                  )}
                </div>

                {/* Customer Details Box */}
                <div
                  style={{
                    background: '#0f172a',
                    borderRadius: 14,
                    padding: '1.2rem',
                    marginBottom: '1rem',
                  }}
                >
                  <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                    <div>
                      <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#38bdf8', textTransform: 'uppercase', marginBottom: 2 }}>
                        Customer Delivery Location
                      </div>
                      <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#f8fafc' }}>
                        {ord.shippingAddress?.fullName}
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <a
                        href={`tel:${ord.shippingAddress?.phone}`}
                        className="deliv-btn deliv-btn-secondary"
                        style={{ minHeight: 38, padding: '0 14px', fontSize: '0.85rem' }}
                      >
                        <Phone size={15} color="#34d399" /> Call Customer
                      </a>

                      <a
                        href={mapUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="deliv-btn deliv-btn-secondary"
                        style={{ minHeight: 38, padding: '0 14px', fontSize: '0.85rem', color: '#38bdf8' }}
                      >
                        <Navigation size={15} /> Navigate
                      </a>
                    </div>
                  </div>

                  <div style={{ fontSize: '0.88rem', color: '#cbd5e1', lineHeight: 1.5, display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                    <MapPin size={16} color="#ef4444" style={{ flexShrink: 0, marginTop: 3 }} />
                    <span>
                      {ord.shippingAddress?.addressLine}, {ord.shippingAddress?.city}, {ord.shippingAddress?.state} - <strong>{ord.shippingAddress?.pincode}</strong>
                    </span>
                  </div>
                </div>

                {/* Parcel Contents */}
                <div style={{ fontSize: '0.85rem', color: '#94a3b8', marginBottom: '1.25rem' }}>
                  <strong>Package Contents:</strong>{' '}
                  {ord.items?.map((it) => `${it.quantity}x ${it.name}`).join(', ') || '1 Box'}
                </div>

                {/* Main Action Buttons */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', justifyContent: 'space-between', alignItems: 'center' }}>
                  <button
                    onClick={() => setFailModal({ open: true, order: ord, reason: 'Customer unavailable / phone unanswered', notes: '' })}
                    className="deliv-btn deliv-btn-danger"
                    style={{ minHeight: 42, padding: '0 14px', fontSize: '0.82rem' }}
                  >
                    <AlertTriangle size={15} /> Delivery Attempt Failed
                  </button>

                  <div style={{ display: 'flex', gap: '0.75rem' }}>
                    {!isOutForDelivery ? (
                      <button
                        onClick={() => handleStartOutForDelivery(ord.orderId)}
                        className="deliv-btn deliv-btn-primary"
                        style={{ minHeight: 42, padding: '0 18px', fontSize: '0.88rem' }}
                      >
                        <Compass size={16} /> Mark Out for Delivery
                      </button>
                    ) : (
                      <button
                        onClick={() => { setOtpModal({ open: true, order: ord, otp: '', notes: '' }); setOtpError(''); }}
                        className="deliv-btn deliv-btn-success"
                        style={{ minHeight: 44, padding: '0 20px', fontSize: '0.92rem', boxShadow: '0 4px 14px rgba(16, 185, 129, 0.4)' }}
                      >
                        <ShieldCheck size={18} /> Verify OTP & Deliver
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* SECURE DELIVERY OTP VERIFICATION MODAL */}
      {otpModal.open && (
        <div className="deliv-modal-overlay" onClick={() => setOtpModal({ open: false, order: null, otp: '', notes: '' })}>
          <div className="deliv-modal" onClick={(e) => e.stopPropagation()}>
            <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
              <div
                style={{
                  width: 52,
                  height: 52,
                  background: 'rgba(16, 185, 129, 0.15)',
                  borderRadius: 16,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 0.75rem',
                  color: '#10b981',
                }}
              >
                <KeyRound size={26} />
              </div>
              <h3 style={{ margin: '0 0 0.25rem', color: '#f8fafc', fontSize: '1.25rem' }}>
                Verify Delivery OTP
              </h3>
              <p style={{ fontSize: '0.85rem', color: '#94a3b8', margin: 0 }}>
                Order #{otpModal.order?.orderId} • Customer: <strong>{otpModal.order?.shippingAddress?.fullName}</strong>
              </p>
            </div>

            <div
              style={{
                background: 'rgba(99, 102, 241, 0.1)',
                border: '1px solid rgba(99, 102, 241, 0.25)',
                borderRadius: 12,
                padding: '0.75rem',
                fontSize: '0.82rem',
                color: '#c7d2fe',
                marginBottom: '1.25rem',
                lineHeight: 1.4,
              }}
            >
              Ask the customer for the <strong>4-digit Secure Delivery OTP</strong> displayed in their live order tracking screen. Hand over the package only upon verification.
            </div>

            {otpError && (
              <div
                style={{
                  background: 'rgba(239, 68, 68, 0.15)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  borderRadius: 10,
                  padding: '0.75rem',
                  marginBottom: '1rem',
                  color: '#f87171',
                  fontSize: '0.85rem',
                }}
              >
                {otpError}
              </div>
            )}

            <form onSubmit={handleVerifyOtpSubmit}>
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#cbd5e1', marginBottom: 6, textAlign: 'center' }}>
                  Enter 4-Digit Customer OTP
                </label>
                <input
                  type="text"
                  maxLength={6}
                  required
                  autoFocus
                  value={otpModal.otp}
                  onChange={(e) => setOtpModal({ ...otpModal, otp: e.target.value })}
                  placeholder="••••"
                  className="otp-input-field"
                />
              </div>

              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#94a3b8', marginBottom: 4 }}>
                  Delivery Notes (Optional)
                </label>
                <input
                  type="text"
                  value={otpModal.notes}
                  onChange={(e) => setOtpModal({ ...otpModal, notes: e.target.value })}
                  placeholder="Handed over to customer / security / reception…"
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem',
                    background: '#0f172a',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: 10,
                    color: '#f8fafc',
                    fontSize: '0.85rem',
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button
                  type="button"
                  onClick={() => setOtpModal({ open: false, order: null, otp: '', notes: '' })}
                  className="deliv-btn deliv-btn-secondary"
                  style={{ flex: 1 }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={verifyingOtp}
                  className="deliv-btn deliv-btn-success"
                  style={{ flex: 1 }}
                >
                  {verifyingOtp ? 'Verifying…' : 'Confirm & Complete'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELIVERY FAILED MODAL */}
      {failModal.open && (
        <div className="deliv-modal-overlay" onClick={() => setFailModal({ open: false, order: null, reason: 'Customer unavailable / phone unanswered', notes: '' })}>
          <div className="deliv-modal" onClick={(e) => e.stopPropagation()}>
            <h3 style={{ margin: '0 0 0.5rem', color: '#f8fafc' }}>
              Report Failed Delivery Attempt
            </h3>
            <p style={{ fontSize: '0.85rem', color: '#94a3b8', margin: '0 0 1rem' }}>
              Order #{failModal.order?.orderId} • Please select why this package could not be delivered.
            </p>

            <form onSubmit={handleReportFailedSubmit}>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#cbd5e1', marginBottom: 6 }}>
                Failure Reason
              </label>
              <select
                value={failModal.reason}
                onChange={(e) => setFailModal({ ...failModal, reason: e.target.value })}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  background: '#0f172a',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: 10,
                  color: '#f8fafc',
                  fontSize: '0.88rem',
                  marginBottom: '1rem',
                }}
              >
                <option value="Customer unavailable / phone unanswered">Customer unavailable / phone unanswered</option>
                <option value="Incorrect / incomplete delivery address">Incorrect / incomplete delivery address</option>
                <option value="Customer declined order acceptance">Customer declined order acceptance</option>
                <option value="Premises closed / gated entry refused">Premises closed / gated entry refused</option>
                <option value="Customer requested rescheduling">Customer requested rescheduling</option>
                <option value="Cash not ready (COD payment declined)">Cash not ready (COD payment declined)</option>
              </select>

              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#cbd5e1', marginBottom: 6 }}>
                Notes / Attempt Details
              </label>
              <textarea
                value={failModal.notes}
                onChange={(e) => setFailModal({ ...failModal, notes: e.target.value })}
                placeholder="Mention calling timestamps, gate info, etc…"
                rows={3}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  background: '#0f172a',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: 10,
                  color: '#f8fafc',
                  fontSize: '0.88rem',
                  marginBottom: '1.25rem',
                  resize: 'none',
                }}
              />

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setFailModal({ open: false, order: null, reason: 'Customer unavailable / phone unanswered', notes: '' })}
                  className="deliv-btn deliv-btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={reportingFail}
                  className="deliv-btn deliv-btn-danger"
                >
                  {reportingFail ? 'Logging…' : 'Record Failed Attempt'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
