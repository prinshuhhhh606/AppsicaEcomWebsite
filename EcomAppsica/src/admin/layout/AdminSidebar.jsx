import React, { useContext } from 'react';
import { NavLink, Link, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Store,
  UserCheck,
  Package,
  Layers,
  ShoppingBag,
  CreditCard,
  DollarSign,
  RotateCcw,
  Truck,
  Ticket,
  Image,
  BarChart3,
  Bell,
  ScrollText,
  Settings,
  LogOut,
  ExternalLink,
  X,
  ShieldAlert,
  Bike,
} from 'lucide-react';
import { AuthContext } from '../../context/AuthContextValue';
import { adminService } from '../../services/adminService';

export default function AdminSidebar({ isOpen, onClose, unreadCount = 0 }) {
  const { user, logout } = useContext(AuthContext);
  const [pendingVendorCount, setPendingVendorCount] = React.useState(0);
  const [pendingDeliveryCount, setPendingDeliveryCount] = React.useState(0);
  const navigate = useNavigate();
  const location = useLocation();

  React.useEffect(() => {
    let isMounted = true;
    const fetchCounts = async () => {
      try {
        const [vRes, dRes] = await Promise.all([
          adminService.getVendors().catch(() => ({ vendors: [] })),
          adminService.getDeliveryPartners().catch(() => ({ partners: [] })),
        ]);
        if (isMounted) {
          const pVendors = (vRes?.vendors || []).filter((v) => v.vendorStatus === 'pending').length;
          const pDelivery = (dRes?.partners || []).filter(
            (d) => d.deliveryStatus === 'pending' || d.status === 'pending' || d.approvalStatus === 'pending'
          ).length;
          setPendingVendorCount(pVendors);
          setPendingDeliveryCount(pDelivery);
        }
      } catch {
        // quiet fallback
      }
    };

    fetchCounts();
    const interval = setInterval(fetchCounts, 10000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <>
      {/* Mobile backdrop */}
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

      <aside className={`admin-sidebar ${isOpen ? 'open' : ''}`}>
        {/* Header */}
        <div className="admin-sidebar-header">
          <Link to="/admin/dashboard" className="admin-logo-link" onClick={onClose}>
            <div className="admin-logo-icon">A</div>
            <div className="admin-logo-text">
              <span>Appsica</span>
              <span className="admin-badge-control">Enterprise Admin</span>
            </div>
          </Link>
          <button className="admin-sidebar-close" onClick={onClose} title="Close Navigation">
            <X size={20} />
          </button>
        </div>

        {/* Navigation Menu */}
        <nav className="admin-sidebar-nav">
          <span className="admin-nav-heading">Main Overview</span>

          <NavLink
            to="/admin/dashboard"
            className={({ isActive }) => `admin-nav-item ${isActive ? 'active' : ''}`}
            onClick={onClose}
          >
            <LayoutDashboard size={18} />
            <span>Dashboard</span>
          </NavLink>

          <span className="admin-nav-heading">Customers & Vendors</span>

          <NavLink
            to="/admin/users"
            className={({ isActive }) => `admin-nav-item ${isActive ? 'active' : ''}`}
            onClick={onClose}
          >
            <Users size={18} />
            <span>Users & Customers</span>
          </NavLink>

          <NavLink
            to="/admin/vendors"
            className={({ isActive }) => `admin-nav-item ${isActive ? 'active' : ''}`}
            onClick={onClose}
          >
            <Store size={18} />
            <span>Vendors Directory</span>
          </NavLink>

          <NavLink
            to="/admin/pending-approval"
            className={({ isActive }) => {
              const isPending =
                isActive ||
                location.pathname.includes('/pending-approval') ||
                location.pathname.includes('/pending-approvals') ||
                location.pathname.includes('/vendor-applications') ||
                location.pathname.includes('/seller-approval-requests') ||
                location.pathname.includes('/delivery-applications') ||
                location.pathname.includes('/delivery-partner-requests');
              return `admin-nav-item ${isPending ? 'active' : ''}`;
            }}
            onClick={onClose}
          >
            <UserCheck size={18} />
            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flex: 1 }}>
              <span>Pending Approval</span>
              {(pendingVendorCount + pendingDeliveryCount) > 0 && (
                <span
                  style={{
                    background: '#f59e0b',
                    color: '#0f172a',
                    fontWeight: 700,
                    fontSize: '0.7rem',
                    padding: '2px 7px',
                    borderRadius: '999px',
                    lineHeight: 1,
                  }}
                >
                  {pendingVendorCount + pendingDeliveryCount}
                </span>
              )}
            </span>
          </NavLink>

          <NavLink
            to="/admin/delivery-partners"
            className={({ isActive }) => `admin-nav-item ${isActive ? 'active' : ''}`}
            onClick={onClose}
          >
            <Truck size={18} />
            <span>Delivery Fleet</span>
          </NavLink>

          <NavLink
            to="/admin/delivery-assignments"
            className={({ isActive }) => `admin-nav-item ${isActive ? 'active' : ''}`}
            onClick={onClose}
          >
            <Bike size={18} />
            <span>Dispatch Monitoring</span>
          </NavLink>

          <span className="admin-nav-heading">Catalog & Orders</span>

          <NavLink
            to="/admin/products"
            className={({ isActive }) => `admin-nav-item ${isActive ? 'active' : ''}`}
            onClick={onClose}
          >
            <Package size={18} />
            <span>Products & Stock</span>
          </NavLink>

          <NavLink
            to="/admin/categories"
            className={({ isActive }) => `admin-nav-item ${isActive ? 'active' : ''}`}
            onClick={onClose}
          >
            <Layers size={18} />
            <span>Categories</span>
          </NavLink>

          <NavLink
            to="/admin/orders"
            className={({ isActive }) => `admin-nav-item ${isActive ? 'active' : ''}`}
            onClick={onClose}
          >
            <ShoppingBag size={18} />
            <span>Orders Lifecycle</span>
          </NavLink>

          <span className="admin-nav-heading">Finance & Logistics</span>

          <NavLink
            to="/admin/payments"
            className={({ isActive }) => `admin-nav-item ${isActive ? 'active' : ''}`}
            onClick={onClose}
          >
            <CreditCard size={18} />
            <span>Payments Ledger</span>
          </NavLink>

          <NavLink
            to="/admin/payouts"
            className={({ isActive }) => `admin-nav-item ${isActive ? 'active' : ''}`}
            onClick={onClose}
          >
            <DollarSign size={18} />
            <span>Commissions & Payouts</span>
          </NavLink>

          <NavLink
            to="/admin/returns"
            className={({ isActive }) => `admin-nav-item ${isActive ? 'active' : ''}`}
            onClick={onClose}
          >
            <RotateCcw size={18} />
            <span>Returns & Disputes</span>
          </NavLink>

          <NavLink
            to="/admin/shipping"
            className={({ isActive }) => `admin-nav-item ${isActive ? 'active' : ''}`}
            onClick={onClose}
          >
            <Truck size={18} />
            <span>Shipping Zones</span>
          </NavLink>

          <span className="admin-nav-heading">Marketing & Content</span>

          <NavLink
            to="/admin/coupons"
            className={({ isActive }) => `admin-nav-item ${isActive ? 'active' : ''}`}
            onClick={onClose}
          >
            <Ticket size={18} />
            <span>Coupons & Promos</span>
          </NavLink>

          <NavLink
            to="/admin/banners"
            className={({ isActive }) => `admin-nav-item ${isActive ? 'active' : ''}`}
            onClick={onClose}
          >
            <Image size={18} />
            <span>Home Banners</span>
          </NavLink>

          <span className="admin-nav-heading">Intelligence & System</span>

          <NavLink
            to="/admin/reports"
            className={({ isActive }) => `admin-nav-item ${isActive ? 'active' : ''}`}
            onClick={onClose}
          >
            <BarChart3 size={18} />
            <span>Reports & Exports</span>
          </NavLink>

          <NavLink
            to="/admin/notifications"
            className={({ isActive }) => `admin-nav-item ${isActive ? 'active' : ''}`}
            onClick={onClose}
          >
            <Bell size={18} />
            <span>System Notifications</span>
            {unreadCount > 0 && <span className="admin-nav-badge">{unreadCount}</span>}
          </NavLink>

          <NavLink
            to="/admin/audit-logs"
            className={({ isActive }) => `admin-nav-item ${isActive ? 'active' : ''}`}
            onClick={onClose}
          >
            <ScrollText size={18} />
            <span>Audit Trail</span>
          </NavLink>

          <NavLink
            to="/admin/settings"
            className={({ isActive }) => `admin-nav-item ${isActive ? 'active' : ''}`}
            onClick={onClose}
          >
            <Settings size={18} />
            <span>Platform Settings</span>
          </NavLink>
        </nav>

        {/* Footer shortcuts */}
        <div className="admin-sidebar-footer">
          <Link
            to="/"
            target="_blank"
            className="admin-nav-item"
            style={{ fontSize: '0.8rem', color: '#94a3b8' }}
          >
            <ExternalLink size={16} />
            <span>Live Customer Store</span>
          </Link>

          <Link
            to="/vendor/dashboard"
            className="admin-nav-item"
            style={{ fontSize: '0.8rem', color: '#94a3b8' }}
          >
            <Store size={16} />
            <span>Seller Central</span>
          </Link>

          <button
            onClick={handleLogout}
            className="admin-btn admin-btn-danger admin-btn-sm"
            style={{ width: '100%', marginTop: '0.25rem' }}
          >
            <LogOut size={15} /> Sign Out
          </button>
        </div>
      </aside>
    </>
  );
}
