import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Package,
  Bike,
  Truck,
  MapPin,
  Store,
  User,
  Phone,
  Clock,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Search,
  ArrowRight,
  ShieldCheck,
  Calendar,
  Layers,
  Activity,
  History,
  Compass
} from 'lucide-react';
import { adminService } from '../../../services/adminService';
import { formatPrice } from '../../../utils/formatPrice';

export default function DeliveryAssignments() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'assigned' | 'pending' | 'audits'

  // Assignment Audits State
  const [audits, setAudits] = useState([]);
  const [loadingAudits, setLoadingAudits] = useState(false);

  const loadAudits = async () => {
    setLoadingAudits(true);
    try {
      const res = await adminService.getAssignmentAudits();
      if (res?.success) {
        setAudits(res.audits || []);
      }
    } catch (e) {
      console.warn('Failed to load audits:', e.message);
    } finally {
      setLoadingAudits(false);
    }
  };

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await adminService.getPendingDeliveryAssignments();
      if (res?.success) {
        setOrders(res.orders || []);
      }
      loadAudits();
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Failed to load dispatch monitoring data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredOrders = orders.filter((o) => {
    const isAssigned = o.deliveryPartner && o.deliveryStatus !== 'Unassigned';
    if (activeTab === 'assigned' && !isAssigned) return false;
    if (activeTab === 'pending' && isAssigned) return false;

    if (!search) return true;
    const term = search.toLowerCase();
    return (
      o.orderId?.toLowerCase().includes(term) ||
      o.shippingAddress?.fullName?.toLowerCase().includes(term) ||
      o.shippingAddress?.city?.toLowerCase().includes(term) ||
      o.deliveryPartner?.name?.toLowerCase().includes(term) ||
      o.items?.some((it) => it.name?.toLowerCase().includes(term))
    );
  });

  const assignedCount = orders.filter((o) => o.deliveryPartner && o.deliveryStatus !== 'Unassigned').length;
  const pendingCount = orders.filter((o) => !o.deliveryPartner || o.deliveryStatus === 'Unassigned').length;

  return (
    <div>
      {/* Page Header */}
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
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, margin: '0 0 0.25rem', color: '#f8fafc' }}>
            Dispatch & Delivery Monitoring
          </h2>
          <p style={{ margin: 0, fontSize: '0.85rem', color: '#94a3b8' }}>
            Monitor real-time shipment status, seller pickup points, driver dispatch progress, and delivery completion.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <Link
            to="/admin/delivery-partners"
            className="admin-btn admin-btn-secondary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, textDecoration: 'none' }}
          >
            <Bike size={16} />
            <span>Delivery Fleet</span>
          </Link>

          <button
            onClick={loadData}
            className="admin-btn admin-btn-secondary"
            disabled={loading}
            style={{ minHeight: 38 }}
            title="Refresh dispatch data"
          >
            <RefreshCw size={16} className={loading ? 'spin-icon' : ''} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Info Notice: Seller-driven assignment rule */}
      <div
        style={{
          background: 'rgba(99, 102, 241, 0.08)',
          border: '1px solid rgba(99, 102, 241, 0.25)',
          borderRadius: 10,
          padding: '0.85rem 1.15rem',
          marginBottom: '1.25rem',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          fontSize: '0.84rem',
          color: '#cbd5e1',
        }}
      >
        <Activity size={18} color="#818cf8" style={{ flexShrink: 0 }} />
        <span>
          <strong>Operational Workflow:</strong> Sellers package their products and assign the Delivery Partner directly from the Seller Dashboard upon marking items <em>Ready for Pickup</em>. Admin monitors the fleet and dispatches below.
        </span>
      </div>

      {error && (
        <div style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 10, padding: '0.85rem 1rem', marginBottom: '1.25rem', color: '#f87171' }}>
          {error}
        </div>
      )}

      {/* Top Controls: Filter Tabs & Search */}
      <div className="admin-card" style={{ padding: '1rem 1.25rem', marginBottom: '1.5rem', display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            onClick={() => setActiveTab('all')}
            style={{
              padding: '0.45rem 1rem',
              borderRadius: 8,
              border: 'none',
              background: activeTab === 'all' ? '#6366f1' : 'rgba(255, 255, 255, 0.05)',
              color: activeTab === 'all' ? 'white' : '#94a3b8',
              fontSize: '0.82rem',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            All Shipments ({orders.length})
          </button>

          <button
            onClick={() => setActiveTab('assigned')}
            style={{
              padding: '0.45rem 1rem',
              borderRadius: 8,
              border: 'none',
              background: activeTab === 'assigned' ? '#6366f1' : 'rgba(255, 255, 255, 0.05)',
              color: activeTab === 'assigned' ? 'white' : '#94a3b8',
              fontSize: '0.82rem',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Assigned to Drivers ({assignedCount})
          </button>

          <button
            onClick={() => setActiveTab('pending')}
            style={{
              padding: '0.45rem 1rem',
              borderRadius: 8,
              border: 'none',
              background: activeTab === 'pending' ? '#6366f1' : 'rgba(255, 255, 255, 0.05)',
              color: activeTab === 'pending' ? 'white' : '#94a3b8',
              fontSize: '0.82rem',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Awaiting Seller Assignment ({pendingCount})
          </button>

          <button
            onClick={() => {
              setActiveTab('audits');
              loadAudits();
            }}
            style={{
              padding: '0.45rem 1rem',
              borderRadius: 8,
              border: 'none',
              background: activeTab === 'audits' ? '#6366f1' : 'rgba(255, 255, 255, 0.05)',
              color: activeTab === 'audits' ? 'white' : '#94a3b8',
              fontSize: '0.82rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
            }}
          >
            <History size={14} /> Smart Assignment Audits ({audits.length})
          </button>
        </div>

        <div style={{ position: 'relative', width: '100%', maxWidth: 300 }}>
          <Search size={16} style={{ position: 'absolute', left: 10, top: 11, color: '#64748b' }} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search order ID, driver, city…"
            style={{
              width: '100%',
              padding: '0.55rem 0.75rem 0.55rem 2.2rem',
              background: '#0f172a',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: 8,
              color: '#f8fafc',
              fontSize: '0.82rem',
              outline: 'none',
            }}
          />
        </div>
      </div>

      {/* Orders or Audits List */}
      {activeTab === 'audits' ? (
        <div className="admin-card" style={{ padding: '1.25rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#f8fafc', margin: '0 0 1rem', display: 'flex', alignItems: 'center', gap: 8 }}>
            <History size={18} style={{ color: '#818cf8' }} /> Chronological Driver Assignment & Dispatch Audits
          </h3>
          {loadingAudits ? (
            <p style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Loading audit history...</p>
          ) : audits.length === 0 ? (
            <p style={{ color: '#94a3b8', fontSize: '0.85rem' }}>No automatic assignment audit events recorded yet.</p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="admin-table" style={{ width: '100%', fontSize: '0.82rem' }}>
                <thead>
                  <tr>
                    <th>Timestamp</th>
                    <th>Order</th>
                    <th>Action</th>
                    <th>Driver Candidate</th>
                    <th>Search Radius</th>
                    <th>Distance & ETA</th>
                    <th>Reason / Details</th>
                  </tr>
                </thead>
                <tbody>
                  {audits.map((a) => (
                    <tr key={a._id}>
                      <td style={{ color: '#94a3b8' }}>
                        {new Date(a.createdAt).toLocaleString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td><strong>#{a.orderId}</strong></td>
                      <td>
                        <span
                          style={{
                            fontSize: '0.72rem',
                            padding: '2px 8px',
                            borderRadius: 6,
                            fontWeight: 700,
                            background:
                              a.action === 'OFFER_ACCEPTED'
                                ? 'rgba(16, 185, 129, 0.2)'
                                : a.action === 'OFFER_REJECTED' || a.action === 'OFFER_EXPIRED'
                                ? 'rgba(239, 68, 68, 0.2)'
                                : a.action === 'OFFER_SENT'
                                ? 'rgba(99, 102, 241, 0.2)'
                                : 'rgba(245, 158, 11, 0.2)',
                            color:
                              a.action === 'OFFER_ACCEPTED'
                                ? '#34d399'
                                : a.action === 'OFFER_REJECTED' || a.action === 'OFFER_EXPIRED'
                                ? '#f87171'
                                : a.action === 'OFFER_SENT'
                                ? '#818cf8'
                                : '#fbbf24',
                          }}
                        >
                          {a.action}
                        </span>
                      </td>
                      <td>{a.driverName || 'N/A'}</td>
                      <td>{a.searchRadiusKm ? `${a.searchRadiusKm} km` : '—'}</td>
                      <td>
                        {a.distanceToPickupKm ? `${a.distanceToPickupKm} km (~${a.estimatedMinutes}m)` : '—'}
                      </td>
                      <td style={{ color: '#94a3b8' }}>{a.reason || 'Auto-dispatched by engine'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : loading ? (
        <div className="admin-card" style={{ textAlign: 'center', padding: '4rem 1rem', color: '#94a3b8' }}>
          <RefreshCw size={32} className="spin-icon" style={{ margin: '0 auto 0.75rem' }} />
          <p style={{ margin: 0 }}>Scanning dispatch queue and delivery statuses…</p>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="admin-card" style={{ textAlign: 'center', padding: '4rem 1rem', color: '#94a3b8' }}>
          <CheckCircle size={44} style={{ margin: '0 auto 0.75rem', color: '#34d399', opacity: 0.6 }} />
          <h3 style={{ color: '#f8fafc', fontSize: '1.1rem', margin: '0 0 0.25rem' }}>No Orders in this Queue</h3>
          <p style={{ margin: 0, fontSize: '0.85rem' }}>
            No dispatch records match the selected filter.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {filteredOrders.map((order) => {
            const isAssigned = order.deliveryPartner && order.deliveryStatus !== 'Unassigned';
            const pickupLocations = order.pickupLocations || [];

            return (
              <div
                key={order._id}
                className="admin-card"
                style={{
                  padding: '1.25rem',
                  border: isAssigned ? '1px solid rgba(56, 189, 248, 0.25)' : '1px solid rgba(255, 255, 255, 0.08)',
                  background: '#111827',
                }}
              >
                {/* Order Header */}
                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '0.75rem',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                    paddingBottom: '1rem',
                    marginBottom: '1rem',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ background: isAssigned ? '#0284c7' : '#6366f1', color: 'white', padding: 8, borderRadius: 8 }}>
                      <Package size={18} />
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <h4 style={{ margin: 0, color: '#f8fafc', fontSize: '1.05rem', fontWeight: 800 }}>
                          #{order.orderId}
                        </h4>
                        <span
                          style={{
                            fontSize: '0.75rem',
                            padding: '2px 8px',
                            borderRadius: 6,
                            fontWeight: 700,
                            background:
                              order.orderStatus === 'Packed' || order.orderStatus === 'Ready for Pickup'
                                ? 'rgba(52, 211, 153, 0.15)'
                                : 'rgba(99, 102, 241, 0.15)',
                            color:
                              order.orderStatus === 'Packed' || order.orderStatus === 'Ready for Pickup'
                                ? '#34d399'
                                : '#818cf8',
                          }}
                        >
                          {order.orderStatus}
                        </span>
                        <span
                          style={{
                            fontSize: '0.75rem',
                            padding: '2px 8px',
                            borderRadius: 6,
                            fontWeight: 700,
                            background: isAssigned ? 'rgba(56, 189, 248, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                            color: isAssigned ? '#38bdf8' : '#fbbf24',
                          }}
                        >
                          Delivery: {order.deliveryStatus}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: 2 }}>
                        Placed on {new Date(order.createdAt).toLocaleString()} • {formatPrice(order.total)} • Payment: {order.paymentStatus} ({order.paymentMethod})
                      </div>
                    </div>
                  </div>

                  {/* Driver Info or Pending Tag */}
                  {isAssigned ? (
                    <div
                      style={{
                        fontSize: '0.82rem',
                        background: 'rgba(56, 189, 248, 0.12)',
                        border: '1px solid rgba(56, 189, 248, 0.25)',
                        padding: '6px 14px',
                        borderRadius: 8,
                        color: '#38bdf8',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                      }}
                    >
                      <Bike size={16} />
                      <div>
                        <strong>Assigned Driver:</strong> {order.deliveryPartner?.name || 'Driver'} ({order.deliveryPartner?.phone || 'No phone'})
                      </div>
                    </div>
                  ) : (
                    <div
                      style={{
                        fontSize: '0.78rem',
                        background: 'rgba(245, 158, 11, 0.1)',
                        border: '1px dashed rgba(245, 158, 11, 0.3)',
                        padding: '6px 12px',
                        borderRadius: 8,
                        color: '#fbbf24',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                      }}
                    >
                      <Clock size={14} />
                      <span>Awaiting Seller Assignment</span>
                    </div>
                  )}
                </div>

                {/* Pickup and Destination Details */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem', marginBottom: '1.25rem' }}>
                  {/* Seller Pickup Locations */}
                  <div
                    style={{
                      background: 'rgba(15, 23, 42, 0.6)',
                      borderRadius: 10,
                      padding: '1rem',
                      border: '1px solid rgba(255, 255, 255, 0.05)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700, fontSize: '0.85rem', color: '#cbd5e1', marginBottom: '0.75rem' }}>
                      <Store size={15} color="#818cf8" />
                      <span>Seller Pickup Locations ({pickupLocations.length} store{pickupLocations.length > 1 ? 's' : ''})</span>
                    </div>

                    {pickupLocations.length === 0 ? (
                      <p style={{ margin: 0, fontSize: '0.8rem', color: '#94a3b8' }}>Appsica Central Warehouse Hub</p>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {pickupLocations.map((loc, idx) => (
                          <div key={idx} style={{ background: '#1e293b', padding: '0.65rem 0.8rem', borderRadius: 8 }}>
                            <div style={{ fontWeight: 700, fontSize: '0.82rem', color: '#f8fafc' }}>
                              {loc.storeName}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 4, margin: '2px 0' }}>
                              <MapPin size={12} color="#f87171" /> {loc.address}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: '#cbd5e1' }}>
                              Contact: {loc.contactName} ({loc.phone})
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Customer Destination */}
                  <div
                    style={{
                      background: 'rgba(15, 23, 42, 0.6)',
                      borderRadius: 10,
                      padding: '1rem',
                      border: '1px solid rgba(255, 255, 255, 0.05)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700, fontSize: '0.85rem', color: '#cbd5e1', marginBottom: '0.75rem' }}>
                      <MapPin size={15} color="#34d399" />
                      <span>Customer Delivery Destination</span>
                    </div>

                    <div style={{ background: '#1e293b', padding: '0.65rem 0.8rem', borderRadius: 8 }}>
                      <div style={{ fontWeight: 700, fontSize: '0.82rem', color: '#f8fafc' }}>
                        {order.shippingAddress?.fullName}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#94a3b8', margin: '2px 0' }}>
                        {order.shippingAddress?.addressLine}, {order.shippingAddress?.city}, {order.shippingAddress?.state} - {order.shippingAddress?.pincode}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#cbd5e1', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Phone size={12} /> Contact: {order.shippingAddress?.phone}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Products */}
                <div>
                  <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#94a3b8', marginBottom: '0.5rem', textTransform: 'uppercase' }}>
                    Package Contents
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
                    {(order.items || []).map((item, iIdx) => (
                      <div
                        key={iIdx}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8,
                          background: '#1e293b',
                          padding: '0.45rem 0.75rem',
                          borderRadius: 8,
                          fontSize: '0.8rem',
                          color: '#e2e8f0',
                        }}
                      >
                        {item.image || item.product?.images?.[0] ? (
                          <img
                            src={item.image || item.product?.images?.[0]}
                            alt={item.name}
                            style={{ width: 28, height: 28, objectFit: 'cover', borderRadius: 4 }}
                          />
                        ) : (
                          <Package size={16} color="#818cf8" />
                        )}
                        <span>
                          <strong>{item.name}</strong> × {item.quantity} ({formatPrice(item.price)})
                        </span>
                        <span
                          style={{
                            fontSize: '0.7rem',
                            padding: '1px 6px',
                            borderRadius: 4,
                            background: 'rgba(99, 102, 241, 0.2)',
                            color: '#818cf8',
                          }}
                        >
                          {item.itemStatus || 'Packed'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
