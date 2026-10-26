import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  Search,
  CheckCircle,
  AlertTriangle,
  RotateCcw,
  DollarSign,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';
import { paymentService } from '../../../services/paymentService';
import { formatPrice } from '../../../utils/formatPrice';

export default function PaymentList() {
  const [payments, setPayments] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const loadPayments = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await paymentService.getAll();
      setPayments(res?.payments || (Array.isArray(res) ? res : []));
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Failed to load payments ledger');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPayments();
  }, []);

  const handleRefund = async (paymentId) => {
    if (!window.confirm('Process full refund for this payment transaction?')) return;

    try {
      await paymentService.refund(paymentId);
      setPayments((prev) =>
        prev.map((p) => (p._id === paymentId ? { ...p, status: 'refunded' } : p))
      );
      setSuccess('Payment transaction marked as refunded in ledger.');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Refund failed');
    }
  };

  const filtered = payments.filter((p) => {
    const q = search.toLowerCase();
    return (
      !search ||
      p.transactionId?.toLowerCase().includes(q) ||
      p.orderId?.toLowerCase().includes(q) ||
      p.gateway?.toLowerCase().includes(q)
    );
  });

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0, color: '#f8fafc' }}>
            Payment Gateway & Financial Ledger ({payments.length})
          </h2>
          <p style={{ margin: '0.2rem 0 0', fontSize: '0.85rem', color: '#94a3b8' }}>
            Verified payment transactions, gateway authorization references, and refund audits.
          </p>
        </div>
        <button className="admin-btn admin-btn-secondary" onClick={loadPayments}>
          <RefreshCw size={15} className={loading ? 'spin-icon' : ''} /> Refresh
        </button>
      </div>

      {error && (
        <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', padding: '0.85rem', borderRadius: '8px', color: '#f87171', marginBottom: '1rem' }}>
          {error}
        </div>
      )}
      {success && (
        <div style={{ background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.3)', padding: '0.85rem', borderRadius: '8px', color: '#34d399', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <CheckCircle size={16} /> {success}
        </div>
      )}

      {/* Filter */}
      <div className="admin-filter-bar">
        <div className="admin-search-box">
          <Search size={16} className="admin-search-icon" />
          <input
            type="text"
            className="admin-search-input"
            placeholder="Search by transaction ID, Order ID, or gateway..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Table */}
      <div className="admin-table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Transaction ID</th>
              <th>Order Ref</th>
              <th>Gateway</th>
              <th>Amount</th>
              <th>Payment Status</th>
              <th>Timestamp</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '3rem' }}>
                  <div className="admin-loading-spinner" />
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
                  No payment records found.
                </td>
              </tr>
            ) : (
              filtered.map((pay) => (
                <tr key={pay._id}>
                  <td style={{ fontFamily: 'monospace', fontWeight: 600, color: '#818cf8' }}>
                    {pay.transactionId || 'N/A'}
                  </td>
                  <td>
                    <span style={{ fontWeight: 600, color: '#cbd5e1' }}>{pay.orderId || 'Direct'}</span>
                  </td>
                  <td>
                    <span className="admin-badge neutral" style={{ fontWeight: 600 }}>
                      {pay.gateway || 'AppsicaPay'}
                    </span>
                  </td>
                  <td style={{ fontWeight: 800 }}>
                    {formatPrice(pay.amount)}
                  </td>
                  <td>
                    <span className={`admin-badge ${
                      pay.status === 'completed' || pay.status === 'paid' ? 'success' :
                      pay.status === 'refunded' ? 'danger' : 'warning'
                    }`}>
                      {pay.status}
                    </span>
                  </td>
                  <td style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                    {new Date(pay.createdAt).toLocaleString()}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    {pay.status !== 'refunded' && (
                      <button
                        className="admin-btn admin-btn-danger admin-btn-sm"
                        onClick={() => handleRefund(pay._id)}
                      >
                        <RotateCcw size={12} /> Refund
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
