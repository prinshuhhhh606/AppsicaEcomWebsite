import React, { useState, useContext, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Menu,
  ExternalLink,
  ShieldCheck,
  Clock,
  AlertTriangle,
  User,
  Store,
  LogOut,
  ChevronDown
} from 'lucide-react';
import { AuthContext } from '../../context/AuthContextValue';

export default function VendorHeader({ onMenuToggle, title = 'Dashboard' }) {
  const { user, logout } = useContext(AuthContext);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/vendor/login');
  };

  const status = user?.vendorStatus || 'approved';

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

        {/* User profile dropdown */}
        <div style={{ position: 'relative' }} ref={dropdownRef}>
          <button
            className="vendor-user-dropdown-btn"
            onClick={() => setDropdownOpen((prev) => !prev)}
          >
            <div className="vendor-user-avatar">
              {user?.name?.charAt(0)?.toUpperCase() || 'V'}
            </div>
            <ChevronDown size={14} style={{ color: '#94a3b8' }} />
          </button>

          {dropdownOpen && (
            <div
              style={{
                position: 'absolute',
                top: 'calc(100% + 8px)',
                right: 0,
                width: '230px',
                background: '#0f172a',
                border: '1px solid rgba(148, 163, 184, 0.15)',
                borderRadius: '12px',
                boxShadow: '0 12px 30px rgba(0,0,0,0.5)',
                padding: '0.5rem',
                zIndex: 110,
                animation: 'scaleIn 0.15s ease',
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
                onClick={() => setDropdownOpen(false)}
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
                onClick={() => setDropdownOpen(false)}
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
