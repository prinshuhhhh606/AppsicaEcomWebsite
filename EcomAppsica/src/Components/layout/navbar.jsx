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
  Settings,
  Store,
  Truck,
} from 'lucide-react';
import { CartContext } from '../../context/CartContextValue';
import { WishlistContext } from '../../context/WishlistContextValue';
import { AuthContext } from '../../context/AuthContextValue';
import SearchBar from './SearchBar';
import MobileMenu from './MobileMenu';
import { useDropdown } from '../../hooks/useDropdown';
import './navbar.css';

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const {
    isOpen: isDropdownOpen,
    dropdownRef,
    toggle: toggleDropdown,
    close: closeDropdown,
  } = useDropdown(false);

  const { cartCount } = useContext(CartContext);
  const { wishlistCount } = useContext(WishlistContext);
  const { user, isAuthenticated, isAdmin, isVendor, isDelivery, logout } = useContext(AuthContext);
  const isVendorApproved = Boolean(isVendor && (user?.role === 'admin' || user?.vendorStatus === 'approved'));
  const isDeliveryApproved = Boolean(isDelivery && (user?.role === 'admin' || user?.deliveryStatus === 'approved'));
  const navigate = useNavigate();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleLogout = () => {
    logout();
    closeDropdown();
    navigate('/');
  };

  const handleOrdersClick = (e) => {
    e?.preventDefault();
    closeDropdown();
    if (!isAuthenticated) {
      navigate('/login?redirect=/my-orders');
    } else {
      navigate('/my-orders');
    }
  };

  const handleToggleUserDropdown = (e) => {
    e.stopPropagation();
    setMobileOpen(false);
    setSearchOpen(false);
    toggleDropdown();
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
            {isAdmin && (
              <li>
                <Link
                  to="/admin/dashboard"
                  style={{
                    color: '#c084fc',
                    fontWeight: 700,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 5,
                    background: 'rgba(192, 132, 252, 0.12)',
                    padding: '4px 10px',
                    borderRadius: 6,
                    border: '1px solid rgba(192, 132, 252, 0.3)',
                  }}
                >
                  <Settings size={15} /> Admin Panel
                </Link>
              </li>
            )}
            <li>
              <Link
                to={isVendorApproved ? "/vendor/dashboard" : "/vendor/login"}
                style={{
                  color: '#a5b4fc',
                  fontWeight: 600,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 5,
                }}
              >
                <Store size={15} /> {isVendorApproved ? "Seller Central" : "Become a Seller"}
              </Link>
            </li>
            <li>
              <Link
                to={isDeliveryApproved ? "/delivery/dashboard" : "/delivery/login"}
                style={{
                  color: '#38bdf8',
                  fontWeight: 600,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 5,
                }}
              >
                <Truck size={15} /> {isDeliveryApproved ? "Delivery Dashboard" : "Delivery Partner"}
              </Link>
            </li>
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
              <div className="nav-user" ref={dropdownRef}>
                <button
                  type="button"
                  className="nav-user-btn"
                  onClick={handleToggleUserDropdown}
                  aria-expanded={isDropdownOpen}
                  aria-haspopup="true"
                  aria-label="User Account Menu"
                >
                  <div className="nav-avatar">{user?.name?.charAt(0).toUpperCase()}</div>
                </button>
                {isDropdownOpen && (
                  <div
                    className="nav-dropdown dropdown-menu-anim"
                    onClick={(e) => e.stopPropagation()}
                    role="menu"
                    aria-orientation="vertical"
                  >
                    <div className="nav-dropdown-header">
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6, marginBottom: 2 }}>
                        <p className="nav-dropdown-name" style={{ margin: 0 }}>{user?.name}</p>
                        <span
                          style={{
                            fontSize: '0.66rem',
                            fontWeight: 700,
                            padding: '2px 7px',
                            borderRadius: 10,
                            textTransform: 'uppercase',
                            background:
                              user?.role === 'admin'
                                ? 'rgba(192, 132, 252, 0.2)'
                                : user?.role === 'vendor'
                                ? 'rgba(245, 158, 11, 0.2)'
                                : user?.role === 'delivery'
                                ? 'rgba(56, 189, 248, 0.2)'
                                : 'rgba(16, 185, 129, 0.2)',
                            color:
                              user?.role === 'admin'
                                ? '#c084fc'
                                : user?.role === 'vendor'
                                ? '#fde68a'
                                : user?.role === 'delivery'
                                ? '#bae6fd'
                                : '#a7f3d0',
                          }}
                        >
                          {user?.role || 'user'}
                        </span>
                      </div>
                      <p className="nav-dropdown-email">{user?.email}</p>
                    </div>

                    <Link to="/account/profile" onClick={closeDropdown} role="menuitem">
                      <User size={15} /> Profile
                    </Link>

                    <Link
                      to="/my-orders"
                      onClick={closeDropdown}
                      role="menuitem"
                      style={{ color: '#818cf8', fontWeight: 600, background: 'rgba(99,102,241,0.08)' }}
                    >
                      <Package size={15} /> My Orders
                    </Link>

                    <Link to="/wishlist" onClick={closeDropdown} role="menuitem">
                      <Heart size={15} /> Wishlist
                    </Link>

                    <Link to="/account/addresses" onClick={closeDropdown} role="menuitem">
                      <MapPin size={15} /> Saved Addresses
                    </Link>

                    {isAdmin && (
                      <Link to="/admin/dashboard" className="admin-link" onClick={closeDropdown} role="menuitem">
                        <Settings size={15} /> Admin Dashboard
                      </Link>
                    )}

                    {isVendorApproved ? (
                      <Link
                        to="/vendor/dashboard"
                        onClick={closeDropdown}
                        role="menuitem"
                        style={{ color: '#818cf8', fontWeight: 600, background: 'rgba(99,102,241,0.08)' }}
                      >
                        <Store size={15} /> Seller Central
                      </Link>
                    ) : (
                      <Link to="/vendor/register" onClick={closeDropdown} role="menuitem">
                        <Store size={15} /> Become a Seller
                      </Link>
                    )}

                    {isDeliveryApproved ? (
                      <Link
                        to="/delivery/dashboard"
                        onClick={closeDropdown}
                        role="menuitem"
                        style={{ color: '#38bdf8', fontWeight: 600, background: 'rgba(56,189,248,0.08)' }}
                      >
                        <Truck size={15} /> Delivery Dashboard
                      </Link>
                    ) : (
                      <Link to="/delivery/login" onClick={closeDropdown} role="menuitem">
                        <Truck size={15} /> Delivery Partner
                      </Link>
                    )}

                    <button className="dropdown-logout" onClick={handleLogout} role="menuitem">
                      <LogOut size={15} style={{ verticalAlign: 'middle', marginRight: 6 }} /> Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link to="/login" className="btn btn-primary btn-sm">
                Login / Sign Up
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
