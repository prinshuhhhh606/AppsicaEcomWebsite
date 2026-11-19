import React, { useState, useEffect, useContext, useCallback } from 'react';
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

  const loadDashboard = useCallback(async () => {
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
  }, []);

  useEffect(() => {
    let active = true;
    deliveryService
      .getDashboard()
      .then((res) => {
        if (!active) return;
        if (res?.success) {
          setStats(res.stats || {});
          setRecentAssignments(res.recentAssignments || []);
        }
      })
      .catch((err) => {
        if (!active) return;
        setError(err?.response?.data?.message || err?.message || 'Failed to load delivery statistics');
      })
      .finally(() => {
        if (!active) return;
        setLoading(false);
      });

    return () => {
      active = false;
    };
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
          background: '#ffffff',
          padding: '1.5rem',
          borderRadius: 16,
          border: '1px solid var(--deliv-border)',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
        }}
      >
        <div>
          <span style={{ fontSize: '0.74rem', fontWeight: 800, color: '#063b2c', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            RIDER DISPATCH CONSOLE
          </span>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, margin: '0.25rem 0', color: '#063b2c' }}>
            Welcome back, {user?.name || 'Rider'}!
          </h2>
          <p style={{ margin: 0, fontSize: '0.85rem', color: '#000000', fontWeight: 500 }}>
            Vehicle: <strong style={{ color: '#063b2c' }}>{user?.vehicleNumber || 'MH-02-CD-5678'}</strong> ({user?.vehicleType || 'bike'}) • City: {user?.deliveryCity || 'Mumbai'}
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
            borderLeft: '4px solid #d97706',
          }}
        >
          <div>
            <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#063b2c' }}>Vendor Pickups</div>
            <div style={{ fontSize: '0.8rem', color: '#000000', fontWeight: 500 }}>Parcels ready at seller store</div>
          </div>
          <ArrowRight size={18} color="#d97706" />
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
            borderLeft: '4px solid #063b2c',
          }}
        >
          <div>
            <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#063b2c' }}>Active Deliveries</div>
            <div style={{ fontSize: '0.8rem', color: '#000000', fontWeight: 500 }}>In transit & OTP verification</div>
          </div>
          <ArrowRight size={18} color="#063b2c" />
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
            borderLeft: '4px solid #059669',
          }}
        >
          <div>
            <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#063b2c' }}>Earnings & Ledger</div>
            <div style={{ fontSize: '0.8rem', color: '#000000', fontWeight: 500 }}>Total: {formatPrice(stats?.totalEarnings || 0)}</div>
          </div>
          <ArrowRight size={18} color="#059669" />
        </Link>
      </div>

      {/* Recent Assignments Section */}
      <div className="deliv-card">
        <div className="deliv-card-header">
          <h3 className="deliv-card-title">
            <Package size={18} color="#063b2c" />
            <span>Recent Assigned Orders</span>
          </h3>
          <Link
            to="/delivery/assigned"
            style={{ fontSize: '0.82rem', color: '#063b2c', textDecoration: 'none', fontWeight: 700 }}
          >
            View All ({recentAssignments.length}) →
          </Link>
        </div>

        {recentAssignments.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2.5rem 1rem', color: '#000000' }}>
            <Package size={36} color="#063b2c" style={{ margin: '0 auto 0.75rem' }} />
            <p style={{ margin: 0, fontWeight: 700 }}>No active deliveries currently assigned.</p>
            <p style={{ fontSize: '0.82rem', marginTop: 4, color: '#000000' }}>You will be notified as soon as an order is routed to your zone.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {recentAssignments.map((ord) => {
              const status = ord.deliveryStatus || 'Assigned';
              return (
                <div
                  key={ord._id}
                  style={{
                    background: '#f8f9f6',
                    border: '1px solid var(--deliv-border)',
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
                      <span style={{ fontWeight: 800, fontSize: '0.95rem', color: '#063b2c' }}>
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

                    <div style={{ fontSize: '0.82rem', color: '#000000', display: 'flex', alignItems: 'center', gap: 6, fontWeight: 500 }}>
                      <MapPin size={14} color="#063b2c" />
                      <span>{ord.shippingAddress?.fullName} • {ord.shippingAddress?.city} ({ord.shippingAddress?.pincode})</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '0.75rem', color: '#000000', fontWeight: 600 }}>Payout</div>
                      <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#063b2c' }}>
                        +₹{ord.deliveryFee || 50}
                      </div>
                    </div>

                    <Link
                      to={status === 'Assigned' ? '/delivery/assigned' : status === 'Accepted' || status === 'Arrived at Pickup' ? '/delivery/pickups' : '/delivery/active'}
                      className="deliv-btn deliv-btn-secondary"
                      style={{ padding: '6px 14px', minHeight: 36, fontSize: '0.82rem', color: '#000000', fontWeight: 700 }}
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
