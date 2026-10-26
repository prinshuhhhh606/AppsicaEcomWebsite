import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import {
  Package,
  Store,
  Truck,
  CheckCircle,
  AlertTriangle,
  DollarSign,
  TrendingUp,
  RefreshCw,
  ArrowRight,
  Clock,
  MapPin,
  Bike
} from 'lucide-react';
import { deliveryService } from '../../services/deliveryService';
import { formatPrice } from '../../utils/formatPrice';
import { AuthContext } from '../../context/AuthContextValue';

export default function DeliveryDashboard() {
  const { user } = useContext(AuthContext);
  const [stats, setStats] = useState(null);
  const [recentAssignments, setRecentAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadDashboard = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await deliveryService.getDashboard();
      if (res?.success) {
        setStats(res.stats || {});
        setRecentAssignments(res.recentAssignments || []);
      }
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Failed to load delivery statistics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  return (
    <div>
      {/* Welcome Banner */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
          marginBottom: '1.5rem',
          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(99, 102, 241, 0.1) 100%)',
          padding: '1.5rem',
          borderRadius: 16,
          border: '1px solid rgba(16, 185, 129, 0.25)',
        }}
      >
        <div>
          <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#34d399', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            RIDER DISPATCH CONSOLE
          </span>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, margin: '0.25rem 0', color: '#f8fafc' }}>
            Welcome back, {user?.name || 'Rider'}!
          </h2>
          <p style={{ margin: 0, fontSize: '0.85rem', color: '#94a3b8' }}>
            Vehicle: <strong style={{ color: '#cbd5e1' }}>{user?.vehicleNumber || 'MH-02-CD-5678'}</strong> ({user?.vehicleType || 'bike'}) • City: {user?.deliveryCity || 'Mumbai'}
          </p>
        </div>

        <button
          className="deliv-btn deliv-btn-secondary"
          onClick={loadDashboard}
          disabled={loading}
          style={{ gap: '0.5rem', minHeight: 40 }}
        >
          <RefreshCw size={16} className={loading ? 'spin-icon' : ''} />
          <span>{loading ? 'Refreshing…' : 'Sync Feed'}</span>
        </button>
      </div>

      {error && (
        <div
          style={{
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: 12,
            padding: '1rem',
            marginBottom: '1.5rem',
            color: '#f87171',
          }}
        >
          {error}
        </div>
      )}

      {/* Primary Metrics Grid */}
      <div className="deliv-stats-grid">
        <div className="deliv-stat-box">
          <div className="deliv-stat-icon" style={{ background: 'rgba(99, 102, 241, 0.15)', color: '#818cf8' }}>
            <Package size={24} />
          </div>
          <div>
            <div className="deliv-stat-val">{stats?.totalAssigned || 0}</div>
            <div className="deliv-stat-lbl">Assigned Tasks</div>
          </div>
        </div>

        <div className="deliv-stat-box">
          <div className="deliv-stat-icon" style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24' }}>
            <Store size={24} />
          </div>
          <div>
            <div className="deliv-stat-val">{stats?.pendingPickups || 0}</div>
            <div className="deliv-stat-lbl">Pending Pickups</div>
          </div>
        </div>

        <div className="deliv-stat-box">
          <div className="deliv-stat-icon" style={{ background: 'rgba(168, 85, 247, 0.15)', color: '#c084fc' }}>
            <Truck size={24} />
          </div>
          <div>
            <div className="deliv-stat-val">{stats?.outForDelivery || 0}</div>
            <div className="deliv-stat-lbl">Out for Delivery</div>
          </div>
        </div>

        <div className="deliv-stat-box">
          <div className="deliv-stat-icon" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#34d399' }}>
            <CheckCircle size={24} />
          </div>
          <div>
            <div className="deliv-stat-val">{stats?.deliveredOrders || 0}</div>
            <div className="deliv-stat-lbl">Completed Trips</div>
          </div>
        </div>

        <div className="deliv-stat-box">
          <div className="deliv-stat-icon" style={{ background: 'rgba(6, 182, 212, 0.15)', color: '#22d3ee' }}>
            <DollarSign size={24} />
          </div>
          <div>
            <div className="deliv-stat-val">{formatPrice(stats?.todayEarnings || 0)}</div>
            <div className="deliv-stat-lbl">Today's Earnings</div>
          </div>
        </div>
      </div>

      {/* Quick Action Navigation Buttons */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '1rem',
          marginBottom: '2rem',
        }}
      >
        <Link
          to="/delivery/pickups"
          className="deliv-card"
          style={{
            textDecoration: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 0,
            borderLeft: '4px solid #f59e0b',
          }}
        >
          <div>
            <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#f8fafc' }}>Vendor Pickups</div>
            <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Parcels ready at seller store</div>
          </div>
          <ArrowRight size={18} color="#f59e0b" />
        </Link>

        <Link
          to="/delivery/active"
          className="deliv-card"
          style={{
            textDecoration: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 0,
            borderLeft: '4px solid #818cf8',
          }}
        >
          <div>
            <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#f8fafc' }}>Active Deliveries</div>
            <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>In transit & OTP verification</div>
          </div>
          <ArrowRight size={18} color="#818cf8" />
        </Link>

        <Link
          to="/delivery/earnings"
          className="deliv-card"
          style={{
            textDecoration: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 0,
            borderLeft: '4px solid #10b981',
          }}
        >
          <div>
            <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#f8fafc' }}>Earnings & Ledger</div>
            <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Total: {formatPrice(stats?.totalEarnings || 0)}</div>
          </div>
          <ArrowRight size={18} color="#10b981" />
        </Link>
      </div>

      {/* Recent Assignments Section */}
      <div className="deliv-card">
        <div className="deliv-card-header">
          <h3 className="deliv-card-title">
            <Package size={18} color="#6366f1" />
            <span>Recent Assigned Orders</span>
          </h3>
          <Link
            to="/delivery/assigned"
            style={{ fontSize: '0.82rem', color: '#818cf8', textDecoration: 'none', fontWeight: 600 }}
          >
            View All ({recentAssignments.length}) →
          </Link>
        </div>

        {recentAssignments.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2.5rem 1rem', color: '#94a3b8' }}>
            <Package size={36} style={{ margin: '0 auto 0.75rem', opacity: 0.5 }} />
            <p style={{ margin: 0 }}>No active deliveries currently assigned.</p>
            <p style={{ fontSize: '0.82rem', marginTop: 4 }}>You will be notified as soon as an order is routed to your zone.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {recentAssignments.map((ord) => {
              const status = ord.deliveryStatus || 'Assigned';
              return (
                <div
                  key={ord._id}
                  style={{
                    background: '#0f172a',
                    border: '1px solid rgba(255, 255, 255, 0.06)',
                    borderRadius: 12,
                    padding: '1rem',
                    display: 'flex',
                    flexWrap: 'wrap',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '1rem',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: 4 }}>
                      <span style={{ fontWeight: 700, fontSize: '0.95rem', color: '#f8fafc' }}>
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
                    </div>

                    <div style={{ fontSize: '0.82rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <MapPin size={14} color="#64748b" />
                      <span>{ord.shippingAddress?.fullName} • {ord.shippingAddress?.city} ({ord.shippingAddress?.pincode})</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Payout</div>
                      <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#34d399' }}>
                        +₹{ord.deliveryFee || 50}
                      </div>
                    </div>

                    <Link
                      to={status === 'Assigned' ? '/delivery/assigned' : status === 'Accepted' || status === 'Arrived at Pickup' ? '/delivery/pickups' : '/delivery/active'}
                      className="deliv-btn deliv-btn-secondary"
                      style={{ padding: '6px 14px', minHeight: 36, fontSize: '0.82rem' }}
                    >
                      Action →
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
