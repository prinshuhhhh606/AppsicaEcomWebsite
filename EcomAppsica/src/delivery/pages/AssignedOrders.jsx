import React, { useState, useEffect, useContext } from 'react';
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
  AlertCircle,
  Compass,
  Navigation,
  Truck
} from 'lucide-react';
import { deliveryService } from '../../services/deliveryService';
import { formatPrice } from '../../utils/formatPrice';
import { getSocket } from '../../services/socket';
import { AuthContext } from '../../context/AuthContextValue';

export default function AssignedOrders() {
  const { user } = useContext(AuthContext);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');

  // Reject Modal State
  const [rejectModal, setRejectModal] = useState({ open: false, order: null, reason: '' });
  const [rejecting, setRejecting] = useState(false);
  const [currentTime, setCurrentTime] = useState(Date.now());

  // 1-second interval to drive live second-by-second countdown for active offers
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

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

  const [locUpdating, setLocUpdating] = useState(false);
  const [locSuccess, setLocSuccess] = useState('');

  // Socket.IO real-time offer listener
  useEffect(() => {
    let socket;
    try {
      socket = getSocket();
      if (socket) {
        const userId = user?._id || user?.id || (() => {
          try {
            const raw = localStorage.getItem('appsica_user');
            if (raw) return JSON.parse(raw)._id || JSON.parse(raw).id;
          } catch (e) {}
          return null;
        })();

        const onOffer = () => {
          loadOrders();
        };

        socket.on('order:offer_sent', onOffer);
        socket.on('order:assigned', onOffer);
        socket.on('order:offer_declined', onOffer);
        socket.on('order:declined', onOffer);
        socket.on('order:offer_expired', onOffer);
        socket.on('order:accepted', onOffer);

        if (userId) {
          socket.on(`driver:${userId}:offer`, onOffer);
          socket.on(`driver:${userId}:assigned`, onOffer);
          socket.on(`driver:${userId}:offer_expired`, onOffer);
          socket.on(`driver:${userId}:accepted`, onOffer);
          socket.on(`driver:${userId}:declined`, onOffer);
        }

        return () => {
          socket.off('order:offer_sent', onOffer);
          socket.off('order:assigned', onOffer);
          socket.off('order:offer_declined', onOffer);
          socket.off('order:declined', onOffer);
          socket.off('order:offer_expired', onOffer);
          socket.off('order:accepted', onOffer);
          if (userId) {
            socket.off(`driver:${userId}:offer`, onOffer);
            socket.off(`driver:${userId}:assigned`, onOffer);
            socket.off(`driver:${userId}:offer_expired`, onOffer);
            socket.off(`driver:${userId}:accepted`, onOffer);
            socket.off(`driver:${userId}:declined`, onOffer);
          }
        };
      }
    } catch (e) {}
  }, [user]);

  const handleUpdateGps = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      return;
    }
    setLocUpdating(true);
    setLocSuccess('');
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords;
          await deliveryService.updateLocation(latitude, longitude, 'Live GPS Position');
          setLocSuccess('GPS Location Updated!');
          setTimeout(() => setLocSuccess(''), 4000);
        } catch (err) {
          alert('Failed to update server with GPS location');
        } finally {
          setLocUpdating(false);
        }
      },
      (err) => {
        setLocUpdating(false);
        alert(`Location access denied or unavailable: ${err.message}`);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
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

        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <button
            type="button"
            className="deliv-btn deliv-btn-secondary"
            onClick={handleUpdateGps}
            disabled={locUpdating}
            style={{ minHeight: 38, fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap' }}
          >
            <Compass size={15} className={locUpdating ? 'animate-spin' : ''} />
            {locUpdating ? 'Updating GPS...' : 'Update My GPS'}
          </button>

          <button
            type="button"
            className="deliv-btn deliv-btn-secondary"
            onClick={loadOrders}
            disabled={loading}
            style={{ minHeight: 38, fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap' }}
            title="Sync assigned deliveries"
          >
            <RefreshCw size={15} className={loading ? 'spin-icon' : ''} />
            <span>Sync</span>
          </button>

          <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '0.5rem', width: '100%', maxWidth: 260 }}>
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
      </div>

      {locSuccess && (
        <div style={{ background: 'rgba(16, 185, 129, 0.15)', border: '1px solid #10b981', color: '#34d399', padding: '0.65rem 1rem', borderRadius: 8, marginBottom: '1rem', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: 8 }}>
          <CheckCircle size={16} /> {locSuccess}
        </div>
      )}

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
        <div className="deliv-card" style={{ textAlign: 'center', padding: '3.5rem 1.5rem', color: '#94a3b8' }}>
          <Package size={48} style={{ margin: '0 auto 0.75rem', opacity: 0.35, color: '#818cf8' }} />
          <h3 style={{ margin: '0 0 0.4rem', color: '#f8fafc', fontSize: '1.15rem', fontWeight: 700 }}>No assigned orders yet</h3>
          <p style={{ margin: 0, fontSize: '0.88rem', color: '#94a3b8', maxWidth: 420, marginLeft: 'auto', marginRight: 'auto' }}>
            There are no orders assigned to you at the moment. New deliveries assigned by sellers will appear here in real time.
          </p>
          <button
            type="button"
            onClick={loadOrders}
            className="deliv-btn deliv-btn-secondary"
            style={{ marginTop: '1.25rem', display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: '0.82rem' }}
          >
            <RefreshCw size={14} /> Refresh Deliveries
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {orders.map((ord) => {
            const rawStatus = ord.deliveryStatus || ord.orderStatus || 'Assigned';
            const status = rawStatus.charAt(0).toUpperCase() + rawStatus.slice(1);
            const statusLower = rawStatus.toLowerCase();
            const firstVendor = ord.items?.[0]?.vendor;
            const isOffer = status === 'Offer Sent' || status === 'Driver Offer Sent';
            const isAssigned = statusLower === 'assigned' || isOffer;
            const isAccepted = statusLower === 'accepted' || status === 'Arrived at Pickup' || status === 'Reached Pickup';
            const isActive = status === 'Picked Up' || status === 'In Transit' || status === 'Out for Delivery';

            let secondsLeft = 60;
            if (isOffer && ord.currentAssignmentOffer?.expiresAt) {
              const diff = Math.floor((new Date(ord.currentAssignmentOffer.expiresAt).getTime() - currentTime) / 1000);
              secondsLeft = Math.max(0, diff);
            }

            return (
              <div key={ord._id} className="deliv-order-card">
                {isOffer && (
                  <div
                    style={{
                      background: secondsLeft <= 15 ? 'rgba(239, 68, 68, 0.2)' : 'rgba(234, 179, 8, 0.15)',
                      border: secondsLeft <= 15 ? '1px solid #ef4444' : '1px solid #eab308',
                      padding: '0.85rem 1.15rem',
                      borderRadius: 10,
                      marginBottom: '1rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: '0.75rem',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div
                        style={{
                          background: secondsLeft <= 15 ? '#ef4444' : '#eab308',
                          color: '#0f172a',
                          borderRadius: '50%',
                          width: 40,
                          height: 40,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 800,
                          fontSize: '0.95rem',
                        }}
                      >
                        {secondsLeft}s
                      </div>
                      <div>
                        <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#f8fafc', display: 'flex', alignItems: 'center', gap: 6 }}>
                          <Clock size={16} /> LIVE DELIVERY OFFER — Expiring in {secondsLeft} seconds
                        </div>
                        <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: 2 }}>
                          {secondsLeft > 0
                            ? 'Accept or reject before timer expires. If expired, order will automatically re-route to the next nearest driver.'
                            : 'Offer expired! Re-routing order to next nearest partner...'}
                        </div>
                      </div>
                    </div>

                    {ord.currentAssignmentOffer?.distanceKm !== undefined && (
                      <span style={{ fontSize: '0.85rem', color: '#38bdf8', fontWeight: 600 }}>
                        📍 Pickup is <strong>{ord.currentAssignmentOffer.distanceKm} km</strong> away (~{ord.currentAssignmentOffer.estimatedMinutes || 15} mins)
                      </span>
                    )}
                  </div>
                )}
                <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem', marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
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
                          : isAccepted
                          ? 'deliv-badge-accepted'
                          : 'deliv-badge-assigned'
                      }`}
                    >
                      {status}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                      Assigned: {new Date(ord.deliveryAssignedAt || ord.updatedAt || ord.createdAt).toLocaleString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
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
                      {ord.pickupLocation?.storeName || firstVendor?.storeName || firstVendor?.name || 'Appsica Central Warehouse'}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: 2 }}>
                      {ord.pickupLocation?.address || firstVendor?.businessAddress || 'Store Pickup Center'}
                    </div>
                    {ord.currentAssignmentOffer?.distanceKm !== undefined && (
                      <div style={{ fontSize: '0.75rem', color: '#38bdf8', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Navigation size={12} /> Distance to Pickup: {ord.currentAssignmentOffer.distanceKm} km (~{ord.currentAssignmentOffer.estimatedMinutes || 15} mins)
                      </div>
                    )}
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

                {/* Ordered Items Preview */}
                {ord.items && ord.items.length > 0 && (
                  <div
                    style={{
                      background: 'rgba(255, 255, 255, 0.02)',
                      border: '1px solid rgba(255, 255, 255, 0.06)',
                      borderRadius: 10,
                      padding: '0.75rem 1rem',
                      marginBottom: '1rem',
                    }}
                  >
                    <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 6 }}>
                      Parcel Items ({ord.items.length})
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {ord.items.map((it, idx) => (
                        <div key={it._id || idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.82rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            {it.image && (
                              <img src={it.image} alt={it.name} style={{ width: 30, height: 30, borderRadius: 6, objectFit: 'cover' }} />
                            )}
                            <div>
                              <span style={{ color: '#f1f5f9', fontWeight: 600 }}>{it.name}</span>
                              <span style={{ color: '#94a3b8', fontSize: '0.74rem', marginLeft: 6 }}>× {it.quantity}</span>
                            </div>
                          </div>
                          <span style={{ color: '#cbd5e1', fontWeight: 600 }}>{formatPrice((it.price || 0) * (it.quantity || 1))}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Parcel Summary & Payment Details */}
                <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem', fontSize: '0.85rem' }}>
                  <div style={{ color: '#cbd5e1' }}>
                    <strong>Parcel:</strong> {ord.items?.length || 1} item(s) • Total: <strong>{formatPrice(ord.total || 0)}</strong> ({ord.paymentMethod?.toUpperCase()} - {ord.paymentStatus})
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    {isAssigned ? (
                      <>
                        <button
                          type="button"
                          onClick={() => setRejectModal({ open: true, order: ord, reason: 'Route not accessible' })}
                          className="deliv-btn deliv-btn-danger"
                          style={{ minHeight: 38, padding: '0 16px', fontSize: '0.82rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 6 }}
                        >
                          <XCircle size={15} /> Decline Order
                        </button>
                        <button
                          type="button"
                          onClick={() => handleAccept(ord.orderId)}
                          disabled={isOffer && secondsLeft === 0}
                          className="deliv-btn deliv-btn-success"
                          style={{
                            minHeight: 38,
                            padding: '0 18px',
                            fontSize: '0.82rem',
                            fontWeight: 700,
                            opacity: isOffer && secondsLeft === 0 ? 0.5 : 1,
                            cursor: isOffer && secondsLeft === 0 ? 'not-allowed' : 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 6,
                          }}
                        >
                          <CheckCircle size={15} /> Accept Order {isOffer ? `(${secondsLeft}s)` : ''}
                        </button>
                      </>
                    ) : isAccepted ? (
                      <Link
                        to="/delivery/pickups"
                        className="deliv-btn deliv-btn-primary"
                        style={{ minHeight: 38, padding: '0 16px', fontSize: '0.82rem', display: 'inline-flex', alignItems: 'center', gap: 6 }}
                      >
                        <Store size={15} /> Go to Pickup Hub →
                      </Link>
                    ) : (
                      <Link
                        to="/delivery/active"
                        className="deliv-btn deliv-btn-primary"
                        style={{ minHeight: 38, padding: '0 16px', fontSize: '0.82rem', display: 'inline-flex', alignItems: 'center', gap: 6 }}
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
