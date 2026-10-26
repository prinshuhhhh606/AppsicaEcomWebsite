import React, { useContext } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  Store,
  Truck,
  History,
  DollarSign,
  Bell,
  User,
  LogOut,
  ExternalLink,
  X,
  Bike
} from 'lucide-react';
import { AuthContext } from '../../context/AuthContextValue';

export default function DeliverySidebar({ isOpen, onClose }) {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/delivery/login');
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.65)',
            zIndex: 99,
          }}
        />
      )}

      <aside className={`delivery-sidebar ${isOpen ? 'open' : ''}`}>
        {/* Header */}
        <div className="delivery-sidebar-header">
          <Link to="/delivery/dashboard" className="delivery-logo" onClick={onClose}>
            <div className="delivery-logo-icon">
              <Bike size={20} />
            </div>
            <div>
              <div className="delivery-logo-text">Appsica</div>
              <span className="delivery-badge-rider">Delivery Partner</span>
            </div>
          </Link>
          <button
            onClick={onClose}
            className="deliv-btn deliv-btn-secondary"
            style={{ padding: '4px 8px', minHeight: 32 }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="delivery-sidebar-nav">
          <span className="delivery-nav-heading">Overview</span>
          <NavLink
            to="/delivery/dashboard"
            className={({ isActive }) => `delivery-nav-item ${isActive ? 'active' : ''}`}
            onClick={onClose}
          >
            <LayoutDashboard size={18} />
            <span>Dashboard</span>
          </NavLink>

          <span className="delivery-nav-heading">Deliveries</span>
          <NavLink
            to="/delivery/assigned"
            className={({ isActive }) => `delivery-nav-item ${isActive ? 'active' : ''}`}
            onClick={onClose}
          >
            <Package size={18} />
            <span>Assigned Orders</span>
          </NavLink>

          <NavLink
            to="/delivery/pickups"
            className={({ isActive }) => `delivery-nav-item ${isActive ? 'active' : ''}`}
            onClick={onClose}
          >
            <Store size={18} />
            <span>Pickup Hubs</span>
          </NavLink>

          <NavLink
            to="/delivery/active"
            className={({ isActive }) => `delivery-nav-item ${isActive ? 'active' : ''}`}
            onClick={onClose}
          >
            <Truck size={18} />
            <span>Active Deliveries</span>
          </NavLink>

          <span className="delivery-nav-heading">Financials & Records</span>
          <NavLink
            to="/delivery/history"
            className={({ isActive }) => `delivery-nav-item ${isActive ? 'active' : ''}`}
            onClick={onClose}
          >
            <History size={18} />
            <span>Delivery History</span>
          </NavLink>

          <NavLink
            to="/delivery/earnings"
            className={({ isActive }) => `delivery-nav-item ${isActive ? 'active' : ''}`}
            onClick={onClose}
          >
            <DollarSign size={18} />
            <span>Earnings & Ledger</span>
          </NavLink>

          <span className="delivery-nav-heading">Account</span>
          <NavLink
            to="/delivery/notifications"
            className={({ isActive }) => `delivery-nav-item ${isActive ? 'active' : ''}`}
            onClick={onClose}
          >
            <Bell size={18} />
            <span>Notifications</span>
          </NavLink>

          <NavLink
            to="/delivery/profile"
            className={({ isActive }) => `delivery-nav-item ${isActive ? 'active' : ''}`}
            onClick={onClose}
          >
            <User size={18} />
            <span>Profile & Vehicle</span>
          </NavLink>
        </nav>

        {/* Footer */}
        <div className="delivery-sidebar-footer">
          <Link
            to="/"
            target="_blank"
            className="delivery-nav-item"
            style={{ fontSize: '0.8rem', color: '#94a3b8', padding: '0.5rem 0.75rem' }}
          >
            <ExternalLink size={15} />
            <span>View Customer Store</span>
          </Link>

          <button
            onClick={handleLogout}
            className="deliv-btn deliv-btn-danger deliv-btn-full"
            style={{ marginTop: '0.5rem', minHeight: 40, fontSize: '0.85rem' }}
          >
            <LogOut size={16} /> Sign Out
          </button>
        </div>
      </aside>
    </>
  );
}
