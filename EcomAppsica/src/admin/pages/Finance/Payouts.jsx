import React, { useState, useEffect } from 'react';
import {
  DollarSign,
  Plus,
  CheckCircle,
  AlertTriangle,
  Clock,
  ShieldCheck,
  Building,
  Store,
  RefreshCw,
  X,
} from 'lucide-react';
import { adminService } from '../../../services/adminService';
import { formatPrice } from '../../../utils/formatPrice';

export default function Payouts() {
  const [payouts, setPayouts] = useState([]);
  const [ledger, setLedger] = useState(null);
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Create Payout Modal
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ vendorId: '', amount: '', notes: '', transactionReference: '' });

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const [payoutRes, vendorRes] = await Promise.all([
        adminService.getPayouts(),
        adminService.getVendors(),
      ]);

      if (payoutRes?.success) {
        setPayouts(payoutRes.payouts || []);
        setLedger(payoutRes.ledger || {});
      }
      if (vendorRes?.success) {
        setVendors(vendorRes.vendors || []);
      }
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Failed to load payout settlements');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreatePayout = async (e) => {
    e.preventDefault();
    try {
      await adminService.createPayout(form);
      setSuccess('Payout settlement request recorded!');
      setModal(false);
      setForm({ vendorId: '', amount: '', notes: '', transactionReference: '' });
      setTimeout(() => setSuccess(''), 3000);
      loadData();
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Failed to create payout');
    }
  };

  const handleUpdateStatus = async (payoutId, status) => {
    let transactionReference = '';
    if (status === 'paid') {
      transactionReference = window.prompt('Enter Bank/NEFT Transaction Reference Number:') || `NEFT-UTI-${Date.now().toString().slice(-6)}`;
    }

    try {
      await adminService.updatePayoutStatus(payoutId, { status, transactionReference });
      setSuccess(`Payout status updated to "${status}"!`);
      setTimeout(() => setSuccess(''), 3000);
      loadData();
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Status update failed');
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0, color: '#f8fafc' }}>
            Vendor Commissions & Payout Settlements
          </h2>
          <p style={{ margin: '0.2rem 0 0', fontSize: '0.85rem', color: '#94a3b8' }}>
            Marketplace gross sales ledger, platform commission retention, and vendor bank transfers.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="admin-btn admin-btn-secondary" onClick={loadData}>
            <RefreshCw size={15} className={loading ? 'spin-icon' : ''} /> Refresh
          </button>
          <button className="admin-btn admin-btn-primary" onClick={() => setModal(true)}>
            <Plus size={16} /> New Payout Record
          </button>
        </div>
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

      {/* FINANCIAL LEDGER CARDS */}
      <div className="admin-stat-grid">
        <div className="admin-stat-card">
          <div className="admin-stat-icon primary">
            <DollarSign size={22} />
          </div>
          <div className="admin-stat-label">Platform Gross Sales</div>
          <div className="admin-stat-value">{formatPrice(ledger?.grossSales || 0)}</div>
          <div className="admin-stat-sub">Total non-cancelled GMV</div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-icon purple">
            <ShieldCheck size={22} />
          </div>
          <div className="admin-stat-label">Platform Commission Retained</div>
          <div className="admin-stat-value">{formatPrice(ledger?.platformRevenue || 0)}</div>
          <div className="admin-stat-sub">10% Platform service fee</div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-icon success">
            <CheckCircle size={22} />
          </div>
          <div className="admin-stat-label">Total Disbursed to Vendors</div>
          <div className="admin-stat-value">{formatPrice(ledger?.totalPaidOut || 0)}</div>
          <div className="admin-stat-sub">Settled bank transfers</div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-icon warning">
            <Clock size={22} />
          </div>
          <div className="admin-stat-label">Net Payable Vendor Balance</div>
          <div className="admin-stat-value">{formatPrice(ledger?.netPayableBalance || 0)}</div>
          <div className="admin-stat-sub">Remaining vendor balance</div>
        </div>
      </div>

      {/* PAYOUT RECORDS TABLE */}
      <div className="admin-card">
        <div className="admin-card-header">
          <h3 className="admin-card-title">
            <Building size={18} /> Payout Settlement Ledger ({payouts.length})
          </h3>
        </div>

        <div className="admin-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Payout Ref</th>
                <th>Vendor Store</th>
                <th>Disbursed Amount</th>
                <th>Commission Retained</th>
                <th>Bank Details</th>
                <th>Status</th>
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
              ) : payouts.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
                    No payout settlement records found.
                  </td>
                </tr>
              ) : (
                payouts.map((p) => (
                  <tr key={p._id}>
                    <td>
                      <div style={{ fontFamily: 'monospace', fontWeight: 600, color: '#818cf8' }}>
                        {p.payoutId || p._id.slice(-6)}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                        {new Date(p.createdAt).toLocaleDateString()}
                      </div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{p.storeName || p.vendor?.storeName || 'Vendor'}</div>
                      <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>{p.vendor?.email}</div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 800, color: '#34d399' }}>{formatPrice(p.amount)}</div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, color: '#c084fc' }}>{formatPrice(p.commissionDeducted || Math.round(p.amount * 0.1))}</div>
                    </td>
                    <td>
                      <div style={{ fontSize: '0.8rem' }}>
                        <div>{p.bankDetails?.bankName || 'Direct Transfer'}</div>
                        <div style={{ color: '#64748b', fontSize: '0.72rem' }}>
                          A/C: {p.bankDetails?.accountNumber || 'Configured in profile'}
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={`admin-badge ${
                        p.status === 'paid' ? 'success' :
                        p.status === 'pending' ? 'warning' : 'danger'
                      }`}>
                        {p.status}
                      </span>
                      {p.transactionReference && (
                        <div style={{ fontSize: '0.68rem', color: '#94a3b8', fontFamily: 'monospace', marginTop: '2px' }}>
                          Ref: {p.transactionReference}
                        </div>
                      )}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      {p.status === 'pending' && (
                        <div style={{ display: 'inline-flex', gap: '0.35rem' }}>
                          <button
                            className="admin-btn admin-btn-success admin-btn-sm"
                            onClick={() => handleUpdateStatus(p._id, 'paid')}
                          >
                            Mark Paid
                          </button>
                          <button
                            className="admin-btn admin-btn-danger admin-btn-sm"
                            onClick={() => handleUpdateStatus(p._id, 'rejected')}
                          >
                            Reject
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE PAYOUT MODAL */}
      {modal && (
        <div className="admin-modal-backdrop" onClick={() => setModal(false)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <form onSubmit={handleCreatePayout}>
              <div className="admin-modal-header">
                <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#f8fafc' }}>
                  Create Vendor Payout Settlement
                </h3>
                <button type="button" onClick={() => setModal(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
                  <X size={20} />
                </button>
              </div>

              <div className="admin-modal-body">
                <div className="admin-form-group">
                  <label className="admin-form-label">Beneficiary Vendor Store *</label>
                  <select
                    className="admin-form-input"
                    required
                    value={form.vendorId}
                    onChange={(e) => setForm({ ...form, vendorId: e.target.value })}
                  >
                    <option value="">Select Vendor</option>
                    {vendors.map((v) => (
                      <option key={v._id} value={v._id}>
                        {v.storeName || v.name} ({v.email})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="admin-form-group">
                  <label className="admin-form-label">Disbursement Amount (₹) *</label>
                  <input
                    type="number"
                    className="admin-form-input"
                    required
                    min="1"
                    placeholder="15000"
                    value={form.amount}
                    onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  />
                </div>

                <div className="admin-form-group">
                  <label className="admin-form-label">Internal Notes / Settlement Period</label>
                  <textarea
                    className="admin-form-textarea"
                    rows="2"
                    placeholder="e.g. October bi-weekly settlement for sales cycle 1-15"
                    value={form.notes}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  />
                </div>
              </div>

              <div className="admin-modal-footer">
                <button type="button" className="admin-btn admin-btn-secondary" onClick={() => setModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="admin-btn admin-btn-primary">
                  Generate Settlement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
