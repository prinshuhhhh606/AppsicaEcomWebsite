import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Home, ShoppingBag, Heart, Package, User, LogOut, Settings } from 'lucide-react';
import { AuthContext } from '../../context/AuthContextValue';
import './MobileMenu.css';

const NAV = [
  { to: '/', icon: Home, label: 'Home' },
  { to: '/products', icon: ShoppingBag, label: 'Shop' },
  { to: '/my-orders', icon: Package, label: 'My Orders', highlight: true },
  { to: '/wishlist', icon: Heart, label: 'Wishlist' },
  { to: '/account/profile', icon: User, label: 'Profile' },
];

const MobileMenu = ({ onClose }) => {
  const { user, isAuthenticated, isAdmin, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    onClose();
    navigate('/');
  };

  const handleItemClick = (to) => {
    onClose();
    if ((to === '/my-orders' || to === '/account/profile') && !isAuthenticated) {
      navigate(`/login?redirect=${encodeURIComponent(to)}`);
    } else {
      navigate(to);
    }
  };

  return (
    <div className="mobile-menu-overlay animate-fadeIn" onClick={onClose}>
      <div className="mobile-menu animate-slideRight" onClick={(e) => e.stopPropagation()}>
        <div className="mobile-menu-header">
          <div className="logo-icon">A</div>
          <span className="mobile-logo-text">AppsicaEcom</span>
          <button className="mobile-close" onClick={onClose}>
            <X size={22} />
          </button>
        </div>

        {isAuthenticated && (
          <div className="mobile-user-info">
            <div className="mobile-avatar">{user?.name?.charAt(0).toUpperCase()}</div>
            <div>
              <p className="mobile-user-name">{user?.name}</p>
              <p className="mobile-user-email">{user?.email}</p>
            </div>
          </div>
        )}

        <nav className="mobile-nav">
          {NAV.map(({ to, icon, label, highlight }) => (
            <button
              key={to}
              type="button"
              className={`mobile-nav-item ${highlight ? 'orders-highlight' : ''}`}
              style={{
                background: highlight ? 'rgba(99,102,241,0.1)' : 'transparent',
                border: 'none',
                width: '100%',
                textAlign: 'left',
                cursor: 'pointer',
                color: highlight ? '#818cf8' : 'inherit',
                fontWeight: highlight ? 600 : 'normal',
                fontFamily: 'inherit',
              }}
              onClick={() => handleItemClick(to)}
            >
              {React.createElement(icon, { size: 20 })}
              <span>{label}</span>
            </button>
          ))}

          {isAdmin && (
            <button
              type="button"
              className="mobile-nav-item admin"
              style={{
                background: 'transparent',
                border: 'none',
                width: '100%',
                textAlign: 'left',
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
              onClick={() => {
                onClose();
                navigate('/admin');
              }}
            >
              <Settings size={20} />
              <span>Admin Panel</span>
            </button>
          )}
        </nav>

        <div className="mobile-menu-footer">
          {isAuthenticated ? (
            <button className="btn btn-danger btn-full" onClick={handleLogout}>
              <LogOut size={18} /> Logout
            </button>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <button
                type="button"
                className="btn btn-primary btn-full"
                onClick={() => {
                  onClose();
                  navigate('/login');
                }}
              >
                Login
              </button>
              <button
                type="button"
                className="btn btn-secondary btn-full"
                onClick={() => {
                  onClose();
                  navigate('/register');
                }}
              >
                Register
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MobileMenu;
