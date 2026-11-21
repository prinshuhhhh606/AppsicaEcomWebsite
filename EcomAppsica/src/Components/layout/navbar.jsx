import React, { useState, useEffect, useRef, useContext } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  ShoppingCart,
  Heart,
  User,
  Search,
  Menu,
  X,
  ChevronDown,
  Package,
  MapPin,
  LogOut,
  Settings,
  Store,
  Truck,
  Sparkles,
  Tag,
  Laptop,
  Shirt,
  Home as HomeIcon,
  ShoppingBag,
  Sparkle,
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
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const categoriesRef = useRef(null);

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
  const location = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Close categories dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (categoriesRef.current && !categoriesRef.current.contains(e.target)) {
        setCategoriesOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Sync categories open state on route change
  const [prevPath, setPrevPath] = useState(location.pathname);
  if (prevPath !== location.pathname) {
    setPrevPath(location.pathname);
    setCategoriesOpen(false);
  }

  const handleLogout = () => {
    logout();
    closeDropdown();
    navigate('/');
  };

  const handleOrdersClick = (e) => {
    e?.preventDefault();
    closeDropdown();
    setCategoriesOpen(false);
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
    setCategoriesOpen(false);
    toggleDropdown();
  };

  const handleAccountClick = (e) => {
    e.stopPropagation();
    if (isAuthenticated) {
      handleToggleUserDropdown(e);
    } else {
      navigate('/login');
    }
  };

  const handleInlineSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      setSearchOpen(true);
    }
  };

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <>
      {/* Top Announcement Bar */}
      <div className="navbar-topbar">
        <div className="container navbar-topbar-inner">
          <div className="topbar-item">
            <span>🌿</span> <span>Free Shipping on Orders Over ₹999</span>
          </div>
          <div className="topbar-divider">•</div>
          <div className="topbar-item">
            <span>🔄</span> <span>30-Day Easy Returns</span>
          </div>
          <div className="topbar-divider">•</div>
          <div className="topbar-item">
            <span>🔒</span> <span>100% Secure Checkout</span>
          </div>
        </div>
      </div>

      <header className={`navbar-wrapper ${scrolled ? 'scrolled' : ''}`}>
        {/* Tier 1: Main Header Row */}
        <div className="navbar-main-tier">
          <div className="container navbar-main-inner">
            {/* Logo */}
            <Link to="/" className="navbar-logo">
              <div className="logo-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/>
                  <path d="M3 6h18"/>
                  <path d="M16 10a4 4 0 0 1-8 0"/>
                </svg>
              </div>
              <div className="navbar-logo-text">
                <span className="logo-name">Stunner<strong>Ysl</strong></span>
                <span className="logo-tagline">LIVE BETTER</span>
              </div>
            </Link>

            {/* Wide Center Search Bar */}
            <form className="navbar-search-bar" onSubmit={handleInlineSearch}>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products, brands and more..."
                className="navbar-search-input"
              />
              <button type="submit" className="navbar-search-submit" title="Search">
                <Search size={16} />
              </button>
            </form>

            {/* Right Action Icons with Text Below (Account, Wishlist, Cart) */}
            <div className="navbar-action-group">
              {/* Account */}
              <div className="nav-action-wrapper" ref={dropdownRef}>
                <button
                  type="button"
                  className="nav-action-btn"
                  onClick={handleAccountClick}
                  title={isAuthenticated ? user?.name : 'Account'}
                >
                  <div className="nav-action-icon-wrap">
                    {isAuthenticated ? (
                      <div className="nav-user-avatar-mini">
                        {user?.name?.charAt(0).toUpperCase()}
                      </div>
                    ) : (
                      <User size={22} />
                    )}
                  </div>
                  <span className="nav-action-label">
                    {isAuthenticated ? (user?.name?.split(' ')[0] || 'Account') : 'Account'}
                  </span>
                </button>

                {/* Account Dropdown */}
                {isDropdownOpen && isAuthenticated && (
                  <div
                    className="nav-dropdown dropdown-menu-anim"
                    onClick={(e) => e.stopPropagation()}
                    role="menu"
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
                                ? 'rgba(6, 59, 44, 0.12)'
                                : user?.role === 'vendor'
                                ? 'rgba(245, 158, 11, 0.15)'
                                : user?.role === 'delivery'
                                ? 'rgba(56, 189, 248, 0.15)'
                                : 'rgba(16, 185, 129, 0.12)',
                            color:
                              user?.role === 'admin'
                                ? '#063b2c'
                                : user?.role === 'vendor'
                                ? '#b45309'
                                : user?.role === 'delivery'
                                ? '#0369a1'
                                : '#065f46',
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
                      style={{ color: '#063b2c', fontWeight: 600, background: 'rgba(6, 59, 44, 0.06)' }}
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
                        style={{ color: '#063b2c', fontWeight: 600, background: 'rgba(6, 59, 44, 0.06)' }}
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
                        style={{ color: '#0369a1', fontWeight: 600, background: 'rgba(56,189,248,0.08)' }}
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

              {/* Wishlist */}
              <Link to="/wishlist" className="nav-action-btn" title="Wishlist">
                <div className="nav-action-icon-wrap">
                  <Heart size={22} />
                  {wishlistCount > 0 && <span className="nav-count-badge">{wishlistCount}</span>}
                </div>
                <span className="nav-action-label">Wishlist</span>
              </Link>

              {/* Cart */}
              <Link to="/cart" className="nav-action-btn" title="Shopping Cart">
                <div className="nav-action-icon-wrap">
                  <ShoppingCart size={22} />
                  {cartCount > 0 && <span className="nav-count-badge">{cartCount}</span>}
                </div>
                <span className="nav-action-label">Cart</span>
              </Link>

              {/* Mobile Menu Button */}
              <button
                className="nav-action-btn mobile-toggle-btn"
                onClick={() => setMobileOpen(true)}
                title="Menu"
              >
                <div className="nav-action-icon-wrap">
                  <Menu size={24} />
                </div>
                <span className="nav-action-label">Menu</span>
              </button>
            </div>
          </div>
        </div>

        {/* Tier 2: Sub-Navigation Bar (All Categories + Horizontal Links) */}
        <div className="navbar-sub-tier">
          <div className="container navbar-sub-inner">
            {/* All Categories Button with Dropdown */}
            <div className="all-categories-container" ref={categoriesRef}>
              <button
                type="button"
                className={`all-categories-btn ${categoriesOpen ? 'active' : ''}`}
                onClick={() => setCategoriesOpen(!categoriesOpen)}
              >
                <Menu size={16} />
                <span>All Categories</span>
                <ChevronDown size={14} className={`cat-chevron ${categoriesOpen ? 'open' : ''}`} />
              </button>

              {/* All Categories Dropdown Menu (Includes Home, Shop, Electronics, Fashion, Orders) */}
              {categoriesOpen && (
                <div className="categories-dropdown animate-slideDown">
                  <div className="cat-dropdown-section">
                    <span className="cat-dropdown-title">Categories</span>
                    <Link to="/category/electronics" className="cat-dropdown-item" onClick={() => setCategoriesOpen(false)}>
                      <div className="cat-item-icon electronics"><Laptop size={16} /></div>
                      <div>
                        <strong>Electronics</strong>
                        <small>Gadgets, audio & lifestyle gear</small>
                      </div>
                    </Link>
                    <Link to="/category/fashion" className="cat-dropdown-item" onClick={() => setCategoriesOpen(false)}>
                      <div className="cat-item-icon fashion"><Shirt size={16} /></div>
                      <div>
                        <strong>Fashion</strong>
                        <small>Curated apparel & footwear</small>
                      </div>
                    </Link>
                    <Link to="/category/home-living" className="cat-dropdown-item" onClick={() => setCategoriesOpen(false)}>
                      <div className="cat-item-icon home"><HomeIcon size={16} /></div>
                      <div>
                        <strong>Home & Living</strong>
                        <small>Modern decor & essentials</small>
                      </div>
                    </Link>
                    <Link to="/category/beauty" className="cat-dropdown-item" onClick={() => setCategoriesOpen(false)}>
                      <div className="cat-item-icon beauty"><Sparkle size={16} /></div>
                      <div>
                        <strong>Beauty & Wellness</strong>
                        <small>Organic skincare & botanicals</small>
                      </div>
                    </Link>
                  </div>

                  <div className="cat-dropdown-divider" />

                  <div className="cat-dropdown-section">
                    <span className="cat-dropdown-title">Quick Navigation</span>
                    <Link to="/" className="cat-dropdown-item" onClick={() => setCategoriesOpen(false)}>
                      <div className="cat-item-icon"><HomeIcon size={16} /></div>
                      <div>
                        <strong>Home</strong>
                        <small>Main storefront showcase</small>
                      </div>
                    </Link>
                    <Link to="/products" className="cat-dropdown-item" onClick={() => setCategoriesOpen(false)}>
                      <div className="cat-item-icon"><ShoppingBag size={16} /></div>
                      <div>
                        <strong>Shop All Products</strong>
                        <small>Browse full catalog</small>
                      </div>
                    </Link>
                    <Link to="/track-order" className="cat-dropdown-item btn-order-item" onClick={() => setCategoriesOpen(false)}>
                      <div className="cat-item-icon orders"><Package size={16} /></div>
                      <div>
                        <strong>Track Order</strong>
                        <small>Live shipment tracking & order search</small>
                      </div>
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* Horizontal Nav Links (Matching ViVA image: Home, Shop, Deals, New Arrivals, Brands, Inspiration, Track Order) */}
            <nav className="navbar-sub-nav">
              <Link
                to="/"
                className={`sub-nav-link ${location.pathname === '/' ? 'active' : ''}`}
              >
                Home
              </Link>
              <Link
                to="/products"
                className={`sub-nav-link ${location.pathname === '/products' && !location.search ? 'active' : ''}`}
              >
                Shop
              </Link>
              <Link
                to="/products?filter=deals"
                className={`sub-nav-link ${location.pathname === '/products' && location.search.includes('filter=deals') ? 'active' : ''}`}
              >
                Deals
              </Link>
              <Link
                to="/products?filter=new"
                className={`sub-nav-link ${location.pathname === '/products' && location.search.includes('filter=new') ? 'active' : ''}`}
              >
                New Arrivals
              </Link>
              <Link
                to="/products?filter=brands"
                className={`sub-nav-link ${location.pathname === '/products' && location.search.includes('filter=brands') ? 'active' : ''}`}
              >
                Brands
              </Link>
              <Link
                to="/products?filter=inspiration"
                className={`sub-nav-link ${location.pathname === '/products' && location.search.includes('filter=inspiration') ? 'active' : ''}`}
              >
                Inspiration
              </Link>
              <Link
                to="/track-order"
                className={`sub-nav-link ${location.pathname.startsWith('/track-order') ? 'active' : ''}`}
              >
                Track Order
              </Link>

              {isAdmin && (
                <Link
                  to="/admin/dashboard"
                  className="sub-nav-link admin-pill"
                >
                  <Settings size={14} /> Admin Panel
                </Link>
              )}

              {isVendorApproved ? (
                <Link
                  to="/vendor/dashboard"
                  className="sub-nav-link vendor-pill"
                >
                  <Store size={14} /> Seller Central
                </Link>
              ) : (
                <Link
                  to="/vendor/login"
                  className="sub-nav-link vendor-pill"
                >
                  <Store size={14} /> Become a Seller
                </Link>
              )}
            </nav>
          </div>
        </div>
      </header>

      {searchOpen && <SearchBar onClose={() => setSearchOpen(false)} />}
      {mobileOpen && <MobileMenu onClose={() => setMobileOpen(false)} />}
    </>
  );
};

export default Navbar;
