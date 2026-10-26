import React, { useState, useContext, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Menu,
  Bell,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  User,
  Store,
  LogOut,
  ChevronDown,
  CheckCircle,
  AlertTriangle,
  Info,
} from 'lucide-react';
import { AuthContext } from '../../context/AuthContextValue';
import { adminService } from '../../services/adminService';

export default function AdminHeader({ onMenuToggle, title = 'Enterprise Dashboard', onRefresh }) {
  const { user, logout } = useContext(AuthContext);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const userDropdownRef = useRef(null);
  const notifDropdownRef = useRef(null);
  const navigate = useNavigate();

  // Load live notifications
  const loadNotifications = async () => {
    try {
      const res = await adminService.getNotifications();
      if (res?.success) {
        setNotifications(res.notifications || []);
        setUnreadCount(res.unreadCount || 0);
      }
    } catch {
      // quiet fallback
    }
  };

  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 60000); // 1-minute auto poll
    return () => clearInterval(interval);
  }, []);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (userDropdownRef.current && !userDropdownRef.current.contains(e.target)) {
        setUserDropdownOpen(false);
      }
      if (notifDropdownRef.current && !notifDropdownRef.current.contains(e.target)) {
        setNotifDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkAllRead = async () => {
    try {
      await adminService.markAllNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error(err);
    }
  };

  const handleManualRefresh = async () => {
    setRefreshing(true);
    await loadNotifications();
    if (onRefresh) await onRefresh();
    setTimeout(() => setRefreshing(false), 600);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="admin-header">
      <div className="admin-header-left">
        <button className="admin-menu-toggle" onClick={onMenuToggle} title="Toggle Navigation">
          <Menu size={22} />
        </button>
        <h1 className="admin-page-title">{title}</h1>
      </div>

      <div className="admin-header-right">
        {/* Refresh button */}
        <button
          className="admin-header-btn"
          onClick={handleManualRefresh}
          title="Refresh Live Data"
        >
          <RefreshCw size={17} className={refreshing ? 'spin-icon' : ''} />
        </button>

        {/* View Storefront */}
        <Link
          to="/"
          target="_blank"
          className="admin-header-btn"
          title="View Live Storefront"
        >
          <ExternalLink size={17} />
        </Link>

        {/* Notifications Dropdown */}
        <div style={{ position: 'relative' }} ref={notifDropdownRef}>
          <button
            className="admin-header-btn"
            onClick={() => setNotifDropdownOpen((prev) => !prev)}
            title="System Notifications"
          >
            <Bell size={18} />
            {unreadCount > 0 && <span className="admin-header-badge-dot" />}
          </button>

          {notifDropdownOpen && (
            <div
              style={{
                position: 'absolute',
                top: 'calc(100% + 10px)',
                right: 0,
                width: '360px',
                background: '#0d1424',
                border: '1px solid rgba(148, 163, 184, 0.2)',
                borderRadius: '12px',
                boxShadow: '0 20px 40px rgba(0,0,0,0.6)',
                zIndex: 100,
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  padding: '0.85rem 1rem',
                  borderBottom: '1px solid rgba(148, 163, 184, 0.12)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Bell size={16} color="#6366f1" />
                  <span style={{ fontWeight: 700, fontSize: '0.88rem' }}>Admin Alerts</span>
                  {unreadCount > 0 && (
                    <span className="admin-badge danger" style={{ fontSize: '0.65rem', padding: '0.1rem 0.4rem' }}>
                      {unreadCount} new
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#818cf8',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    Mark read
                  </button>
                )}
              </div>

              <div style={{ maxHeight: '320px', overflowY: 'auto' }}>
                {notifications.length === 0 ? (
                  <div style={{ padding: '2rem 1rem', textAlign: 'center', color: '#64748b', fontSize: '0.85rem' }}>
                    No pending alerts
                  </div>
                ) : (
                  notifications.slice(0, 6).map((n) => (
                    <div
                      key={n._id}
                      style={{
                        padding: '0.75rem 1rem',
                        borderBottom: '1px solid rgba(148, 163, 184, 0.08)',
                        background: n.isRead ? 'transparent' : 'rgba(99, 102, 241, 0.05)',
                        display: 'flex',
                        gap: '0.75rem',
                        alignItems: 'flex-start',
                      }}
                    >
                      <div style={{ marginTop: '2px' }}>
                        {n.severity === 'error' ? (
                          <AlertTriangle size={15} color="#ef4444" />
                        ) : n.severity === 'success' ? (
                          <CheckCircle size={15} color="#10b981" />
                        ) : (
                          <Info size={15} color="#06b6d4" />
                        )}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#f8fafc' }}>
                          {n.title}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '2px', lineHeight: 1.3 }}>
                          {n.message}
                        </div>
                        <div style={{ fontSize: '0.68rem', color: '#64748b', marginTop: '4px' }}>
                          {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div
                style={{
                  padding: '0.6rem',
                  textAlign: 'center',
                  background: 'rgba(255,255,255,0.02)',
                  borderTop: '1px solid rgba(148, 163, 184, 0.1)',
                }}
              >
                <Link
                  to="/admin/notifications"
                  onClick={() => setNotifDropdownOpen(false)}
                  style={{ color: '#818cf8', fontSize: '0.78rem', textDecoration: 'none', fontWeight: 600 }}
                >
                  View All Notifications &rarr;
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* User Dropdown */}
        <div style={{ position: 'relative' }} ref={userDropdownRef}>
          <div
            className="admin-user-pill"
            onClick={() => setUserDropdownOpen((prev) => !prev)}
          >
            <div className="admin-avatar">
              {(user?.name || 'A')[0].toUpperCase()}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left', lineHeight: 1.1 }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{user?.name || 'Administrator'}</span>
              <span style={{ fontSize: '0.68rem', color: '#818cf8', textTransform: 'uppercase', fontWeight: 700 }}>
                {user?.role || 'Admin'}
              </span>
            </div>
            <ChevronDown size={14} color="#94a3b8" />
          </div>

          {userDropdownOpen && (
            <div
              style={{
                position: 'absolute',
                top: 'calc(100% + 10px)',
                right: 0,
                width: '240px',
                background: '#0d1424',
                border: '1px solid rgba(148, 163, 184, 0.2)',
                borderRadius: '12px',
                padding: '0.5rem',
                boxShadow: '0 20px 40px rgba(0,0,0,0.6)',
                zIndex: 100,
              }}
            >
              <div
                style={{
                  padding: '0.6rem 0.75rem',
                  borderBottom: '1px solid rgba(148, 163, 184, 0.12)',
                  marginBottom: '0.4rem',
                }}
              >
                <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#f8fafc' }}>
                  {user?.name || 'Admin'}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                  {user?.email || 'admin@appsica.com'}
                </div>
              </div>

              <Link
                to="/admin/settings"
                onClick={() => setUserDropdownOpen(false)}
                className="admin-nav-item"
                style={{ padding: '0.55rem 0.75rem', fontSize: '0.82rem' }}
              >
                <ShieldCheck size={16} /> Platform Settings
              </Link>

              <Link
                to="/admin/audit-logs"
                onClick={() => setUserDropdownOpen(false)}
                className="admin-nav-item"
                style={{ padding: '0.55rem 0.75rem', fontSize: '0.82rem' }}
              >
                <User size={16} /> Audit Trail
              </Link>

              <button
                onClick={handleLogout}
                className="admin-btn admin-btn-danger admin-btn-sm"
                style={{ width: '100%', marginTop: '0.4rem', justifyContent: 'flex-start' }}
              >
                <LogOut size={15} /> Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
