import React, { useState, useEffect } from 'react';
import {
  RotateCcw,
  Search,
  CheckCircle,
  XCircle,
  AlertTriangle,
  DollarSign,
  Package,
  Calendar,
  X,
  RefreshCw,
} from 'lucide-react';
import { adminService } from '../../../services/adminService';
import { formatPrice } from '../../../utils/formatPrice';

export default function ReturnList() {
  const [returns, setReturns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const loadReturns = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await adminService.getReturnRequests();
      if (res?.success) {
        setReturns(res.returns || []);
      }
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Failed to load return requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReturns();
  }, []);

  const handleDecision = async (returnId, status) => {
    const note = window.prompt(
      status === 'approved' ? 'Add approval / refund verification note:' : 'Add rejection justification:',
      status === 'approved' ? 'Return policy verified and refund authorized' : 'Item returned does not match return window criteria'
    );
    if (note === null) return;

    try {
      await adminService.updateReturnStatus(returnId, {
        status,
        adminDecisionNote: note,
        refundTransactionId: status === 'approved' ? `RFD-RZP-${Date.now().toString().slice(-6)}` : undefined,
      });

      setSuccess(`Return request status updated to "${status}"!`);
      setTimeout(() => setSuccess(''), 3000);
      loadReturns();
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Decision update failed');
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0, color: '#f8fafc' }}>
            Customer Returns & Refund Disputes ({returns.length})
          </h2>
          <p style={{ margin: '0.2rem 0 0', fontSize: '0.85rem', color: '#94a3b8' }}>
            Inspect buyer return reasons, authorize payment refunds, and reconcile inventory restocking.
          </p>
        </div>
        <button className="admin-btn admin-btn-secondary" onClick={loadReturns}>
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

      {/* Returns Table */}
      <div className="admin-table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Return ID</th>
              <th>Order Ref</th>
              <th>Customer</th>
              <th>Reason for Return</th>
              <th>Refund Amount</th>
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
            ) : returns.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
                  No customer return or refund requests recorded.
                </td>
              </tr>
            ) : (
              returns.map((ret) => (
                <tr key={ret._id}>
                  <td>
                    <div style={{ fontFamily: 'monospace', fontWeight: 600, color: '#818cf8' }}>
                      {ret.returnId || ret._id.slice(-6)}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                      {new Date(ret.createdAt).toLocaleDateString()}
                    </div>
                  </td>
                  <td>
                    <span style={{ fontWeight: 600, color: '#cbd5e1' }}>
                      {ret.orderId || ret.order?.orderId || 'Order'}
                    </span>
                  </td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{ret.customer?.name || 'Customer'}</div>
                    <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>{ret.customer?.email}</div>
                  </td>
                  <td>
                    <div style={{ fontSize: '0.82rem', color: '#cbd5e1', maxWidth: '300px' }}>
                      {ret.reason || 'Damaged or incorrect size'}
                    </div>
                  </td>
                  <td>
                    <div style={{ fontWeight: 800, color: '#34d399' }}>
                      {formatPrice(ret.refundAmount || 0)}
                    </div>
                  </td>
                  <td>
                    <span className={`admin-badge ${
                      ret.status === 'refunded' || ret.status === 'approved' ? 'success' :
                      ret.status === 'pending' ? 'warning' : 'danger'
                    }`}>
                      {ret.status}
                    </span>
                    {ret.adminDecisionNote && (
                      <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: '2px' }}>
                        Note: {ret.adminDecisionNote}
                      </div>
                    )}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    {ret.status === 'pending' && (
                      <div style={{ display: 'inline-flex', gap: '0.35rem' }}>
                        <button
                          className="admin-btn admin-btn-success admin-btn-sm"
                          onClick={() => handleDecision(ret._id, 'approved')}
                        >
                          Approve Refund
                        </button>
                        <button
                          className="admin-btn admin-btn-danger admin-btn-sm"
                          onClick={() => handleDecision(ret._id, 'rejected')}
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
  );
}
