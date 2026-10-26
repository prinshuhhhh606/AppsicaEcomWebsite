import React, { useContext, useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Menu,
  Bell,
  Power,
  User,
  LogOut,
  Bike,
  ShieldCheck,
  AlertTriangle
} from 'lucide-react';
import { AuthContext } from '../../context/AuthContextValue';
import { deliveryService } from '../../services/deliveryService';

export default function DeliveryHeader({ onMenuToggle, title = 'Delivery Dashboard' }) {
  const { user, logout, updateUser } = useContext(AuthContext);
  const [isOnline, setIsOnline] = useState(user?.isOnline ?? true);
  const [toggling, setToggling] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    setIsOnline(user?.isOnline ?? true);
    // Fetch notifications unread count
    deliveryService
      .getNotifications()
      .then((res) => {
        if (res?.success) setUnreadCount(res.unreadCount || 0);
      })
      .catch(() => {});
  }, [user]);

  const handleToggleOnline = async () => {
    setToggling(true);
    try {
      const res = await deliveryService.toggleAvailability();
      if (res?.success) {
        setIsOnline(res.isOnline);
        updateUser({ ...user, isOnline: res.isOnline });
      }
    } catch (err) {
      console.error('Failed to toggle availability:', err);
    } finally {
      setToggling(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/delivery/login');
  };

  return (
    <header className="delivery-header">
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <button
          onClick={onMenuToggle}
          className="deliv-btn deliv-btn-secondary"
          style={{ padding: '6px 10px', minHeight: 36, display: 'inline-flex' }}
          title="Open Menu"
        >
          <Menu size={20} />
        </button>
        <h1 className="delivery-header-title">{title}</h1>
      </div>

      <div className="delivery-header-actions">
        {/* Online / Offline Status Toggle Button */}
        <button
          className={`availability-pill ${isOnline ? 'online' : 'offline'}`}
          onClick={handleToggleOnline}
          disabled={toggling}
          title={isOnline ? 'Click to go Offline' : 'Click to go Online'}
        >
          <span className="pulse-dot" />
          <span>{toggling ? 'Updating…' : isOnline ? 'Online (Ready)' : 'Offline'}</span>
        </button>

        {/* Notifications Icon */}
        <Link
          to="/delivery/notifications"
          className="deliv-btn deliv-btn-secondary"
          style={{ padding: '8px 10px', minHeight: 38, position: 'relative' }}
          title="Notifications"
        >
          <Bell size={18} />
          {unreadCount > 0 && (
            <span
              style={{
                position: 'absolute',
                top: -4,
                right: -4,
                background: '#ef4444',
                color: 'white',
                fontSize: '0.65rem',
                fontWeight: 800,
                padding: '1px 6px',
                borderRadius: 999,
              }}
            >
              {unreadCount}
            </span>
          )}
        </Link>

        {/* Profile Link */}
        <Link
          to="/delivery/profile"
          className="deliv-btn deliv-btn-secondary"
          style={{ padding: '8px 12px', minHeight: 38, gap: '0.4rem', fontSize: '0.85rem' }}
          title="Delivery Partner Profile"
        >
          <Bike size={16} color="#34d399" />
          <span style={{ maxWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {user?.name?.split(' ')[0] || 'Rider'}
          </span>
        </Link>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="deliv-btn deliv-btn-danger"
          style={{ padding: '8px 10px', minHeight: 38 }}
          title="Sign Out"
        >
          <LogOut size={16} />
        </button>
      </div>
    </header>
  );
}
