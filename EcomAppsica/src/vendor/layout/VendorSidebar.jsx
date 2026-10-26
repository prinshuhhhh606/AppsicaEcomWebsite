import React, { useContext } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  BarChart3,
  Star,
  Store,
  LogOut,
  ExternalLink,
  X,
  ShieldCheck,
  Clock,
  AlertCircle
} from 'lucide-react';
import { AuthContext } from '../../context/AuthContextValue';

export default function VendorSidebar({ isOpen, onClose }) {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/vendor/login');
  };

  const isApproved = user?.vendorStatus === 'approved';
  const isPending = user?.vendorStatus === 'pending';

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.6)',
            zIndex: 99,
          }}
        />
      )}

      <aside className={`vendor-sidebar ${isOpen ? 'open' : ''}`}>
        {/* Header */}
        <div className="vendor-sidebar-header">
          <Link to="/vendor/dashboard" className="vendor-logo-link" onClick={onClose}>
            <div className="vendor-logo-icon">V</div>
            <div className="vendor-logo-text">
              <span>Appsica</span>
              <span className="vendor-badge-seller">Seller Central</span>
            </div>
          </Link>
          <button className="vendor-sidebar-close" onClick={onClose} title="Close Menu">
            <X size={20} />
          </button>
        </div>

        {/* Navigation Menu */}
        <nav className="vendor-sidebar-nav">
          <span className="vendor-nav-heading">Main</span>

          <NavLink
            to="/vendor/dashboard"
            className={({ isActive }) => `vendor-nav-item ${isActive ? 'active' : ''}`}
            onClick={onClose}
          >
            <LayoutDashboard size={18} />
            <span>Dashboard</span>
          </NavLink>

          <NavLink
            to="/vendor/products"
            className={({ isActive }) => `vendor-nav-item ${isActive ? 'active' : ''}`}
            onClick={onClose}
          >
            <Package size={18} />
            <span>My Products</span>
          </NavLink>

          <NavLink
            to="/vendor/orders"
            className={({ isActive }) => `vendor-nav-item ${isActive ? 'active' : ''}`}
            onClick={onClose}
          >
            <ShoppingBag size={18} />
            <span>Orders & Sales</span>
          </NavLink>

          <span className="vendor-nav-heading">Analytics & Feedback</span>

          <NavLink
            to="/vendor/reports"
            className={({ isActive }) => `vendor-nav-item ${isActive ? 'active' : ''}`}
            onClick={onClose}
          >
            <BarChart3 size={18} />
            <span>Earnings & Reports</span>
          </NavLink>

          <NavLink
            to="/vendor/reviews"
            className={({ isActive }) => `vendor-nav-item ${isActive ? 'active' : ''}`}
            onClick={onClose}
          >
            <Star size={18} />
            <span>Customer Reviews</span>
          </NavLink>

          <span className="vendor-nav-heading">Store Management</span>

          <NavLink
            to="/vendor/profile"
            className={({ isActive }) => `vendor-nav-item ${isActive ? 'active' : ''}`}
            onClick={onClose}
          >
            <Store size={18} />
            <span>Store Profile</span>
          </NavLink>
        </nav>

        {/* Footer */}
        <div className="vendor-sidebar-footer">
          <div className="vendor-store-card">
            <div className="vendor-store-avatar">
              {user?.storeLogo ? (
                <img src={user.storeLogo} alt="Logo" />
              ) : (
                user?.storeName?.charAt(0) || user?.name?.charAt(0) || 'S'
              )}
            </div>
            <div className="vendor-store-info">
              <div className="vendor-store-name" title={user?.storeName || user?.name}>
                {user?.storeName || user?.name || 'My Store'}
              </div>
              <div className={`vendor-store-status ${isApproved ? 'approved' : 'pending'}`}>
                {isApproved ? (
                  <>
                    <ShieldCheck size={12} /> Verified Seller
                  </>
                ) : isPending ? (
                  <>
                    <Clock size={12} /> Pending Approval
                  </>
                ) : (
                  <>
                    <AlertCircle size={12} /> {user?.vendorStatus}
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="vendor-sidebar-links">
            <Link to="/" className="vendor-sidebar-btn" target="_blank" rel="noopener noreferrer" title="View Public Store">
              <ExternalLink size={14} /> Storefront
            </Link>
            <button className="vendor-sidebar-btn" onClick={handleLogout} title="Log Out">
              <LogOut size={14} /> Logout
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
