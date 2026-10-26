import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Package,
  Search,
  CheckCircle,
  XCircle,
  Store,
  MapPin,
  Clock,
  ArrowRight,
  RefreshCw,
  Phone,
  AlertCircle
} from 'lucide-react';
import { deliveryService } from '../../services/deliveryService';
import { formatPrice } from '../../utils/formatPrice';

export default function AssignedOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');

  // Reject Modal State
  const [rejectModal, setRejectModal] = useState({ open: false, order: null, reason: '' });
  const [rejecting, setRejecting] = useState(false);

  const loadOrders = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await deliveryService.getAssignedOrders({ status: filter, search });
      if (res?.success) {
        setOrders(res.orders || []);
      }
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Failed to load assigned deliveries');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, [filter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadOrders();
  };

  const handleAccept = async (orderId) => {
    try {
      const res = await deliveryService.acceptAssignment(orderId);
      if (res?.success) {
        setSuccess(`Order #${orderId} accepted! Proceed to seller store for pickup.`);
        setOrders((prev) =>
          prev.map((o) => (o.orderId === orderId || o._id === orderId ? { ...o, deliveryStatus: 'Accepted' } : o))
        );
        setTimeout(() => setSuccess(''), 4000);
      }
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Failed to accept assignment');
      setTimeout(() => setError(''), 4000);
    }
  };

  const handleRejectConfirm = async (e) => {
    e.preventDefault();
    if (!rejectModal.order) return;
    setRejecting(true);

    try {
      const res = await deliveryService.rejectAssignment(
        rejectModal.order.orderId || rejectModal.order._id,
        rejectModal.reason || 'Agent unavailable'
      );
      if (res?.success) {
        setSuccess(`Assignment for #${rejectModal.order.orderId} declined.`);
        setOrders((prev) => prev.filter((o) => o._id !== rejectModal.order._id));
        setRejectModal({ open: false, order: null, reason: '' });
        setTimeout(() => setSuccess(''), 4000);
      }
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to decline assignment');
    } finally {
      setRejecting(false);
    }
  };

  return (
    <div>
      {/* Header and Search */}
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
            Assigned Deliveries
          </h2>
          <p style={{ margin: 0, fontSize: '0.85rem', color: '#94a3b8' }}>
            Review new orders, accept tasks, and track assigned route progress.
          </p>
        </div>

        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '0.5rem', width: '100%', maxWidth: 320 }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={16} style={{ position: 'absolute', left: 12, top: 12, color: '#64748b' }} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search Order ID or City…"
              style={{
                width: '100%',
                padding: '0.6rem 0.85rem 0.6rem 2.25rem',
                background: '#182234',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: 10,
                color: '#f8fafc',
                fontSize: '0.85rem',
                outline: 'none',
              }}
            />
          </div>
          <button type="submit" className="deliv-btn deliv-btn-secondary" style={{ minHeight: 38, padding: '0 12px' }}>
            Search
          </button>
        </form>
      </div>

      {/* Filter Tabs */}
      <div
        style={{
          display: 'flex',
          gap: '0.5rem',
          overflowX: 'auto',
          paddingBottom: '0.5rem',
          marginBottom: '1.25rem',
        }}
      >
        {[
          { key: 'all', label: 'All Tasks' },
          { key: 'new', label: 'New Assigned' },
          { key: 'accepted', label: 'Accepted' },
          { key: 'active', label: 'In Transit / Out' },
          { key: 'delivered', label: 'Delivered' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: 8,
              border: 'none',
              background: filter === tab.key ? '#6366f1' : 'rgba(255, 255, 255, 0.05)',
              color: filter === tab.key ? 'white' : '#94a3b8',
              fontSize: '0.82rem',
              fontWeight: 600,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'all 0.2s',
            }}
          >
            {tab.label}
          </button>
        ))}
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

      {/* Orders List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem 0', color: '#94a3b8' }}>
          <RefreshCw size={28} className="spin-icon" style={{ margin: '0 auto 0.5rem' }} />
          <p>Fetching assigned delivery manifests…</p>
        </div>
      ) : orders.length === 0 ? (
        <div className="deliv-card" style={{ textAlign: 'center', padding: '3rem 1.5rem', color: '#94a3b8' }}>
          <Package size={42} style={{ margin: '0 auto 0.75rem', opacity: 0.4 }} />
          <h3 style={{ margin: '0 0 0.25rem', color: '#f8fafc' }}>No Orders Found</h3>
          <p style={{ margin: 0, fontSize: '0.85rem' }}>There are no deliveries matching the selected filter.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {orders.map((ord) => {
            const status = ord.deliveryStatus || 'Assigned';
            const firstVendor = ord.items?.[0]?.vendor;
            const isNew = status === 'Assigned';

            return (
              <div key={ord._id} className="deliv-order-card">
                <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem', marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <span style={{ fontSize: '1.1rem', fontWeight: 800, color: '#f8fafc' }}>
                      #{ord.orderId}
                    </span>
                    <span
                      className={`deliv-badge ${
                        status === 'Delivered'
                          ? 'deliv-badge-delivered'
                          : status === 'Out for Delivery'
                          ? 'deliv-badge-out'
                          : status === 'Picked Up'
                          ? 'deliv-badge-picked'
                          : status === 'Accepted'
                          ? 'deliv-badge-accepted'
                          : 'deliv-badge-assigned'
                      }`}
                    >
                      {status}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                      {new Date(ord.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Earnings:</span>
                    <span style={{ fontSize: '1.05rem', fontWeight: 800, color: '#34d399' }}>
                      +₹{ord.deliveryFee || 50}
                    </span>
                  </div>
                </div>

                {/* Vendor Pickup & Customer Dropoff Grid */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                    gap: '1rem',
                    background: '#0f172a',
                    padding: '1rem',
                    borderRadius: 12,
                    marginBottom: '1rem',
                  }}
                >
                  {/* Pickup Info */}
                  <div>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#f59e0b', textTransform: 'uppercase', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Store size={14} /> 1. Vendor Pickup Location
                    </div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#f8fafc' }}>
                      {firstVendor?.storeName || firstVendor?.name || 'Appsica Central Warehouse'}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: 2 }}>
                      {firstVendor?.businessAddress || '402 Innovation Way, Tech Park, Bangalore'}
                    </div>
                  </div>

                  {/* Delivery Dropoff Info */}
                  <div>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#10b981', textTransform: 'uppercase', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <MapPin size={14} /> 2. Customer Delivery Destination
                    </div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#f8fafc' }}>
                      {ord.shippingAddress?.fullName} • {ord.shippingAddress?.phone}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: 2 }}>
                      {ord.shippingAddress?.addressLine}, {ord.shippingAddress?.city} ({ord.shippingAddress?.pincode})
                    </div>
                  </div>
                </div>

                {/* Parcel Summary & Payment Details */}
                <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem', fontSize: '0.85rem' }}>
                  <div style={{ color: '#cbd5e1' }}>
                    <strong>Parcel:</strong> {ord.items?.length || 1} item(s) • Total Order Value: <strong>{formatPrice(ord.total || 0)}</strong> ({ord.paymentMethod?.toUpperCase()} - {ord.paymentStatus})
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    {isNew ? (
                      <>
                        <button
                          onClick={() => setRejectModal({ open: true, order: ord, reason: 'Route not accessible' })}
                          className="deliv-btn deliv-btn-danger"
                          style={{ minHeight: 38, padding: '0 14px', fontSize: '0.82rem' }}
                        >
                          Decline
                        </button>
                        <button
                          onClick={() => handleAccept(ord.orderId)}
                          className="deliv-btn deliv-btn-success"
                          style={{ minHeight: 38, padding: '0 16px', fontSize: '0.82rem' }}
                        >
                          <CheckCircle size={15} /> Accept Assignment
                        </button>
                      </>
                    ) : status === 'Accepted' || status === 'Arrived at Pickup' ? (
                      <Link
                        to="/delivery/pickups"
                        className="deliv-btn deliv-btn-primary"
                        style={{ minHeight: 38, padding: '0 16px', fontSize: '0.82rem' }}
                      >
                        <Store size={15} /> Go to Pickup Hub →
                      </Link>
                    ) : (
                      <Link
                        to="/delivery/active"
                        className="deliv-btn deliv-btn-primary"
                        style={{ minHeight: 38, padding: '0 16px', fontSize: '0.82rem' }}
                      >
                        <Truck size={15} /> Active Delivery & OTP →
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Reject Assignment Modal */}
      {rejectModal.open && (
        <div className="deliv-modal-overlay" onClick={() => setRejectModal({ open: false, order: null, reason: '' })}>
          <div className="deliv-modal" onClick={(e) => e.stopPropagation()}>
            <h3 style={{ margin: '0 0 0.5rem', color: '#f8fafc' }}>
              Decline Assignment #{rejectModal.order?.orderId}
            </h3>
            <p style={{ fontSize: '0.85rem', color: '#94a3b8', margin: '0 0 1rem' }}>
              Declining this order will return it to the administrative dispatch pool for another delivery partner.
            </p>

            <form onSubmit={handleRejectConfirm}>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#cbd5e1', marginBottom: 6 }}>
                Reason for Rejection
              </label>
              <select
                value={rejectModal.reason}
                onChange={(e) => setRejectModal({ ...rejectModal, reason: e.target.value })}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  background: '#0f172a',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: 10,
                  color: '#f8fafc',
                  fontSize: '0.88rem',
                  marginBottom: '1.25rem',
                }}
              >
                <option value="Route not accessible / heavy traffic">Route not accessible / heavy traffic</option>
                <option value="Vehicle issue or breakdown">Vehicle issue or breakdown</option>
                <option value="Shift ending soon">Shift ending soon</option>
                <option value="Distance exceeds delivery perimeter">Distance exceeds delivery perimeter</option>
                <option value="Other emergency">Other personal emergency</option>
              </select>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setRejectModal({ open: false, order: null, reason: '' })}
                  className="deliv-btn deliv-btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={rejecting}
                  className="deliv-btn deliv-btn-danger"
                >
                  {rejecting ? 'Declining…' : 'Confirm Decline'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
