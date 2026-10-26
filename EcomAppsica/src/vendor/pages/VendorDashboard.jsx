import React, { useState, useEffect, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Package,
  ShoppingBag,
  IndianRupee,
  Clock,
  TrendingUp,
  AlertTriangle,
  Star,
  Plus,
  ArrowRight,
  Eye,
  RefreshCw,
  ExternalLink,
  ChevronRight,
  ShieldCheck
} from 'lucide-react';
import { vendorService } from '../../services/vendorService';
import { AuthContext } from '../../context/AuthContextValue';
import { formatPrice } from '../../utils/formatPrice';

export default function VendorDashboard() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  const loadDashboard = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await vendorService.getDashboard();
      setData(res);
    } catch (err) {
      setError(err?.message || 'Failed to load vendor dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const stats = data?.stats || {};
  const recentOrders = data?.recentOrders || [];
  const topProducts = data?.topProducts || [];
  const salesTrend = data?.salesTrend || [];

  // Determine highest monthly sale to scale chart bars
  const maxSale = Math.max(...salesTrend.map((s) => s.sales), 10000);

  return (
    <div>
      {/* Top Banner / Welcome row */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '1.75rem',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#fff', margin: '0 0 0.25rem 0' }}>
            Welcome back, {user?.name} 👋
          </h2>
          <p style={{ color: '#94a3b8', margin: 0, fontSize: '0.9rem' }}>
            Here is the live performance overview for <strong>{user?.storeName || 'your store'}</strong> today.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            className="vp-btn vp-btn-secondary vp-btn-sm"
            onClick={loadDashboard}
            disabled={loading}
            title="Refresh statistics"
          >
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>
          <Link to="/vendor/products" className="vp-btn vp-btn-primary vp-btn-sm">
            <Plus size={16} />
            <span>Add Product</span>
          </Link>
        </div>
      </div>

      {error && (
        <div
          style={{
            background: 'rgba(239, 68, 68, 0.12)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            color: '#f87171',
            padding: '0.85rem 1rem',
            borderRadius: '10px',
            marginBottom: '1.5rem',
            fontSize: '0.88rem',
          }}
        >
          {error}
        </div>
      )}

      {/* 4 PRIMARY SUMMARY CARDS (Requirement 10) */}
      <div className="vendor-grid-4">
        {/* Total Products */}
        <div className="vendor-stat-card">
          <div className="vendor-stat-info">
            <span className="vendor-stat-label">Total Products</span>
            <span className="vendor-stat-value">{stats.totalProducts ?? 0}</span>
            <span className="vendor-stat-subtext">
              <Package size={13} style={{ color: '#818cf8' }} /> {stats.activeProducts ?? 0} active catalog items
            </span>
          </div>
          <div className="vendor-stat-icon-wrapper purple">
            <Package size={22} />
          </div>
        </div>

        {/* Total Orders */}
        <div className="vendor-stat-card">
          <div className="vendor-stat-info">
            <span className="vendor-stat-label">Total Orders</span>
            <span className="vendor-stat-value">{stats.totalOrders ?? 0}</span>
            <span className="vendor-stat-subtext">
              <ShoppingBag size={13} style={{ color: '#22d3ee' }} /> {stats.deliveredOrders ?? 0} delivered
            </span>
          </div>
          <div className="vendor-stat-icon-wrapper cyan">
            <ShoppingBag size={22} />
          </div>
        </div>

        {/* Total Sales */}
        <div className="vendor-stat-card">
          <div className="vendor-stat-info">
            <span className="vendor-stat-label">Total Gross Sales</span>
            <span className="vendor-stat-value">{formatPrice(stats.totalSales ?? 0)}</span>
            <span className="vendor-stat-subtext" style={{ color: '#34d399' }}>
              <TrendingUp size={13} /> Net: {formatPrice(stats.netEarnings ?? 0)}
            </span>
          </div>
          <div className="vendor-stat-icon-wrapper green">
            <IndianRupee size={22} />
          </div>
        </div>

        {/* Pending Orders */}
        <div className="vendor-stat-card">
          <div className="vendor-stat-info">
            <span className="vendor-stat-label">Pending Orders</span>
            <span className="vendor-stat-value">{stats.pendingOrders ?? 0}</span>
            <span className="vendor-stat-subtext" style={{ color: stats.pendingOrders > 0 ? '#fbbf24' : '#94a3b8' }}>
              <Clock size={13} /> Requires shipping action
            </span>
          </div>
          <div className="vendor-stat-icon-wrapper amber">
            <Clock size={22} />
          </div>
        </div>
      </div>

      {/* SECONDARY STATS: Net Earnings, Low Stock Alerts, Store Rating */}
      <div className="vendor-grid-3">
        <div className="vendor-stat-card">
          <div className="vendor-stat-info">
            <span className="vendor-stat-label">Net Vendor Earnings (Post 10% Fee)</span>
            <span className="vendor-stat-value" style={{ color: '#34d399' }}>
              {formatPrice(stats.netEarnings ?? 0)}
            </span>
            <span className="vendor-stat-subtext">
              Platform fee retained: {formatPrice(stats.platformFee ?? 0)}
            </span>
          </div>
          <div className="vendor-stat-icon-wrapper green">
            <TrendingUp size={22} />
          </div>
        </div>

        <div className="vendor-stat-card">
          <div className="vendor-stat-info">
            <span className="vendor-stat-label">Low Stock Alerts</span>
            <span className="vendor-stat-value" style={{ color: stats.lowStockProducts > 0 ? '#f87171' : '#f8fafc' }}>
              {stats.lowStockProducts ?? 0}
            </span>
            <span className="vendor-stat-subtext">Items with 5 or fewer units left</span>
          </div>
          <div className="vendor-stat-icon-wrapper rose">
            <AlertTriangle size={22} />
          </div>
        </div>

        <div className="vendor-stat-card">
          <div className="vendor-stat-info">
            <span className="vendor-stat-label">Average Store Rating</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.2rem' }}>
              <span className="vendor-stat-value" style={{ margin: 0 }}>
                {stats.storeRating || 4.8}
              </span>
              <div style={{ display: 'flex', color: '#fbbf24' }}>
                <Star size={18} fill="#fbbf24" />
              </div>
            </div>
            <span className="vendor-stat-subtext" style={{ marginTop: '0.35rem' }}>
              Based on verified customer feedback
            </span>
          </div>
          <div className="vendor-stat-icon-wrapper amber">
            <Star size={22} />
          </div>
        </div>
      </div>

      {/* SALES REVENUE CHART & QUICK ACTIONS */}
      <div className="vendor-grid-2" style={{ gridTemplateColumns: '2fr 1fr' }}>
        {/* Monthly Revenue Chart */}
        <div className="vendor-card">
          <div className="vendor-card-header">
            <div>
              <h3 className="vendor-card-title">
                <TrendingUp size={18} style={{ color: '#6366f1' }} /> Sales & Revenue Trends
              </h3>
              <span className="vendor-card-subtitle">Monthly revenue progression</span>
            </div>
            <Link to="/vendor/reports" className="vp-btn vp-btn-secondary vp-btn-sm">
              Full Reports <ChevronRight size={14} />
            </Link>
          </div>

          {/* Bar Chart Container */}
          <div
            style={{
              height: '210px',
              display: 'flex',
              alignItems: 'flex-end',
              gap: '1.25rem',
              padding: '1.5rem 0.5rem 0.5rem',
              borderBottom: '1px solid rgba(148, 163, 184, 0.15)',
            }}
          >
            {salesTrend.map((item, idx) => {
              const heightPct = Math.max(12, Math.round((item.sales / maxSale) * 100));
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
                  <div style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 600 }}>
                    {formatPrice(item.sales)}
                  </div>
                  <div
                    style={{
                      width: '100%',
                      maxWidth: '46px',
                      height: `${heightPct}%`,
                      background: 'linear-gradient(180deg, #6366f1 0%, #3b82f6 100%)',
                      borderRadius: '8px 8px 0 0',
                      transition: 'height 0.4s ease',
                      boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)',
                    }}
                    title={`${item.month}: Gross ${formatPrice(item.sales)} | Net ${formatPrice(item.earnings)}`}
                  />
                  <div style={{ fontSize: '0.75rem', color: '#cbd5e1', fontWeight: 600 }}>
                    {item.month}
                  </div>
                </div>
              );
            })}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.75rem', fontSize: '0.75rem', color: '#94a3b8' }}>
            <span>📊 Total units sold: <strong>{stats.totalItemsSold ?? 0}</strong></span>
            <span>⚡ Payout rate: <strong>90% Direct</strong></span>
          </div>
        </div>

        {/* Quick Actions & Store Health Card */}
        <div className="vendor-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div className="vendor-card-header">
              <h3 className="vendor-card-title">Quick Actions</h3>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <Link
                to="/vendor/products"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.85rem 1rem',
                  background: 'rgba(30, 41, 59, 0.6)',
                  border: '1px solid rgba(148, 163, 184, 0.12)',
                  borderRadius: '10px',
                  color: '#fff',
                  textDecoration: 'none',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#6366f1')}
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'rgba(148, 163, 184, 0.12)')}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ width: '34px', height: '34px', borderRadius: '8px', background: 'rgba(99, 102, 241, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#818cf8' }}>
                    <Plus size={18} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>Add New Product</div>
                    <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Publish items with stock & images</div>
                  </div>
                </div>
                <ChevronRight size={16} style={{ color: '#64748b' }} />
              </Link>

              <Link
                to="/vendor/orders"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.85rem 1rem',
                  background: 'rgba(30, 41, 59, 0.6)',
                  border: '1px solid rgba(148, 163, 184, 0.12)',
                  borderRadius: '10px',
                  color: '#fff',
                  textDecoration: 'none',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#22d3ee')}
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'rgba(148, 163, 184, 0.12)')}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ width: '34px', height: '34px', borderRadius: '8px', background: 'rgba(6, 182, 212, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#22d3ee' }}>
                    <ShoppingBag size={18} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>Process Orders</div>
                    <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Update delivery and tracking</div>
                  </div>
                </div>
                <ChevronRight size={16} style={{ color: '#64748b' }} />
              </Link>

              <Link
                to="/vendor/profile"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.85rem 1rem',
                  background: 'rgba(30, 41, 59, 0.6)',
                  border: '1px solid rgba(148, 163, 184, 0.12)',
                  borderRadius: '10px',
                  color: '#fff',
                  textDecoration: 'none',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#10b981')}
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'rgba(148, 163, 184, 0.12)')}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ width: '34px', height: '34px', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#34d399' }}>
                    <ShieldCheck size={18} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>Payout & Store Setup</div>
                    <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Manage bank account & GSTIN</div>
                  </div>
                </div>
                <ChevronRight size={16} style={{ color: '#64748b' }} />
              </Link>
            </div>
          </div>

          <div
            style={{
              marginTop: '1rem',
              padding: '0.85rem',
              background: 'rgba(99, 102, 241, 0.08)',
              border: '1px solid rgba(99, 102, 241, 0.2)',
              borderRadius: '10px',
              fontSize: '0.78rem',
              color: '#c7d2fe',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <ShieldCheck size={16} style={{ color: '#818cf8', flexShrink: 0 }} />
            <span>Store protection active. Client data securely isolated.</span>
          </div>
        </div>
      </div>

      {/* RECENT ORDERS TABLE */}
      <div className="vendor-card">
        <div className="vendor-card-header">
          <div>
            <h3 className="vendor-card-title">
              <ShoppingBag size={18} style={{ color: '#06b6d4' }} /> Recent Customer Orders
            </h3>
            <span className="vendor-card-subtitle">Orders containing products from your store</span>
          </div>
          <Link to="/vendor/orders" className="vp-btn vp-btn-secondary vp-btn-sm">
            View All Orders <ArrowRight size={14} />
          </Link>
        </div>

        {recentOrders.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2.5rem', color: '#94a3b8' }}>
            <ShoppingBag size={36} style={{ margin: '0 auto 0.5rem', color: '#475569' }} />
            <p style={{ margin: 0, fontSize: '0.9rem' }}>No orders placed for your products yet.</p>
          </div>
        ) : (
          <div className="vendor-table-container">
            <table className="vendor-table">
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Date</th>
                  <th>Customer</th>
                  <th>Store Items</th>
                  <th>Vendor Subtotal</th>
                  <th>Payment</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((ord) => {
                  const statusClass =
                    ord.orderStatus === 'Delivered'
                      ? 'vp-badge-delivered'
                      : ord.orderStatus === 'Shipped'
                      ? 'vp-badge-shipped'
                      : ord.orderStatus === 'Processing'
                      ? 'vp-badge-processing'
                      : ord.orderStatus === 'Cancelled'
                      ? 'vp-badge-cancelled'
                      : 'vp-badge-pending';

                  return (
                    <tr key={ord._id}>
                      <td style={{ fontWeight: 600, color: '#fff' }}>{ord.orderId}</td>
                      <td>{new Date(ord.createdAt).toLocaleDateString()}</td>
                      <td>{ord.customerName}</td>
                      <td>
                        <span style={{ fontWeight: 500 }}>
                          {ord.vendorItemCount} item{ord.vendorItemCount > 1 ? 's' : ''}
                        </span>
                      </td>
                      <td style={{ fontWeight: 700, color: '#34d399' }}>
                        {formatPrice(ord.vendorSubtotal)}
                      </td>
                      <td>
                        <span
                          style={{
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            color: ord.paymentStatus === 'Paid' ? '#34d399' : '#fbbf24',
                          }}
                        >
                          ● {ord.paymentStatus}
                        </span>
                      </td>
                      <td>
                        <span className={`vp-badge ${statusClass}`}>{ord.orderStatus}</span>
                      </td>
                      <td>
                        <Link
                          to={`/vendor/orders?id=${ord.orderId}`}
                          className="vp-action-btn"
                          title="View order details"
                        >
                          <Eye size={15} />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* TOP SELLING PRODUCTS */}
      <div className="vendor-card">
        <div className="vendor-card-header">
          <div>
            <h3 className="vendor-card-title">
              <Package size={18} style={{ color: '#8b5cf6' }} /> Top Products in Your Catalog
            </h3>
            <span className="vendor-card-subtitle">Highest rated and most popular store products</span>
          </div>
          <Link to="/vendor/products" className="vp-btn vp-btn-secondary vp-btn-sm">
            Manage Products <ArrowRight size={14} />
          </Link>
        </div>

        {topProducts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2.5rem', color: '#94a3b8' }}>
            <Package size={36} style={{ margin: '0 auto 0.5rem', color: '#475569' }} />
            <p style={{ margin: 0, fontSize: '0.9rem' }}>No products added yet.</p>
          </div>
        ) : (
          <div className="vendor-table-container">
            <table className="vendor-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Category</th>
                  <th>Price</th>
                  <th>Stock Health</th>
                  <th>Rating</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {topProducts.map((prod) => (
                  <tr key={prod._id}>
                    <td>
                      <div className="vendor-prod-cell">
                        <img
                          src={prod.images?.[0] || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=100&q=80'}
                          alt={prod.name}
                          className="vendor-product-thumb"
                        />
                        <div>
                          <span className="vendor-prod-name">{prod.name}</span>
                          <span className="vendor-prod-meta">{prod.brand || user?.storeName}</span>
                        </div>
                      </div>
                    </td>
                    <td>{prod.category?.name || 'General'}</td>
                    <td style={{ fontWeight: 700, color: '#fff' }}>{formatPrice(prod.price)}</td>
                    <td>
                      {prod.stock > 5 ? (
                        <span className="vp-badge vp-badge-instock">{prod.stock} in stock</span>
                      ) : prod.stock > 0 ? (
                        <span className="vp-badge vp-badge-lowstock">{prod.stock} left (Low)</span>
                      ) : (
                        <span className="vp-badge vp-badge-outstock">Out of stock</span>
                      )}
                    </td>
                    <td>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontWeight: 600, color: '#fbbf24' }}>
                        <Star size={14} fill="#fbbf24" /> {prod.rating} ({prod.reviewCount || 0})
                      </span>
                    </td>
                    <td>
                      <Link
                        to={`/product/${prod.slug || prod._id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="vp-action-btn"
                        title="View on store"
                      >
                        <ExternalLink size={14} />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
