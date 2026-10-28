import React, { useState, useEffect, useRef, useContext } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Menu,
  ExternalLink,
  ShieldCheck,
  Clock,
  AlertTriangle,
  User,
  Store,
  LogOut,
  ChevronDown,
  Bell,
  Package,
  CheckCircle,
  TrendingUp,
} from 'lucide-react';
import { AuthContext } from '../../context/AuthContextValue';
import { vendorService } from '../../services/vendorService';

export default function VendorHeader({ onMenuToggle, title = 'Dashboard' }) {
  const { user, logout } = useContext(AuthContext);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const userDropdownRef = useRef(null);
  const notifDropdownRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Close dropdowns on route changes
  useEffect(() => {
    setUserDropdownOpen(false);
    setNotifDropdownOpen(false);
  }, [location.pathname]);

  // Periodic polling for seller notifications (every 10s)
  useEffect(() => {
    let isMounted = true;
    const fetchNotifs = async () => {
      try {
        const res = await vendorService.getNotifications();
        if (isMounted && res?.success) {
          setNotifications(res.notifications || []);
          setUnreadCount(res.unreadCount || 0);
        }
      } catch {
        // quiet fallback
      }
    };

    fetchNotifs();
    const interval = setInterval(fetchNotifs, 10000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  // Click outside and escape key handling
  useEffect(() => {
    if (!userDropdownOpen && !notifDropdownOpen) return;

    const handleClickOutside = (e) => {
      if (userDropdownRef.current && !userDropdownRef.current.contains(e.target)) {
        setUserDropdownOpen(false);
      }
      if (notifDropdownRef.current && !notifDropdownRef.current.contains(e.target)) {
        setNotifDropdownOpen(false);
      }
    };

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setUserDropdownOpen(false);
        setNotifDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [userDropdownOpen, notifDropdownOpen]);

  const handleToggleNotif = (e) => {
    e.stopPropagation();
    setUserDropdownOpen(false);
    setNotifDropdownOpen((prev) => !prev);
  };

  const handleToggleUser = (e) => {
    e.stopPropagation();
    setNotifDropdownOpen(false);
    setUserDropdownOpen((prev) => !prev);
  };

  const handleMarkAllRead = async () => {
    try {
      await vendorService.markAllNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogout = () => {
    setUserDropdownOpen(false);
    setNotifDropdownOpen(false);
    logout();
    navigate('/vendor/login');
  };

  const status = user?.vendorStatus || 'pending';

  return (
    <header className="vendor-header">
      <div className="vendor-header-left">
        <button className="vendor-menu-toggle" onClick={onMenuToggle} title="Toggle Navigation">
          <Menu size={22} />
        </button>
        <h1 className="vendor-page-title">{title}</h1>
      </div>

      <div className="vendor-header-right">
        {/* Status indicator */}
        <div className={`vendor-status-pill ${status}`}>
          {status === 'approved' && (
            <>
              <ShieldCheck size={14} /> Verified Seller
            </>
          )}
          {status === 'pending' && (
            <>
              <Clock size={14} /> Awaiting Approval
            </>
          )}
          {status === 'rejected' && (
            <>
              <AlertTriangle size={14} /> Application Rejected
            </>
          )}
          {status === 'suspended' && (
            <>
              <AlertTriangle size={14} /> Account Suspended
            </>
          )}
        </div>

        {/* Public Storefront button */}
        <Link to="/" className="vendor-visit-store-btn" target="_blank" rel="noopener noreferrer">
          <ExternalLink size={15} />
          <span>View Store</span>
        </Link>

        {/* Notification Bell Dropdown */}
        <div style={{ position: 'relative' }} ref={notifDropdownRef}>
          <button
            type="button"
            className="vendor-user-dropdown-btn"
            onClick={handleToggleNotif}
            aria-haspopup="true"
            aria-expanded={notifDropdownOpen}
            aria-label="Vendor order notifications"
            style={{
              width: '38px',
              height: '38px',
              padding: 0,
              borderRadius: '8px',
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: notifDropdownOpen ? '#1e293b' : 'rgba(15, 23, 42, 0.6)',
              border: '1px solid rgba(148, 163, 184, 0.15)',
              cursor: 'pointer',
              color: '#cbd5e1',
            }}
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span
                style={{
                  position: 'absolute',
                  top: '-4px',
                  right: '-4px',
                  background: '#ef4444',
                  color: '#fff',
                  borderRadius: '999px',
                  fontSize: '0.65rem',
                  fontWeight: 700,
                  minWidth: '18px',
                  height: '18px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '0 4px',
                  border: '2px solid #090d16',
                }}
              >
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>

          {notifDropdownOpen && (
            <div
              className="dropdown-menu-anim"
              onClick={(e) => e.stopPropagation()}
              style={{
                position: 'absolute',
                top: 'calc(100% + 8px)',
                right: 0,
                width: '320px',
                maxWidth: 'calc(100vw - 24px)',
                background: '#0f172a',
                border: '1px solid rgba(148, 163, 184, 0.18)',
                borderRadius: '12px',
                boxShadow: '0 16px 36px rgba(0,0,0,0.5)',
                zIndex: 110,
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  padding: '0.8rem 1rem',
                  borderBottom: '1px solid rgba(148, 163, 184, 0.12)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  background: 'rgba(255,255,255,0.02)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Bell size={15} color="#10b981" />
                  <span style={{ fontWeight: 700, fontSize: '0.88rem', color: '#f8fafc' }}>
                    Order Alerts
                  </span>
                  {unreadCount > 0 && (
                    <span
                      style={{
                        background: 'rgba(16, 185, 129, 0.15)',
                        color: '#10b981',
                        border: '1px solid rgba(16, 185, 129, 0.3)',
                        borderRadius: '999px',
                        fontSize: '0.68rem',
                        fontWeight: 600,
                        padding: '0.1rem 0.45rem',
                      }}
                    >
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
                      color: '#60a5fa',
                      fontSize: '0.74rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    Mark read
                  </button>
                )}
              </div>

              <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                {notifications.length === 0 ? (
                  <div style={{ padding: '2rem 1rem', textAlign: 'center', color: '#64748b', fontSize: '0.84rem' }}>
                    No order alerts yet
                  </div>
                ) : (
                  notifications.slice(0, 8).map((n) => (
                    <div
                      key={n._id}
                      onClick={() => {
                        setNotifDropdownOpen(false);
                        navigate('/vendor/orders');
                      }}
                      style={{
                        padding: '0.75rem 1rem',
                        borderBottom: '1px solid rgba(148, 163, 184, 0.08)',
                        background: n.isRead ? 'transparent' : 'rgba(99, 102, 241, 0.06)',
                        cursor: 'pointer',
                        display: 'flex',
                        gap: '0.75rem',
                        alignItems: 'flex-start',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.03)')}
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.background = n.isRead
                          ? 'transparent'
                          : 'rgba(99, 102, 241, 0.06)')
                      }
                    >
                      <div style={{ marginTop: '2px' }}>
                        {n.type === 'NEW_ORDER' ? (
                          <Package size={15} color="#10b981" />
                        ) : (
                          <CheckCircle size={15} color="#6366f1" />
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
                  to="/vendor/orders"
                  onClick={() => setNotifDropdownOpen(false)}
                  style={{ color: '#10b981', fontSize: '0.78rem', textDecoration: 'none', fontWeight: 600 }}
                >
                  View All Orders &rarr;
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* User profile dropdown */}
        <div style={{ position: 'relative' }} ref={userDropdownRef}>
          <button
            type="button"
            className="vendor-user-dropdown-btn"
            onClick={handleToggleUser}
            aria-haspopup="true"
            aria-expanded={userDropdownOpen}
            aria-label="Vendor account menu"
          >
            <div className="vendor-user-avatar">
              {user?.name?.charAt(0)?.toUpperCase() || 'V'}
            </div>
            <ChevronDown size={14} style={{ color: '#94a3b8' }} />
          </button>

          {userDropdownOpen && (
            <div
              className="dropdown-menu-anim"
              onClick={(e) => e.stopPropagation()}
              style={{
                position: 'absolute',
                top: 'calc(100% + 8px)',
                right: 0,
                width: '230px',
                maxWidth: 'calc(100vw - 24px)',
                background: '#0f172a',
                border: '1px solid rgba(148, 163, 184, 0.15)',
                borderRadius: '12px',
                boxShadow: '0 12px 30px rgba(0,0,0,0.5)',
                padding: '0.5rem',
                zIndex: 110,
              }}
            >
              <div
                style={{
                  padding: '0.65rem 0.75rem',
                  borderBottom: '1px solid rgba(148, 163, 184, 0.1)',
                  marginBottom: '0.35rem',
                }}
              >
                <div style={{ fontWeight: 600, color: '#fff', fontSize: '0.88rem' }}>
                  {user?.storeName || user?.name}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: 2 }}>
                  {user?.email}
                </div>
              </div>

              <Link
                to="/vendor/profile"
                onClick={() => setUserDropdownOpen(false)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.6rem',
                  padding: '0.55rem 0.75rem',
                  color: '#cbd5e1',
                  textDecoration: 'none',
                  fontSize: '0.84rem',
                  borderRadius: '6px',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = '#1e293b')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              >
                <Store size={15} /> Store Settings
              </Link>

              <Link
                to="/account/profile"
                onClick={() => setUserDropdownOpen(false)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.6rem',
                  padding: '0.55rem 0.75rem',
                  color: '#cbd5e1',
                  textDecoration: 'none',
                  fontSize: '0.84rem',
                  borderRadius: '6px',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = '#1e293b')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              >
                <User size={15} /> Personal Account
              </Link>

              <button
                onClick={handleLogout}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.6rem',
                  width: '100%',
                  padding: '0.55rem 0.75rem',
                  color: '#f87171',
                  background: 'transparent',
                  border: 'none',
                  fontSize: '0.84rem',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              >
                <LogOut size={15} /> Log Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
