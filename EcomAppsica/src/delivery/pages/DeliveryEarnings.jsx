import React, { useState, useEffect } from 'react';
import {
  DollarSign,
  TrendingUp,
  CreditCard,
  CheckCircle,
  Clock,
  RefreshCw,
  Calendar,
  Package
} from 'lucide-react';
import { deliveryService } from '../../services/deliveryService';
import { formatPrice } from '../../utils/formatPrice';

export default function DeliveryEarnings() {
  const [earningsData, setEarningsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadEarnings = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await deliveryService.getEarnings();
      if (res?.success) {
        setEarningsData(res);
      }
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Failed to load earnings ledger');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEarnings();
  }, []);

  const summary = earningsData?.summary || {};
  const ledger = earningsData?.ledger || [];

  return (
    <div>
      {/* Header */}
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
            Rider Earnings & Settlements
          </h2>
          <p style={{ margin: 0, fontSize: '0.85rem', color: '#94a3b8' }}>
            Daily trip payouts, incentives, and bank transfer settlement ledger.
          </p>
        </div>

        <button
          onClick={loadEarnings}
          className="deliv-btn deliv-btn-secondary"
          disabled={loading}
          style={{ minHeight: 38 }}
        >
          <RefreshCw size={16} className={loading ? 'spin-icon' : ''} />
          <span>Refresh Ledger</span>
        </button>
      </div>

      {error && (
        <div style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 10, padding: '0.85rem', marginBottom: '1rem', color: '#f87171' }}>
          {error}
        </div>
      )}

      {/* Summary Cards */}
      <div className="deliv-stats-grid" style={{ marginBottom: '1.5rem' }}>
        <div className="deliv-stat-box" style={{ background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(6, 182, 212, 0.08) 100%)', borderColor: 'rgba(16, 185, 129, 0.3)' }}>
          <div className="deliv-stat-icon" style={{ background: '#10b981', color: 'white' }}>
            <DollarSign size={24} />
          </div>
          <div>
            <div className="deliv-stat-val" style={{ color: '#34d399' }}>{formatPrice(summary.totalEarned || 0)}</div>
            <div className="deliv-stat-lbl">Lifetime Earnings</div>
          </div>
        </div>

        <div className="deliv-stat-box">
          <div className="deliv-stat-icon" style={{ background: 'rgba(99, 102, 241, 0.15)', color: '#818cf8' }}>
            <TrendingUp size={24} />
          </div>
          <div>
            <div className="deliv-stat-val">{formatPrice(summary.todayEarned || 0)}</div>
            <div className="deliv-stat-lbl">Today's Payout</div>
          </div>
        </div>

        <div className="deliv-stat-box">
          <div className="deliv-stat-icon" style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24' }}>
            <Calendar size={24} />
          </div>
          <div>
            <div className="deliv-stat-val">{formatPrice(summary.weekEarned || 0)}</div>
            <div className="deliv-stat-lbl">This Week</div>
          </div>
        </div>

        <div className="deliv-stat-box">
          <div className="deliv-stat-icon" style={{ background: 'rgba(168, 85, 247, 0.15)', color: '#c084fc' }}>
            <Package size={24} />
          </div>
          <div>
            <div className="deliv-stat-val">{summary.completedTrips || 0}</div>
            <div className="deliv-stat-lbl">Completed Trips</div>
          </div>
        </div>
      </div>

      {/* Settlement Policy Banner */}
      <div
        className="deliv-card"
        style={{
          background: 'rgba(99, 102, 241, 0.08)',
          border: '1px solid rgba(99, 102, 241, 0.25)',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
          padding: '1.25rem 1.5rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <CreditCard size={22} color="#818cf8" />
          <div>
            <div style={{ fontWeight: 700, color: '#f8fafc', fontSize: '0.95rem' }}>
              Direct Bank & UPI Daily Auto-Settlement Active
            </div>
            <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
              Base Delivery Fee: ₹50 / order • On-time verification bonus: +₹10 • Automatic midnight clearing
            </div>
          </div>
        </div>
        <span
          style={{
            background: 'rgba(16, 185, 129, 0.2)',
            color: '#34d399',
            border: '1px solid rgba(16, 185, 129, 0.4)',
            padding: '4px 10px',
            borderRadius: 999,
            fontSize: '0.78rem',
            fontWeight: 700,
          }}
        >
          ✓ Active Direct Payouts
        </span>
      </div>

      {/* Ledger Table */}
      <div className="deliv-card">
        <div className="deliv-card-header">
          <h3 className="deliv-card-title">
            <DollarSign size={18} color="#10b981" />
            <span>Settlement Ledger Records</span>
          </h3>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem 0', color: '#94a3b8' }}>
            <RefreshCw size={28} className="spin-icon" style={{ margin: '0 auto 0.5rem' }} />
            <p>Loading settlement records…</p>
          </div>
        ) : ledger.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem 1.5rem', color: '#94a3b8' }}>
            <DollarSign size={42} style={{ margin: '0 auto 0.75rem', opacity: 0.4 }} />
            <p style={{ margin: 0 }}>No payout entries recorded yet.</p>
            <p style={{ fontSize: '0.82rem', marginTop: 4 }}>Complete your first verified delivery to generate earnings.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)', textAlign: 'left', color: '#94a3b8' }}>
                  <th style={{ padding: '0.75rem 0.5rem', fontWeight: 600 }}>Date</th>
                  <th style={{ padding: '0.75rem 0.5rem', fontWeight: 600 }}>Order ID</th>
                  <th style={{ padding: '0.75rem 0.5rem', fontWeight: 600 }}>Base Fee</th>
                  <th style={{ padding: '0.75rem 0.5rem', fontWeight: 600 }}>Incentive</th>
                  <th style={{ padding: '0.75rem 0.5rem', fontWeight: 600 }}>Total Payout</th>
                  <th style={{ padding: '0.75rem 0.5rem', fontWeight: 600 }}>Ref ID</th>
                  <th style={{ padding: '0.75rem 0.5rem', fontWeight: 600 }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {ledger.map((entry) => (
                  <tr key={entry._id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                    <td style={{ padding: '0.75rem 0.5rem', color: '#cbd5e1' }}>
                      {new Date(entry.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                    <td style={{ padding: '0.75rem 0.5rem', fontWeight: 700, color: '#f8fafc' }}>
                      #{entry.orderId}
                    </td>
                    <td style={{ padding: '0.75rem 0.5rem', color: '#cbd5e1' }}>
                      ₹{entry.baseFee || 50}
                    </td>
                    <td style={{ padding: '0.75rem 0.5rem', color: '#34d399' }}>
                      +₹{entry.incentive || 10}
                    </td>
                    <td style={{ padding: '0.75rem 0.5rem', fontWeight: 800, color: '#34d399' }}>
                      ₹{entry.totalEarned}
                    </td>
                    <td style={{ padding: '0.75rem 0.5rem', fontFamily: 'monospace', fontSize: '0.8rem', color: '#94a3b8' }}>
                      {entry.settlementReference || 'SETTL-AUTO'}
                    </td>
                    <td style={{ padding: '0.75rem 0.5rem' }}>
                      <span
                        style={{
                          background: 'rgba(16, 185, 129, 0.15)',
                          color: '#34d399',
                          padding: '2px 8px',
                          borderRadius: 6,
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                        }}
                      >
                        {entry.status}
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
