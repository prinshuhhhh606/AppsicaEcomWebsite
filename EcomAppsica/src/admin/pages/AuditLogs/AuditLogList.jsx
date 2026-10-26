import React, { useState, useEffect } from 'react';
import {
  ScrollText,
  Search,
  Filter,
  ShieldCheck,
  User,
  Clock,
  Terminal,
  RefreshCw,
} from 'lucide-react';
import { adminService } from '../../../services/adminService';

export default function AuditLogList() {
  const [logs, setLogs] = useState([]);
  const [category, setCategory] = useState('ALL');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadLogs = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await adminService.getAuditLogs({
        category: category !== 'ALL' ? category : undefined,
        search: search || undefined,
      });

      if (res?.success) {
        setLogs(res.logs || []);
      }
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Failed to load audit logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delay = setTimeout(() => {
      loadLogs();
    }, 300);
    return () => clearTimeout(delay);
  }, [category, search]);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0, color: '#f8fafc' }}>
            Administrative Security Audit Trail ({logs.length})
          </h2>
          <p style={{ margin: '0.2rem 0 0', fontSize: '0.85rem', color: '#94a3b8' }}>
            Immutable logging of administrative actions, actor authentication credentials, IP origins, and state mutations.
          </p>
        </div>
        <button className="admin-btn admin-btn-secondary" onClick={loadLogs}>
          <RefreshCw size={15} className={loading ? 'spin-icon' : ''} /> Refresh
        </button>
      </div>

      {error && (
        <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', padding: '0.85rem', borderRadius: '8px', color: '#f87171', marginBottom: '1rem' }}>
          {error}
        </div>
      )}

      {/* FILTER CONTROLS */}
      <div className="admin-filter-bar">
        <div className="admin-search-box">
          <Search size={16} className="admin-search-icon" />
          <input
            type="text"
            className="admin-search-input"
            placeholder="Search by action, administrator, target, or details..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <select
          className="admin-select"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          <option value="ALL">All Event Categories</option>
          <option value="AUTH">Authentication & Users</option>
          <option value="PRODUCTS">Product Moderation</option>
          <option value="ORDERS">Orders & Shipments</option>
          <option value="PAYOUTS">Commissions & Payouts</option>
          <option value="RETURNS">Returns & Refunds</option>
          <option value="SETTINGS">System Settings</option>
        </select>
      </div>

      {/* LOGS TABLE */}
      <div className="admin-table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>Category</th>
              <th>Action Executed</th>
              <th>Target Entity</th>
              <th>Mutation Details</th>
              <th>Administrator</th>
              <th>Client IP</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '3rem' }}>
                  <div className="admin-loading-spinner" />
                </td>
              </tr>
            ) : logs.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
                  No audit log entries found matching criteria.
                </td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr key={log._id}>
                  <td style={{ whiteSpace: 'nowrap', fontSize: '0.78rem', color: '#cbd5e1' }}>
                    <div>{new Date(log.createdAt).toLocaleDateString()}</div>
                    <div style={{ color: '#64748b' }}>{new Date(log.createdAt).toLocaleTimeString()}</div>
                  </td>
                  <td>
                    <span className="admin-badge neutral" style={{ fontWeight: 700, fontSize: '0.7rem' }}>
                      {log.category}
                    </span>
                  </td>
                  <td>
                    <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#818cf8', fontSize: '0.82rem' }}>
                      {log.action}
                    </span>
                  </td>
                  <td>
                    <div style={{ fontWeight: 600, fontSize: '0.82rem', color: '#f8fafc' }}>
                      {log.target || 'N/A'}
                    </div>
                  </td>
                  <td>
                    <div style={{ fontSize: '0.8rem', color: '#cbd5e1', maxWidth: '320px', lineHeight: 1.3 }}>
                      {log.details || 'Administrative operation'}
                    </div>
                  </td>
                  <td>
                    <div style={{ fontSize: '0.82rem', fontWeight: 600 }}>{log.adminName || 'Admin'}</div>
                    <div style={{ fontSize: '0.72rem', color: '#64748b' }}>{log.adminEmail}</div>
                  </td>
                  <td>
                    <span style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: '#94a3b8' }}>
                      {log.ipAddress || '127.0.0.1'}
                    </span>
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
