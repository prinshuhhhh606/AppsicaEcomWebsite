import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Store,
  MapPin,
  Phone,
  Navigation,
  CheckCircle,
  AlertTriangle,
  Package,
  RefreshCw,
  Clock,
  ArrowRight
} from 'lucide-react';
import { deliveryService } from '../../services/deliveryService';
import { formatPrice } from '../../utils/formatPrice';

export default function PickupManagement() {
  const [pickups, setPickups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Exception Modal
  const [exceptionModal, setExceptionModal] = useState({ open: false, order: null, reason: 'Seller store closed', notes: '' });
  const [submittingException, setSubmittingException] = useState(false);

  const loadPickups = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await deliveryService.getAssignedOrders({ status: 'pickups' });
      if (res?.success) {
        setPickups(res.orders || []);
      }
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Failed to load pickups');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPickups();
  }, []);

  const handleArrivePickup = async (orderId) => {
    try {
      const res = await deliveryService.arrivePickup(orderId);
      if (res?.success) {
        setSuccess(`Status updated: Arrived at vendor location for Order #${orderId}`);
        setPickups((prev) =>
          prev.map((o) => (o.orderId === orderId || o._id === orderId ? { ...o, deliveryStatus: 'Arrived at Pickup' } : o))
        );
        setTimeout(() => setSuccess(''), 4000);
      }
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to update arrival status');
      setTimeout(() => setError(''), 4000);
    }
  };

  const handleConfirmPickup = async (orderId) => {
    try {
      const res = await deliveryService.confirmPickup(orderId, { notes: 'Parcel collected and verified intact.' });
      if (res?.success) {
        setSuccess(`Parcel collected for Order #${orderId}! Ready for final mile delivery.`);
        // Remove from pending pickups or update
        setPickups((prev) => prev.filter((o) => o.orderId !== orderId && o._id !== orderId));
        setTimeout(() => setSuccess(''), 4000);
      }
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to confirm pickup');
      setTimeout(() => setError(''), 4000);
    }
  };

  const handleReportExceptionSubmit = async (e) => {
    e.preventDefault();
    if (!exceptionModal.order) return;
    setSubmittingException(true);

    try {
      const res = await deliveryService.reportPickupException(
        exceptionModal.order.orderId || exceptionModal.order._id,
        { reason: exceptionModal.reason, notes: exceptionModal.notes }
      );
      if (res?.success) {
        setSuccess(`Pickup exception logged for Order #${exceptionModal.order.orderId}. Admin notified.`);
        setExceptionModal({ open: false, order: null, reason: 'Seller store closed', notes: '' });
        loadPickups();
        setTimeout(() => setSuccess(''), 4000);
      }
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to report exception');
    } finally {
      setSubmittingException(false);
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
            Vendor Pickup Hubs
          </h2>
          <p style={{ margin: 0, fontSize: '0.85rem', color: '#94a3b8' }}>
            Collect ready packages from merchant stores, inspect item condition, and confirm pickup.
          </p>
        </div>

        <button
          onClick={loadPickups}
          className="deliv-btn deliv-btn-secondary"
          disabled={loading}
          style={{ minHeight: 38 }}
        >
          <RefreshCw size={16} className={loading ? 'spin-icon' : ''} />
          <span>Refresh Pickups</span>
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

      {/* Pickups List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem 0', color: '#94a3b8' }}>
          <RefreshCw size={28} className="spin-icon" style={{ margin: '0 auto 0.5rem' }} />
          <p>Loading pending vendor collections…</p>
        </div>
      ) : pickups.length === 0 ? (
        <div className="deliv-card" style={{ textAlign: 'center', padding: '3rem 1.5rem', color: '#94a3b8' }}>
          <CheckCircle size={42} color="#10b981" style={{ margin: '0 auto 0.75rem' }} />
          <h3 style={{ margin: '0 0 0.25rem', color: '#f8fafc' }}>All Pickups Completed</h3>
          <p style={{ margin: '0 0 1rem', fontSize: '0.85rem' }}>
            You have no pending vendor parcel collections at this moment.
          </p>
          <Link to="/delivery/active" className="deliv-btn deliv-btn-primary" style={{ display: 'inline-flex' }}>
            Go to Active Deliveries →
          </Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {pickups.map((ord) => {
            const firstVendor = ord.items?.[0]?.vendor;
            const vendorName = firstVendor?.storeName || firstVendor?.name || 'Aura Sound & Tech';
            const vendorAddress = firstVendor?.businessAddress || '402 Innovation Way, Tech Park, Bangalore';
            const vendorPhone = firstVendor?.phone || '9876543220';
            const isArrived = ord.deliveryStatus === 'Arrived at Pickup';

            const mapQuery = encodeURIComponent(`${vendorName}, ${vendorAddress}`);
            const mapUrl = `https://www.google.com/maps/search/?api=1&query=${mapQuery}`;

            return (
              <div key={ord._id} className="deliv-order-card" style={{ borderLeft: '4px solid #f59e0b' }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem', marginBottom: '1rem' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontSize: '1.1rem', fontWeight: 800, color: '#f8fafc' }}>
                        #{ord.orderId}
                      </span>
                      <span className="deliv-badge deliv-badge-accepted">
                        {isArrived ? 'Arrived at Store' : 'Pickup Pending'}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: 2 }}>
                      Items: {ord.items?.map((it) => `${it.quantity}x ${it.name}`).join(', ') || '1 package'}
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Payout on delivery</div>
                    <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#34d399' }}>
                      +₹{ord.deliveryFee || 50}
                    </div>
                  </div>
                </div>

                {/* Vendor Details Box */}
                <div
                  style={{
                    background: '#0f172a',
                    borderRadius: 12,
                    padding: '1rem',
                    marginBottom: '1rem',
                    display: 'flex',
                    flexWrap: 'wrap',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '1rem',
                  }}
                >
                  <div>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#f59e0b', textTransform: 'uppercase', marginBottom: 2 }}>
                      Merchant Store Details
                    </div>
                    <div style={{ fontSize: '1rem', fontWeight: 700, color: '#f8fafc' }}>
                      {vendorName}
                    </div>
                    <div style={{ fontSize: '0.82rem', color: '#94a3b8', marginTop: 2, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <MapPin size={14} color="#64748b" />
                      <span>{vendorAddress}</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <a
                      href={`tel:${vendorPhone}`}
                      className="deliv-btn deliv-btn-secondary"
                      style={{ minHeight: 38, padding: '0 12px', fontSize: '0.82rem' }}
                    >
                      <Phone size={14} /> Call Seller
                    </a>

                    <a
                      href={mapUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="deliv-btn deliv-btn-secondary"
                      style={{ minHeight: 38, padding: '0 12px', fontSize: '0.82rem', color: '#38bdf8' }}
                    >
                      <Navigation size={14} /> Navigate
                    </a>
                  </div>
                </div>

                {/* Pickup Progression Buttons */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', justifyContent: 'space-between', alignItems: 'center' }}>
                  <button
                    onClick={() => setExceptionModal({ open: true, order: ord, reason: 'Seller store closed', notes: '' })}
                    className="deliv-btn deliv-btn-danger"
                    style={{ minHeight: 40, padding: '0 14px', fontSize: '0.82rem' }}
                  >
                    <AlertTriangle size={15} /> Report Pickup Exception
                  </button>

                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    {!isArrived && (
                      <button
                        onClick={() => handleArrivePickup(ord.orderId)}
                        className="deliv-btn deliv-btn-secondary"
                        style={{ minHeight: 40, padding: '0 16px', fontSize: '0.85rem' }}
                      >
                        <Clock size={16} /> Mark Arrived at Store
                      </button>
                    )}

                    <button
                      onClick={() => handleConfirmPickup(ord.orderId)}
                      className="deliv-btn deliv-btn-success"
                      style={{ minHeight: 40, padding: '0 18px', fontSize: '0.85rem' }}
                    >
                      <CheckCircle size={16} /> Confirm Parcel Picked Up
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pickup Exception Modal */}
      {exceptionModal.open && (
        <div className="deliv-modal-overlay" onClick={() => setExceptionModal({ open: false, order: null, reason: 'Seller store closed', notes: '' })}>
          <div className="deliv-modal" onClick={(e) => e.stopPropagation()}>
            <h3 style={{ margin: '0 0 0.5rem', color: '#f8fafc' }}>
              Pickup Exception for Order #{exceptionModal.order?.orderId}
            </h3>
            <p style={{ fontSize: '0.85rem', color: '#94a3b8', margin: '0 0 1rem' }}>
              Report if the vendor is closed, the item is damaged, or the parcel cannot be collected.
            </p>

            <form onSubmit={handleReportExceptionSubmit}>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#cbd5e1', marginBottom: 6 }}>
                Issue Category
              </label>
              <select
                value={exceptionModal.reason}
                onChange={(e) => setExceptionModal({ ...exceptionModal, reason: e.target.value })}
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
                <option value="Seller store closed / unavailable">Seller store closed / unavailable</option>
                <option value="Parcel not ready / waiting for packaging">Parcel not ready / waiting for packaging</option>
                <option value="Package damaged before pickup">Package damaged before pickup</option>
                <option value="Item mismatch with invoice">Item mismatch with invoice</option>
                <option value="Seller refused dispatch">Seller refused dispatch</option>
              </select>

              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#cbd5e1', marginBottom: 6 }}>
                Additional Notes
              </label>
              <textarea
                value={exceptionModal.notes}
                onChange={(e) => setExceptionModal({ ...exceptionModal, notes: e.target.value })}
                placeholder="Provide details about the exception…"
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
                  onClick={() => setExceptionModal({ open: false, order: null, reason: 'Seller store closed', notes: '' })}
                  className="deliv-btn deliv-btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingException}
                  className="deliv-btn deliv-btn-danger"
                >
                  {submittingException ? 'Logging…' : 'Submit Exception'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
