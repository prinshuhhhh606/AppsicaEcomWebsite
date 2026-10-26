import React, { useState, useEffect } from 'react';
import {
  Bell,
  CheckCircle,
  Package,
  Store,
  DollarSign,
  AlertCircle,
  RefreshCw,
  Clock
} from 'lucide-react';
import { deliveryService } from '../../services/deliveryService';

export default function DeliveryNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const loadNotifications = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await deliveryService.getNotifications();
      if (res?.success) {
        setNotifications(res.notifications || []);
        setUnreadCount(res.unreadCount || 0);
      }
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  const handleMarkAllRead = async () => {
    try {
      const res = await deliveryService.markAllNotificationsRead();
      if (res?.success) {
        setUnreadCount(0);
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
        setSuccess('All notifications marked as read');
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err) {
      setError('Failed to mark notifications read');
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case 'assignment':
        return <Package size={20} color="#818cf8" />;
      case 'pickup':
        return <Store size={20} color="#f59e0b" />;
      case 'delivery':
        return <CheckCircle size={20} color="#10b981" />;
      case 'payout':
        return <DollarSign size={20} color="#34d399" />;
      default:
        return <Bell size={20} color="#38bdf8" />;
    }
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
            Rider Notifications & Alerts
          </h2>
          <p style={{ margin: 0, fontSize: '0.85rem', color: '#94a3b8' }}>
            Real-time assignment updates, pickup reminders, and settlement notices.
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            className="deliv-btn deliv-btn-secondary"
            style={{ minHeight: 38 }}
          >
            <CheckCircle size={15} /> Mark All as Read
          </button>
        )}
      </div>

      {error && (
        <div style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 10, padding: '0.85rem', marginBottom: '1rem', color: '#f87171' }}>
          {error}
        </div>
      )}

      {success && (
        <div style={{ background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 10, padding: '0.85rem', marginBottom: '1rem', color: '#34d399' }}>
          {success}
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem 0', color: '#94a3b8' }}>
          <RefreshCw size={28} className="spin-icon" style={{ margin: '0 auto 0.5rem' }} />
          <p>Loading alerts feed…</p>
        </div>
      ) : notifications.length === 0 ? (
        <div className="deliv-card" style={{ textAlign: 'center', padding: '3rem 1.5rem', color: '#94a3b8' }}>
          <Bell size={42} style={{ margin: '0 auto 0.75rem', opacity: 0.4 }} />
          <h3 style={{ margin: '0 0 0.25rem', color: '#f8fafc' }}>No Notifications</h3>
          <p style={{ margin: 0, fontSize: '0.85rem' }}>Your notification feed is completely clear.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {notifications.map((n) => (
            <div
              key={n._id}
              className="deliv-card"
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '1rem',
                marginBottom: 0,
                background: n.isRead ? '#182234' : 'rgba(99, 102, 241, 0.12)',
                borderColor: n.isRead ? 'var(--deliv-border)' : 'rgba(99, 102, 241, 0.35)',
              }}
            >
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 10,
                  background: 'rgba(255, 255, 255, 0.05)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                {getIcon(n.type)}
              </div>

              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
                  <div style={{ fontWeight: 700, color: '#f8fafc', fontSize: '0.95rem' }}>
                    {n.title}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Clock size={12} />
                    <span>{new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>

                <div style={{ fontSize: '0.85rem', color: '#cbd5e1', lineHeight: 1.4 }}>
                  {n.message}
                </div>

                {n.orderId && (
                  <span
                    style={{
                      display: 'inline-block',
                      marginTop: 6,
                      fontSize: '0.75rem',
                      fontFamily: 'monospace',
                      color: '#818cf8',
                      background: 'rgba(99, 102, 241, 0.15)',
                      padding: '1px 6px',
                      borderRadius: 4,
                    }}
                  >
                    #{n.orderId}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
