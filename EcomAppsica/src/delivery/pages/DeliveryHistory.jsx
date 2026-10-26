import React, { useState, useEffect } from 'react';
import {
  History,
  CheckCircle,
  XCircle,
  Search,
  RefreshCw,
  MapPin,
  Calendar,
  DollarSign,
  Package
} from 'lucide-react';
import { deliveryService } from '../../services/deliveryService';
import { formatPrice } from '../../utils/formatPrice';

export default function DeliveryHistory() {
  const [historyOrders, setHistoryOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');

  const loadHistory = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await deliveryService.getHistory({ filter, search });
      if (res?.success) {
        setHistoryOrders(res.orders || []);
      }
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Failed to load delivery history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, [filter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadHistory();
  };

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
            Delivery Trip History
          </h2>
          <p style={{ margin: 0, fontSize: '0.85rem', color: '#94a3b8' }}>
            Archived record of verified deliveries, proof of delivery timestamps, and failed attempts.
          </p>
        </div>

        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '0.5rem', width: '100%', maxWidth: 300 }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={16} style={{ position: 'absolute', left: 12, top: 12, color: '#64748b' }} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search Order ID…"
              style={{
                width: '100%',
                padding: '0.6rem 0.85rem 0.6rem 2.25rem',
                background: '#182234',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: 10,
                color: '#f8fafc',
                fontSize: '0.85rem',
                outline: 'none',
              }}
            />
          </div>
          <button type="submit" className="deliv-btn deliv-btn-secondary" style={{ minHeight: 38, padding: '0 12px' }}>
            Filter
          </button>
        </form>
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem' }}>
        {[
          { key: 'all', label: 'All Trips' },
          { key: 'delivered', label: 'Completed Deliveries' },
          { key: 'failed', label: 'Failed Attempts' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: 8,
              border: 'none',
              background: filter === tab.key ? '#6366f1' : 'rgba(255, 255, 255, 0.05)',
              color: filter === tab.key ? 'white' : '#94a3b8',
              fontSize: '0.82rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {error && (
        <div style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 10, padding: '0.85rem', marginBottom: '1rem', color: '#f87171' }}>
          {error}
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem 0', color: '#94a3b8' }}>
          <RefreshCw size={28} className="spin-icon" style={{ margin: '0 auto 0.5rem' }} />
          <p>Loading historical records…</p>
        </div>
      ) : historyOrders.length === 0 ? (
        <div className="deliv-card" style={{ textAlign: 'center', padding: '3rem 1.5rem', color: '#94a3b8' }}>
          <History size={42} style={{ margin: '0 auto 0.75rem', opacity: 0.4 }} />
          <h3 style={{ margin: '0 0 0.25rem', color: '#f8fafc' }}>No History Recorded</h3>
          <p style={{ margin: 0, fontSize: '0.85rem' }}>No past delivery records match the current filters.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          {historyOrders.map((ord) => {
            const isDelivered = ord.deliveryStatus === 'Delivered';
            const dateStr = ord.deliveryDeliveredAt || ord.deliveryFailedAt || ord.updatedAt;

            return (
              <div
                key={ord._id}
                className="deliv-card"
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '1rem',
                  marginBottom: 0,
                  borderLeft: isDelivered ? '4px solid #10b981' : '4px solid #ef4444',
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: 4 }}>
                    <span style={{ fontWeight: 800, fontSize: '1rem', color: '#f8fafc' }}>
                      #{ord.orderId}
                    </span>
                    <span className={`deliv-badge ${isDelivered ? 'deliv-badge-delivered' : 'deliv-badge-failed'}`}>
                      {ord.deliveryStatus}
                    </span>
                  </div>

                  <div style={{ fontSize: '0.82rem', color: '#cbd5e1', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <MapPin size={14} color="#64748b" />
                    <span>{ord.shippingAddress?.fullName} • {ord.shippingAddress?.city} ({ord.shippingAddress?.pincode})</span>
                  </div>

                  {ord.deliveryNotes && (
                    <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: 4, fontStyle: 'italic' }}>
                      Notes: "{ord.deliveryNotes}"
                    </div>
                  )}

                  {ord.deliveryFailureReason && (
                    <div style={{ fontSize: '0.78rem', color: '#f87171', marginTop: 4 }}>
                      Failure Reason: {ord.deliveryFailureReason}
                    </div>
                  )}
                </div>

                <div style={{ textAlign: 'right' }}>
                  {isDelivered && (
                    <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#34d399', marginBottom: 2 }}>
                      +₹{ord.deliveryFee || 50}
                    </div>
                  )}
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'flex-end' }}>
                    <Calendar size={13} />
                    <span>{new Date(dateStr).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
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
