import React, { useState, useEffect, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ShoppingCart,
  Heart,
  User,
  Search,
  Menu,
  X,
  Package,
  MapPin,
  LogOut,
  Settings
} from 'lucide-react';
import { CartContext } from '../../context/CartContextValue';
import { WishlistContext } from '../../context/WishlistContextValue';
import { AuthContext } from '../../context/AuthContextValue';
import SearchBar from './SearchBar';
import MobileMenu from './MobileMenu';
import './navbar.css';

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const { cartCount } = useContext(CartContext);
  const { wishlistCount } = useContext(WishlistContext);
  const { user, isAuthenticated, isAdmin, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleLogout = () => {
    logout();
    setDropdownOpen(false);
    navigate('/');
  };

  const handleOrdersClick = (e) => {
    e?.preventDefault();
    setDropdownOpen(false);
    if (!isAuthenticated) {
      navigate('/login?redirect=/my-orders');
    } else {
      navigate('/my-orders');
    }
  };

  return (
    <>
      <nav className={`navbar ${scrolled ? 'scrolled' : ''}`}>
        <div className="container navbar-inner">
          {/* Logo */}
          <Link to="/" className="navbar-logo">
            <div className="logo-icon">A</div>
            <span>Appsica<strong>Ecom</strong></span>
          </Link>

          {/* Desktop Nav Links */}
          <ul className="navbar-links">
            <li><Link to="/">Home</Link></li>
            <li><Link to="/products">Shop</Link></li>
            <li><Link to="/category/electronics">Electronics</Link></li>
            <li><Link to="/category/fashion">Fashion</Link></li>
            <li>
              <button
                className="nav-link-btn"
                onClick={handleOrdersClick}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#94a3b8',
                  fontSize: '0.9rem',
                  fontWeight: 500,
                  padding: '6px 12px',
                  borderRadius: 8,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  fontFamily: 'inherit',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = '#818cf8';
                  e.currentTarget.style.background = 'rgba(99,102,241,0.12)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = '#94a3b8';
                  e.currentTarget.style.background = 'none';
                }}
              >
                <Package size={16} /> My Orders
              </button>
            </li>
          </ul>

          {/* Actions */}
          <div className="navbar-actions">
            <button className="nav-icon-btn" onClick={() => setSearchOpen(true)} title="Search Products">
              <Search size={20} />
            </button>

            {/* Dedicated My Orders Button in Header Action Bar */}
            <button
              className="nav-icon-btn nav-orders-btn"
              onClick={handleOrdersClick}
              title="My Orders & Tracking"
              style={{
                width: 'auto',
                padding: '0 12px',
                gap: 6,
                fontWeight: 600,
                fontSize: '0.85rem',
              }}
            >
              <Package size={18} />
              <span className="nav-orders-label">Orders</span>
            </button>

            <Link to="/wishlist" className="nav-icon-btn" title="Wishlist">
              <Heart size={20} />
              {wishlistCount > 0 && <span className="nav-badge">{wishlistCount}</span>}
            </Link>

            <Link to="/cart" className="nav-icon-btn" title="Cart">
              <ShoppingCart size={20} />
              {cartCount > 0 && <span className="nav-badge">{cartCount}</span>}
            </Link>

            {isAuthenticated ? (
              <div className="nav-user" onClick={() => setDropdownOpen((o) => !o)}>
                <div className="nav-avatar">{user?.name?.charAt(0).toUpperCase()}</div>
                {dropdownOpen && (
                  <div className="nav-dropdown animate-scaleIn">
                    <div className="nav-dropdown-header">
                      <p className="nav-dropdown-name">{user?.name}</p>
                      <p className="nav-dropdown-email">{user?.email}</p>
                    </div>

                    <Link to="/account/profile" onClick={() => setDropdownOpen(false)}>
                      <User size={15} /> Profile
                    </Link>

                    <Link
                      to="/my-orders"
                      onClick={() => setDropdownOpen(false)}
                      style={{ color: '#818cf8', fontWeight: 600, background: 'rgba(99,102,241,0.08)' }}
                    >
                      <Package size={15} /> My Orders
                    </Link>

                    <Link to="/wishlist" onClick={() => setDropdownOpen(false)}>
                      <Heart size={15} /> Wishlist
                    </Link>

                    <Link to="/account/addresses" onClick={() => setDropdownOpen(false)}>
                      <MapPin size={15} /> Saved Addresses
                    </Link>

                    {isAdmin && (
                      <Link to="/admin" className="admin-link" onClick={() => setDropdownOpen(false)}>
                        <Settings size={15} /> Admin Dashboard
                      </Link>
                    )}

                    <button className="dropdown-logout" onClick={handleLogout}>
                      <LogOut size={15} style={{ verticalAlign: 'middle', marginRight: 6 }} /> Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link to="/login" className="btn btn-primary btn-sm">
                Login
              </Link>
            )}

            <button className="nav-icon-btn mobile-menu-btn" onClick={() => setMobileOpen(true)} title="Menu">
              <Menu size={22} />
            </button>
          </div>
        </div>
      </nav>

      {searchOpen && <SearchBar onClose={() => setSearchOpen(false)} />}
      {mobileOpen && <MobileMenu onClose={() => setMobileOpen(false)} />}
    </>
  );
};

export default Navbar;
