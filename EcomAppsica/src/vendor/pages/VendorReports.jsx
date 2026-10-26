import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  BarChart3,
  IndianRupee,
  TrendingUp,
  Percent,
  Download,
  Printer,
  CreditCard,
  CheckCircle,
  Clock,
  Building,
  RefreshCw,
  ExternalLink
} from 'lucide-react';
import { vendorService } from '../../services/vendorService';
import { formatPrice } from '../../utils/formatPrice';

export default function VendorReports() {
  const [loading, setLoading] = useState(true);
  const [reportData, setReportData] = useState(null);
  const [error, setError] = useState('');

  const loadReports = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await vendorService.getReports();
      setReportData(res);
    } catch (err) {
      setError(err?.message || 'Failed to load sales reports');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, []);

  const summary = reportData?.summary || {};
  const orders = reportData?.orders || [];
  const payout = summary.payoutAccount || {};

  const handlePrint = () => {
    window.print();
  };

  return (
    <div>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '1.5rem',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#fff', margin: '0 0 0.25rem 0' }}>
            Sales Reports & Net Earnings
          </h2>
          <p style={{ color: '#94a3b8', margin: 0, fontSize: '0.9rem' }}>
            Transparent commission accounting, order payouts, and withdrawal statements.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="vp-btn vp-btn-secondary vp-btn-sm" onClick={loadReports} disabled={loading}>
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>
          <button className="vp-btn vp-btn-secondary vp-btn-sm" onClick={handlePrint}>
            <Printer size={15} />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {error && (
        <div
          style={{
            background: 'rgba(239, 68, 68, 0.12)',
            border: '1px solid rgba(239, 68, 68, 0.35)',
            color: '#f87171',
            padding: '0.85rem 1rem',
            borderRadius: '10px',
            marginBottom: '1.5rem',
          }}
        >
          {error}
        </div>
      )}

      {/* METRIC SUMMARY CARDS */}
      <div className="vendor-grid-4">
        {/* Total Gross Sales */}
        <div className="vendor-stat-card">
          <div className="vendor-stat-info">
            <span className="vendor-stat-label">Total Gross Sales</span>
            <span className="vendor-stat-value">{formatPrice(summary.totalGrossSales ?? 0)}</span>
            <span className="vendor-stat-subtext" style={{ color: '#38bdf8' }}>
              Across {summary.totalOrders ?? 0} orders
            </span>
          </div>
          <div className="vendor-stat-icon-wrapper cyan">
            <IndianRupee size={22} />
          </div>
        </div>

        {/* Platform Commission Fee */}
        <div className="vendor-stat-card">
          <div className="vendor-stat-info">
            <span className="vendor-stat-label">Platform Fee ({summary.commissionRate || 10}%)</span>
            <span className="vendor-stat-value" style={{ color: '#f87171' }}>
              - {formatPrice(summary.platformFee ?? 0)}
            </span>
            <span className="vendor-stat-subtext">Marketplace hosting & payment gateway</span>
          </div>
          <div className="vendor-stat-icon-wrapper rose">
            <Percent size={22} />
          </div>
        </div>

        {/* Net Vendor Earnings */}
        <div className="vendor-stat-card">
          <div className="vendor-stat-info">
            <span className="vendor-stat-label">Net Seller Earnings</span>
            <span className="vendor-stat-value" style={{ color: '#34d399' }}>
              {formatPrice(summary.netEarnings ?? 0)}
            </span>
            <span className="vendor-stat-subtext" style={{ color: '#34d399' }}>
              <CheckCircle size={13} /> 90% Direct Vendor Share
            </span>
          </div>
          <div className="vendor-stat-icon-wrapper green">
            <TrendingUp size={22} />
          </div>
        </div>

        {/* Average Order Value */}
        <div className="vendor-stat-card">
          <div className="vendor-stat-info">
            <span className="vendor-stat-label">Average Order Value</span>
            <span className="vendor-stat-value">{formatPrice(summary.averageOrderValue ?? 0)}</span>
            <span className="vendor-stat-subtext">{summary.totalItemsSold ?? 0} total units dispatched</span>
          </div>
          <div className="vendor-stat-icon-wrapper purple">
            <BarChart3 size={22} />
          </div>
        </div>
      </div>

      {/* PAYOUT METHOD CARD */}
      <div className="vendor-card" style={{ background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95), rgba(30, 41, 59, 0.85))' }}>
        <div className="vendor-card-header">
          <div>
            <h3 className="vendor-card-title">
              <Building size={18} style={{ color: '#10b981' }} /> Connected Bank Account / Payout Destination
            </h3>
            <span className="vendor-card-subtitle">
              Net earnings are automatically scheduled for bank wire transfer every Monday
            </span>
          </div>
          <Link to="/vendor/profile" className="vp-btn vp-btn-secondary vp-btn-sm">
            Edit Bank Details <ExternalLink size={13} />
          </Link>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
          <div style={{ background: 'rgba(10, 15, 29, 0.6)', padding: '0.85rem 1rem', borderRadius: '10px', border: '1px solid rgba(148, 163, 184, 0.1)' }}>
            <span style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block' }}>Account Holder</span>
            <strong style={{ color: '#fff', fontSize: '0.92rem' }}>{payout?.accountHolder || 'Not configured'}</strong>
          </div>

          <div style={{ background: 'rgba(10, 15, 29, 0.6)', padding: '0.85rem 1rem', borderRadius: '10px', border: '1px solid rgba(148, 163, 184, 0.1)' }}>
            <span style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block' }}>Bank Name</span>
            <strong style={{ color: '#fff', fontSize: '0.92rem' }}>{payout?.bankName || 'Not configured'}</strong>
          </div>

          <div style={{ background: 'rgba(10, 15, 29, 0.6)', padding: '0.85rem 1rem', borderRadius: '10px', border: '1px solid rgba(148, 163, 184, 0.1)' }}>
            <span style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block' }}>Account Number</span>
            <strong style={{ color: '#fff', fontSize: '0.92rem' }}>{payout?.accountNumber ? `••••${payout.accountNumber.slice(-4)}` : 'N/A'}</strong>
          </div>

          <div style={{ background: 'rgba(10, 15, 29, 0.6)', padding: '0.85rem 1rem', borderRadius: '10px', border: '1px solid rgba(148, 163, 184, 0.1)' }}>
            <span style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block' }}>IFSC / UPI ID</span>
            <strong style={{ color: '#34d399', fontSize: '0.92rem' }}>{payout?.upiId || payout?.ifsc || 'N/A'}</strong>
          </div>
        </div>
      </div>

      {/* EARNINGS ORDER LEDGER TABLE */}
      <div className="vendor-card" style={{ padding: 0 }}>
        <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid rgba(148, 163, 184, 0.12)' }}>
          <h3 className="vendor-card-title">Order Earnings & Payout Ledger</h3>
          <span className="vendor-card-subtitle">Detailed itemized breakdown for each customer transaction</span>
        </div>

        {orders.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3.5rem', color: '#94a3b8' }}>
            <IndianRupee size={40} style={{ margin: '0 auto 0.5rem', color: '#475569' }} />
            <p style={{ margin: 0 }}>No orders cleared for payouts yet.</p>
          </div>
        ) : (
          <div className="vendor-table-container" style={{ border: 'none' }}>
            <table className="vendor-table">
              <thead>
                <tr>
                  <th>Order Reference</th>
                  <th>Order Date</th>
                  <th>Units</th>
                  <th>Gross Amount</th>
                  <th>Platform Fee (10%)</th>
                  <th>Net Vendor Payout</th>
                  <th>Order Status</th>
                  <th>Payout Status</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((ord, idx) => (
                  <tr key={idx}>
                    <td style={{ fontWeight: 600, color: '#fff' }}>{ord.orderId}</td>
                    <td>{new Date(ord.date).toLocaleDateString()}</td>
                    <td>{ord.itemsCount} units</td>
                    <td style={{ fontWeight: 600 }}>{formatPrice(ord.grossAmount)}</td>
                    <td style={{ color: '#f87171' }}>- {formatPrice(ord.platformFee)}</td>
                    <td style={{ fontWeight: 800, color: '#34d399' }}>{formatPrice(ord.netPayout)}</td>
                    <td>
                      <span
                        className={`vp-badge ${
                          ord.orderStatus === 'Delivered'
                            ? 'vp-badge-delivered'
                            : ord.orderStatus === 'Shipped'
                            ? 'vp-badge-shipped'
                            : ord.orderStatus === 'Cancelled'
                            ? 'vp-badge-cancelled'
                            : 'vp-badge-pending'
                        }`}
                      >
                        {ord.orderStatus}
                      </span>
                    </td>
                    <td>
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                          fontSize: '0.78rem',
                          fontWeight: 600,
                          color: ord.payoutStatus === 'Cleared' ? '#34d399' : '#fbbf24',
                        }}
                      >
                        {ord.payoutStatus === 'Cleared' ? <CheckCircle size={13} /> : <Clock size={13} />}
                        {ord.payoutStatus}
                      </span>
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
