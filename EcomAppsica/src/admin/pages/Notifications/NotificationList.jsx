import React, { useState, useEffect } from 'react';
import {
  Bell,
  CheckCircle,
  AlertTriangle,
  Info,
  Clock,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';
import { adminService } from '../../../services/adminService';

export default function NotificationList() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const loadNotifications = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await adminService.getNotifications();
      if (res?.success) {
        setNotifications(res.notifications || []);
        setUnreadCount(res.unreadCount || 0);
      }
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  const handleMarkAllRead = async () => {
    try {
      await adminService.markAllNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
      setSuccess('All notifications marked as read.');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Failed to update notifications');
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0, color: '#f8fafc' }}>
            System Alerts & Administrative Notifications ({unreadCount} Unread)
          </h2>
          <p style={{ margin: '0.2rem 0 0', fontSize: '0.85rem', color: '#94a3b8' }}>
            Real-time triggers for vendor onboarding, product moderation reviews, disputes, and critical gateway alerts.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="admin-btn admin-btn-secondary" onClick={loadNotifications}>
            <RefreshCw size={15} className={loading ? 'spin-icon' : ''} /> Refresh
          </button>
          {unreadCount > 0 && (
            <button className="admin-btn admin-btn-primary" onClick={handleMarkAllRead}>
              <CheckCircle size={16} /> Mark All as Read
            </button>
          )}
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

      <div className="admin-card">
        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem' }}>
            <div className="admin-loading-spinner" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="admin-empty-state" style={{ padding: '3rem' }}>
            <Bell size={40} color="#64748b" style={{ margin: '0 auto 1rem' }} />
            <h3 style={{ margin: 0, color: '#f8fafc', fontSize: '1.1rem' }}>Inbox is Clear</h3>
            <p style={{ fontSize: '0.85rem', color: '#94a3b8', margin: '0.25rem 0 0' }}>
              No administrative system notifications at this time.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {notifications.map((n) => (
              <div
                key={n._id}
                style={{
                  background: n.isRead ? 'rgba(255,255,255,0.015)' : 'rgba(99, 102, 241, 0.08)',
                  border: '1px solid ' + (n.isRead ? 'var(--ap-border-subtle)' : 'rgba(99, 102, 241, 0.3)'),
                  borderRadius: '10px',
                  padding: '1rem 1.25rem',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '1rem',
                  transition: 'all 0.2s',
                }}
              >
                <div style={{ marginTop: '3px' }}>
                  {n.severity === 'error' ? (
                    <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <AlertTriangle size={18} color="#ef4444" />
                    </div>
                  ) : n.severity === 'success' ? (
                    <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <CheckCircle size={18} color="#10b981" />
                    </div>
                  ) : (
                    <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(6, 182, 212, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Info size={18} color="#06b6d4" />
                    </div>
                  )}
                </div>

                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                    <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#f8fafc' }}>
                      {n.title}
                    </div>
                    <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                      {new Date(n.createdAt).toLocaleString()}
                    </span>
                  </div>

                  <p style={{ margin: '0 0 0.5rem', fontSize: '0.85rem', color: '#cbd5e1', lineHeight: 1.4 }}>
                    {n.message}
                  </p>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <span className="admin-badge neutral" style={{ fontSize: '0.68rem' }}>
                      {n.type || 'SYSTEM'}
                    </span>
                    {!n.isRead && (
                      <span className="admin-badge danger" style={{ fontSize: '0.65rem' }}>
                        NEW
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
