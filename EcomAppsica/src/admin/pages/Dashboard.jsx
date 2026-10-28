import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  DollarSign,
  ShoppingBag,
  Package,
  Users,
  Store,
  Clock,
  CheckCircle,
  XCircle,
  Bike,
  AlertTriangle,
  RotateCcw,
  ArrowUpRight,
  TrendingUp,
  BarChart2,
  Calendar,
  Layers,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';
import { adminService } from '../../services/adminService';
import { formatPrice } from '../../utils/formatPrice';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [salesTrend, setSalesTrend] = useState([]);
  const [recentOrders, setRecentOrders] = useState([]);
  const [recentCustomers, setRecentCustomers] = useState([]);
  const [popularProducts, setPopularProducts] = useState([]);
  const [topVendors, setTopVendors] = useState([]);
  const [pendingDeliveryPartners, setPendingDeliveryPartners] = useState([]);
  const [deliveryActionLoading, setDeliveryActionLoading] = useState(null);
  const [deliveryActionMessage, setDeliveryActionMessage] = useState(null);
  const [timeframe, setTimeframe] = useState('monthly'); // daily, weekly, monthly, yearly
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadDashboard = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await adminService.getDashboardStats({ timeframe });
      if (res?.success) {
        setStats(res.stats || {});
        setSalesTrend(res.salesTrend || []);
        setRecentOrders(res.recentOrders || []);
        setRecentCustomers(res.recentCustomers || []);
        setPopularProducts(res.popularProducts || []);
        setTopVendors(res.topVendors || []);
      }
      try {
        const dRes = await adminService.getDeliveryPartners();
        if (dRes?.success) {
          const pending = (dRes.partners || []).filter((p) => p.deliveryStatus === 'pending');
          setPendingDeliveryPartners(pending);
        }
      } catch (dErr) {
        // quiet fallback
      }
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Failed to load live dashboard statistics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, [timeframe]);

  const handleApproveDelivery = async (partner) => {
    if (!window.confirm(`Approve delivery partner registration for "${partner.name}" (${partner.vehicleType} - ${partner.vehicleNumber || 'No reg'})?`)) {
      return;
    }
    setDeliveryActionLoading(partner._id);
    setDeliveryActionMessage(null);
    try {
      const res = await adminService.updateDeliveryPartnerStatus(partner._id, { status: 'approved' });
      if (res?.success) {
        setPendingDeliveryPartners((prev) => prev.filter((p) => p._id !== partner._id));
        setStats((prev) => prev ? { ...prev, pendingDeliveryPartners: Math.max(0, (prev.pendingDeliveryPartners || 1) - 1) } : prev);
        setDeliveryActionMessage({
          type: 'success',
          text: `✓ Delivery Partner "${partner.name}" approved successfully! Status updated in database and rider can now log in.`,
        });
        setTimeout(() => setDeliveryActionMessage(null), 5000);
      }
    } catch (err) {
      setDeliveryActionMessage({
        type: 'error',
        text: err?.response?.data?.message || err?.message || 'Failed to approve delivery partner',
      });
    } finally {
      setDeliveryActionLoading(null);
    }
  };

  const handleRejectDelivery = async (partner) => {
    const reason = window.prompt(`Enter rejection reason for "${partner.name}":`, 'Vehicle documentation or license verification criteria not fulfilled.');
    if (reason === null) return;

    setDeliveryActionLoading(partner._id);
    setDeliveryActionMessage(null);
    try {
      const res = await adminService.updateDeliveryPartnerStatus(partner._id, {
        status: 'rejected',
        rejectionReason: reason.trim(),
      });
      if (res?.success) {
        setPendingDeliveryPartners((prev) => prev.filter((p) => p._id !== partner._id));
        setStats((prev) => prev ? { ...prev, pendingDeliveryPartners: Math.max(0, (prev.pendingDeliveryPartners || 1) - 1) } : prev);
        setDeliveryActionMessage({
          type: 'success',
          text: `Delivery Partner application for "${partner.name}" marked as rejected. Status saved in database.`,
        });
        setTimeout(() => setDeliveryActionMessage(null), 5000);
      }
    } catch (err) {
      setDeliveryActionMessage({
        type: 'error',
        text: err?.response?.data?.message || err?.message || 'Failed to reject delivery partner',
      });
    } finally {
      setDeliveryActionLoading(null);
    }
  };

  const maxSaleValue = Math.max(...salesTrend.map((item) => item.sales || 0), 1000);

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
          marginBottom: '2rem',
          background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.12) 0%, rgba(6, 182, 212, 0.08) 100%)',
          padding: '1.5rem 1.75rem',
          borderRadius: '16px',
          border: '1px solid rgba(99, 102, 241, 0.25)',
        }}
      >
        <div>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#818cf8', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            APPSICA PLATFORM PULSE
          </span>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 800, margin: '0.25rem 0', color: '#f8fafc' }}>
            Enterprise Command Center
          </h2>
          <p style={{ margin: 0, fontSize: '0.88rem', color: '#94a3b8' }}>
            Real-time platform revenue, multi-vendor settlement ledger, customer acquisition, and fulfillment health.
          </p>
        </div>
        <button
          className="admin-btn admin-btn-secondary"
          onClick={loadDashboard}
          disabled={loading}
          style={{ gap: '0.5rem' }}
        >
          <RefreshCw size={16} className={loading ? 'spin-icon' : ''} />
          <span>{loading ? 'Synchronizing...' : 'Refresh Live Feed'}</span>
        </button>
      </div>

      {error && (
        <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', padding: '1rem', borderRadius: '10px', color: '#f87171', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <AlertTriangle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* PENDING APPROVALS ACTION BANNER */}
      {(stats?.pendingVendors > 0 || stats?.pendingProducts > 0 || pendingDeliveryPartners.length > 0) && (
        <div
          style={{
            background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.18) 0%, rgba(239, 68, 68, 0.12) 100%)',
            border: '1px solid rgba(245, 158, 11, 0.45)',
            borderRadius: '14px',
            padding: '1.25rem 1.5rem',
            marginBottom: '1.75rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '10px',
                background: 'rgba(245, 158, 11, 0.25)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fbbf24',
                flexShrink: 0,
              }}
            >
              <AlertTriangle size={22} />
            </div>
            <div>
              <h4 style={{ margin: 0, color: '#f8fafc', fontSize: '1.02rem', fontWeight: 700 }}>
                Pending Approvals Require Admin Review
              </h4>
              <p style={{ margin: '0.25rem 0 0', color: '#cbd5e1', fontSize: '0.85rem' }}>
                {stats?.pendingVendors > 0 && `${stats.pendingVendors} Seller account application(s) awaiting verification.`}
                {stats?.pendingVendors > 0 && stats?.pendingProducts > 0 && ' • '}
                {stats?.pendingProducts > 0 && `${stats.pendingProducts} Product submission(s) awaiting catalog approval.`}
                {(stats?.pendingVendors > 0 || stats?.pendingProducts > 0) && pendingDeliveryPartners.length > 0 && ' • '}
                {pendingDeliveryPartners.length > 0 && `${pendingDeliveryPartners.length} Delivery partner registration(s) awaiting approval.`}
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            {stats?.pendingVendors > 0 && (
              <Link
                to="/admin/pending-approval?tab=seller"
                className="admin-btn admin-btn-primary admin-btn-sm"
                style={{ textDecoration: 'none' }}
              >
                Review Seller Requests ({stats.pendingVendors})
              </Link>
            )}
            {stats?.pendingProducts > 0 && (
              <Link
                to="/admin/products?status=pending"
                className="admin-btn admin-btn-secondary admin-btn-sm"
                style={{ textDecoration: 'none' }}
              >
                Moderate Products ({stats.pendingProducts})
              </Link>
            )}
            {pendingDeliveryPartners.length > 0 && (
              <Link
                to="/admin/pending-approval?tab=delivery"
                className="admin-btn admin-btn-primary admin-btn-sm"
                style={{ textDecoration: 'none', background: '#0284c7', borderColor: '#0284c7' }}
              >
                Review Delivery Requests ({pendingDeliveryPartners.length})
              </Link>
            )}
          </div>
        </div>
      )}

      {/* PRIMARY 8 KPI STATS */}
      <div className="admin-stat-grid">
        {/* Total Platform Sales */}
        <div className="admin-stat-card">
          <div className="admin-stat-icon primary">
            <DollarSign size={22} />
          </div>
          <div className="admin-stat-label">Gross Platform Sales</div>
          <div className="admin-stat-value">{formatPrice(stats?.totalSales || 0)}</div>
          <div className="admin-stat-sub">
            <TrendingUp size={14} color="#10b981" />
            <span>Lifetime processed revenue</span>
          </div>
        </div>

        {/* Platform Commission Earned */}
        <div className="admin-stat-card">
          <div className="admin-stat-icon purple">
            <ShieldCheck size={22} />
          </div>
          <div className="admin-stat-label">Platform Commission</div>
          <div className="admin-stat-value">{formatPrice(stats?.platformRevenue || 0)}</div>
          <div className="admin-stat-sub">
            <span>Retained marketplace fee</span>
          </div>
        </div>

        {/* Total Orders */}
        <div className="admin-stat-card">
          <div className="admin-stat-icon secondary">
            <ShoppingBag size={22} />
          </div>
          <div className="admin-stat-label">Total Orders Placed</div>
          <div className="admin-stat-value">{stats?.totalOrders ?? 0}</div>
          <div className="admin-stat-sub">
            <span style={{ color: '#38bdf8' }}>{stats?.completedOrders ?? 0} Delivered</span>
            <span>•</span>
            <span style={{ color: '#f59e0b' }}>{stats?.pendingOrders ?? 0} In Flight</span>
          </div>
        </div>

        {/* Registered Customers */}
        <div className="admin-stat-card">
          <div className="admin-stat-icon success">
            <Users size={22} />
          </div>
          <div className="admin-stat-label">Total Registered Users</div>
          <div className="admin-stat-value">{stats?.totalCustomers ?? 0}</div>
          <div className="admin-stat-sub">
            <span>Active buyer accounts</span>
          </div>
        </div>

        {/* Vendors Status */}
        <div className="admin-stat-card">
          <div className="admin-stat-icon warning">
            <Store size={22} />
          </div>
          <div className="admin-stat-label">Marketplace Vendors</div>
          <div className="admin-stat-value">{stats?.totalVendors ?? 0}</div>
          <div className="admin-stat-sub">
            <span style={{ color: '#34d399' }}>{stats?.activeVendors ?? 0} Active</span>
            {stats?.pendingVendors > 0 && (
              <>
                <span>•</span>
                <span style={{ color: '#f87171', fontWeight: 700 }}>{stats?.pendingVendors} Pending Approval</span>
              </>
            )}
          </div>
        </div>

        {/* Products & Moderation */}
        <div className="admin-stat-card">
          <div className="admin-stat-icon primary">
            <Package size={22} />
          </div>
          <div className="admin-stat-label">Listed Products</div>
          <div className="admin-stat-value">{stats?.totalProducts ?? 0}</div>
          <div className="admin-stat-sub">
            <span>{stats?.pendingProducts ?? 0} Pending Moderation</span>
          </div>
        </div>

        {/* Refunds & Returns */}
        <div className="admin-stat-card">
          <div className="admin-stat-icon danger">
            <RotateCcw size={22} />
          </div>
          <div className="admin-stat-label">Refunds Processed</div>
          <div className="admin-stat-value">{formatPrice(stats?.totalRefundAmount || 0)}</div>
          <div className="admin-stat-sub">
            <span>{stats?.pendingReturnRequests ?? 0} dispute requests open</span>
          </div>
        </div>

        {/* Vendor Settlements */}
        <div className="admin-stat-card">
          <div className="admin-stat-icon secondary">
            <Clock size={22} />
          </div>
          <div className="admin-stat-label">Settled Payouts</div>
          <div className="admin-stat-value">{formatPrice(stats?.totalSettledPayouts || 0)}</div>
          <div className="admin-stat-sub">
            <span>{formatPrice(stats?.pendingPayoutsAmount || 0)} pending release</span>
          </div>
        </div>
      </div>

      {/* SALES TRENDS CHART WITH TIMEFRAME FILTERS */}
      <div className="admin-card" style={{ marginBottom: '2rem' }}>
        <div className="admin-card-header">
          <div>
            <h3 className="admin-card-title">
              <BarChart2 size={20} /> Sales Revenue & Order Velocity
            </h3>
            <p style={{ margin: '0.2rem 0 0', fontSize: '0.8rem', color: '#94a3b8' }}>
              Comparison of gross sales volume, order counts, and platform earnings over selected timeframe.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.4rem', background: 'rgba(255,255,255,0.04)', padding: '0.25rem', borderRadius: '8px', border: '1px solid rgba(148, 163, 184, 0.12)' }}>
            {['daily', 'weekly', 'monthly', 'yearly'].map((t) => (
              <button
                key={t}
                onClick={() => setTimeframe(t)}
                style={{
                  background: timeframe === t ? '#6366f1' : 'transparent',
                  color: timeframe === t ? '#fff' : '#94a3b8',
                  border: 'none',
                  padding: '0.35rem 0.75rem',
                  borderRadius: '6px',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  textTransform: 'capitalize',
                  transition: 'all 0.15s ease',
                }}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Interactive SVG Bar & Trend Chart */}
        <div style={{ height: '240px', display: 'flex', alignItems: 'flex-end', gap: '1.25rem', padding: '1rem 0.5rem 0' }}>
          {salesTrend.length === 0 ? (
            <div className="admin-empty-state" style={{ width: '100%' }}>No trend history available for this window</div>
          ) : (
            salesTrend.map((point, idx) => {
              const heightPercent = Math.max(12, Math.round(((point.sales || 0) / maxSaleValue) * 100));
              return (
                <div
                  key={idx}
                  style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    height: '100%',
                    justifyContent: 'flex-end',
                    gap: '0.5rem',
                  }}
                >
                  <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#f8fafc' }}>
                    {formatPrice(point.sales)}
                  </span>
                  <div
                    style={{
                      width: '100%',
                      maxWidth: '54px',
                      height: `${heightPercent}%`,
                      background: 'linear-gradient(180deg, #6366f1 0%, rgba(99, 102, 241, 0.35) 100%)',
                      borderRadius: '8px 8px 3px 3px',
                      border: '1px solid rgba(99, 102, 241, 0.6)',
                      transition: 'height 0.4s ease',
                      position: 'relative',
                    }}
                    title={`${point.label}: ${formatPrice(point.sales)} across ${point.orders} orders`}
                  />
                  <span style={{ fontSize: '0.72rem', color: '#94a3b8', textAlign: 'center', whiteSpace: 'nowrap' }}>
                    {point.label}
                  </span>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* TWO COLUMN GRID: TOP SELLERS & RECENT ORDERS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(480px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        {/* Recent Orders */}
        <div className="admin-card">
          <div className="admin-card-header">
            <h3 className="admin-card-title">
              <ShoppingBag size={18} /> Recent Customer Orders
            </h3>
            <Link to="/admin/orders" className="admin-btn admin-btn-secondary admin-btn-sm">
              View All &rarr;
            </Link>
          </div>

          <div className="admin-table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Customer</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Payment</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.length === 0 ? (
                  <tr>
                    <td colSpan="5" style={{ textAlign: 'center', padding: '2rem' }}>No orders yet</td>
                  </tr>
                ) : (
                  recentOrders.slice(0, 5).map((ord) => (
                    <tr key={ord._id}>
                      <td style={{ fontWeight: 600, color: '#818cf8', fontFamily: 'monospace' }}>
                        {ord.orderId}
                      </td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{ord.shippingAddress?.fullName || 'Guest'}</div>
                        <div style={{ fontSize: '0.72rem', color: '#64748b' }}>{new Date(ord.createdAt).toLocaleDateString()}</div>
                      </td>
                      <td style={{ fontWeight: 700 }}>{formatPrice(ord.total)}</td>
                      <td>
                        <span className={`admin-badge ${
                          ord.orderStatus === 'Delivered' ? 'success' :
                          ord.orderStatus === 'Cancelled' ? 'danger' : 'warning'
                        }`}>
                          {ord.orderStatus}
                        </span>
                      </td>
                      <td>
                        <span className={`admin-badge ${ord.paymentStatus === 'Paid' ? 'success' : 'neutral'}`}>
                          {ord.paymentStatus}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Top Performing Vendors */}
        <div className="admin-card">
          <div className="admin-card-header">
            <h3 className="admin-card-title">
              <Store size={18} /> Top Marketplace Vendors
            </h3>
            <Link to="/admin/vendors" className="admin-btn admin-btn-secondary admin-btn-sm">
              Manage Vendors &rarr;
            </Link>
          </div>

          <div className="admin-table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Store / Vendor</th>
                  <th>Products</th>
                  <th>Sales Volume</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {topVendors.length === 0 ? (
                  <tr>
                    <td colSpan="4" style={{ textAlign: 'center', padding: '2rem' }}>No vendor transactions recorded</td>
                  </tr>
                ) : (
                  topVendors.map((v) => (
                    <tr key={v._id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                          <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(99, 102, 241, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: '#818cf8' }}>
                            {(v.storeName || v.name)[0].toUpperCase()}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600 }}>{v.storeName || v.name}</div>
                            <div style={{ fontSize: '0.72rem', color: '#64748b' }}>{v.name}</div>
                          </div>
                        </div>
                      </td>
                      <td>{v.productCount} products</td>
                      <td style={{ fontWeight: 700, color: '#34d399' }}>{formatPrice(v.totalSales)}</td>
                      <td>
                        <span className={`admin-badge ${v.vendorStatus === 'approved' ? 'success' : 'warning'}`}>
                          {v.vendorStatus}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* DELIVERY PARTNER APPROVAL REQUESTS SECTION */}
      <div id="delivery-partner-requests" className="admin-card" style={{ marginBottom: '2rem' }}>
        <div className="admin-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1.25rem' }}>
          <div>
            <h3 className="admin-card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
              <Bike size={20} color="#38bdf8" />
              <span>Delivery Partner Approval Requests</span>
              {pendingDeliveryPartners.length > 0 && (
                <span
                  style={{
                    background: 'rgba(56, 189, 248, 0.2)',
                    color: '#38bdf8',
                    border: '1px solid rgba(56, 189, 248, 0.35)',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: '999px',
                  }}
                >
                  {pendingDeliveryPartners.length} Pending
                </span>
              )}
            </h3>
            <p style={{ margin: '0.25rem 0 0', fontSize: '0.82rem', color: '#94a3b8' }}>
              Review delivery partner registrations, verify vehicle & license details, and grant operational approval.
            </p>
          </div>
          <Link
            to="/admin/pending-approval?tab=delivery"
            className="admin-btn admin-btn-secondary admin-btn-sm"
            style={{ textDecoration: 'none' }}
          >
            Open Full Delivery Console →
          </Link>
        </div>

        {deliveryActionMessage && (
          <div
            style={{
              padding: '0.75rem 1rem',
              borderRadius: '8px',
              marginBottom: '1rem',
              fontSize: '0.85rem',
              background: deliveryActionMessage.type === 'success' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
              border: `1px solid ${deliveryActionMessage.type === 'success' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
              color: deliveryActionMessage.type === 'success' ? '#34d399' : '#f87171',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            {deliveryActionMessage.type === 'success' ? <CheckCircle size={16} /> : <AlertTriangle size={16} />}
            <span>{deliveryActionMessage.text}</span>
          </div>
        )}

        {pendingDeliveryPartners.length === 0 ? (
          <div className="admin-empty-state" style={{ padding: '2rem 1rem', textAlign: 'center' }}>
            <CheckCircle size={36} color="#10b981" style={{ margin: '0 auto 0.75rem' }} />
            <div style={{ fontWeight: 700, color: '#f8fafc', fontSize: '1rem' }}>No Pending Delivery Partner Requests</div>
            <p style={{ fontSize: '0.82rem', color: '#94a3b8', margin: '0.25rem 0 0' }}>
              All delivery partner registrations have been reviewed. New rider registration requests will appear here immediately.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {pendingDeliveryPartners.map((partner) => (
              <div
                key={partner._id}
                style={{
                  background: 'rgba(15, 23, 42, 0.65)',
                  border: '1px solid rgba(148, 163, 184, 0.15)',
                  borderRadius: '12px',
                  padding: '1.25rem',
                  display: 'flex',
                  flexWrap: 'wrap',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '1rem',
                }}
              >
                <div style={{ flex: '1 1 320px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.35rem' }}>
                    <div
                      style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '8px',
                        background: 'rgba(56, 189, 248, 0.15)',
                        color: '#38bdf8',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Bike size={18} />
                    </div>
                    <div>
                      <h4 style={{ margin: 0, color: '#f8fafc', fontSize: '0.98rem', fontWeight: 700 }}>
                        {partner.name}
                      </h4>
                      <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                        Applied on {new Date(partner.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <span
                      style={{
                        background: 'rgba(245, 158, 11, 0.15)',
                        color: '#fbbf24',
                        border: '1px solid rgba(245, 158, 11, 0.3)',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        padding: '2px 8px',
                        borderRadius: '999px',
                        marginLeft: 'auto',
                      }}
                    >
                      Pending Approval
                    </span>
                  </div>

                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                      gap: '0.5rem 1rem',
                      marginTop: '0.75rem',
                      fontSize: '0.8rem',
                      background: 'rgba(0, 0, 0, 0.2)',
                      padding: '0.75rem',
                      borderRadius: '8px',
                    }}
                  >
                    <div>
                      <span style={{ color: '#94a3b8', display: 'block', fontSize: '0.7rem' }}>EMAIL</span>
                      <span style={{ color: '#e2e8f0' }}>{partner.email}</span>
                    </div>
                    <div>
                      <span style={{ color: '#94a3b8', display: 'block', fontSize: '0.7rem' }}>PHONE</span>
                      <span style={{ color: '#e2e8f0' }}>{partner.phone || 'N/A'}</span>
                    </div>
                    <div>
                      <span style={{ color: '#94a3b8', display: 'block', fontSize: '0.7rem' }}>VEHICLE</span>
                      <span style={{ color: '#38bdf8', fontWeight: 600, textTransform: 'capitalize' }}>
                        {partner.vehicleType || 'Bike'} {partner.vehicleNumber ? `(${partner.vehicleNumber})` : ''}
                      </span>
                    </div>
                    <div>
                      <span style={{ color: '#94a3b8', display: 'block', fontSize: '0.7rem' }}>DRIVING LICENSE</span>
                      <span style={{ color: '#f59e0b', fontWeight: 600 }}>
                        {partner.drivingLicenseNumber || 'Pending Submission'}
                      </span>
                    </div>
                    <div>
                      <span style={{ color: '#94a3b8', display: 'block', fontSize: '0.7rem' }}>CITY / ZONE</span>
                      <span style={{ color: '#e2e8f0' }}>{partner.deliveryCity || 'Mumbai'}</span>
                    </div>
                  </div>
                </div>

                {/* Approve & Reject Action Buttons */}
                <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap', alignItems: 'center' }}>
                  <button
                    onClick={() => handleApproveDelivery(partner)}
                    disabled={deliveryActionLoading === partner._id}
                    className="admin-btn admin-btn-success"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      padding: '0.55rem 1rem',
                      fontSize: '0.82rem',
                    }}
                  >
                    <CheckCircle size={15} />
                    <span>{deliveryActionLoading === partner._id ? 'Saving...' : 'Approve'}</span>
                  </button>

                  <button
                    onClick={() => handleRejectDelivery(partner)}
                    disabled={deliveryActionLoading === partner._id}
                    className="admin-btn admin-btn-danger"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      padding: '0.55rem 1rem',
                      fontSize: '0.82rem',
                    }}
                  >
                    <XCircle size={15} />
                    <span>{deliveryActionLoading === partner._id ? 'Saving...' : 'Reject'}</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* QUICK SHORTCUTS ROW */}
      <div className="admin-card">
        <h4 style={{ margin: '0 0 1rem', fontSize: '0.95rem', fontWeight: 700, color: '#cbd5e1' }}>
          Administrative Quick Actions
        </h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
          <Link
            to="/admin/pending-approval"
            className="admin-btn admin-btn-secondary"
            style={{ justifyContent: 'flex-start', padding: '0.85rem 1rem' }}
          >
            <CheckCircle size={18} color="#f59e0b" />
            <div>
              <div style={{ fontSize: '0.85rem', fontWeight: 700 }}>Pending Approvals</div>
              <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Review sellers & riders</div>
            </div>
          </Link>

          <Link
            to="/admin/products"
            className="admin-btn admin-btn-secondary"
            style={{ justifyContent: 'flex-start', padding: '0.85rem 1rem' }}
          >
            <Package size={18} color="#6366f1" />
            <div>
              <div style={{ fontSize: '0.85rem', fontWeight: 700 }}>Moderate Products</div>
              <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Review submitted items</div>
            </div>
          </Link>

          <Link
            to="/admin/payouts"
            className="admin-btn admin-btn-secondary"
            style={{ justifyContent: 'flex-start', padding: '0.85rem 1rem' }}
          >
            <DollarSign size={18} color="#10b981" />
            <div>
              <div style={{ fontSize: '0.85rem', fontWeight: 700 }}>Process Payouts</div>
              <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Settle vendor balances</div>
            </div>
          </Link>

          <Link
            to="/admin/reports"
            className="admin-btn admin-btn-secondary"
            style={{ justifyContent: 'flex-start', padding: '0.85rem 1rem' }}
          >
            <BarChart2 size={18} color="#06b6d4" />
            <div>
              <div style={{ fontSize: '0.85rem', fontWeight: 700 }}>Export CSV Data</div>
              <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Sales & vendor analytics</div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}