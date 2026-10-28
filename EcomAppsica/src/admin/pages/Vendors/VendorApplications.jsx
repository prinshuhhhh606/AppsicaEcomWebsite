import React, { useState, useEffect } from 'react';
import { useSearchParams, useLocation, Link } from 'react-router-dom';
import {
  UserCheck,
  Bike,
  Store,
  Search,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Phone,
  Mail,
  FileText,
  Clock,
  ShieldCheck,
  RefreshCw,
  MapPin,
  Truck,
  Car,
  DollarSign,
  ChevronRight,
  Info,
  Calendar,
  Layers,
} from 'lucide-react';
import { adminService } from '../../../services/adminService';

export default function VendorApplications({ defaultTab }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();

  // Determine initial active tab based on query param, prop, or pathname
  const getInitialTab = () => {
    const urlTab = searchParams.get('tab');
    if (urlTab === 'delivery' || urlTab === 'seller' || urlTab === 'all') {
      return urlTab;
    }
    if (defaultTab) return defaultTab;
    if (location.pathname.includes('/delivery-applications') || location.pathname.includes('/delivery-partner-requests')) {
      return 'delivery';
    }
    if (location.pathname.includes('/vendor-applications') || location.pathname.includes('/seller-approval-requests')) {
      return 'seller';
    }
    return 'all';
  };

  const [activeTab, setActiveTab] = useState(getInitialTab);
  const [vendorApps, setVendorApps] = useState([]);
  const [deliveryApps, setDeliveryApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showHistory, setShowHistory] = useState(false);

  // Rejection modal state
  const [rejectModalItem, setRejectModalItem] = useState(null); // { id, name, type: 'vendor' | 'delivery' }
  const [rejectionReason, setRejectionReason] = useState('');

  // Keep active tab in sync if query param or path changes
  useEffect(() => {
    const urlTab = searchParams.get('tab');
    if (urlTab && ['delivery', 'seller', 'all'].includes(urlTab)) {
      setActiveTab(urlTab);
    }
  }, [searchParams]);

  const handleTabSwitch = (newTab) => {
    setActiveTab(newTab);
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set('tab', newTab);
      return next;
    });
  };

  // Fetch both Seller applications and Delivery Partner requests
  const loadAllApplications = async (isBackground = false) => {
    if (!isBackground) setLoading(true);
    setError('');

    try {
      const [vRes, dRes] = await Promise.all([
        adminService.getVendors().catch(() => ({ vendors: [] })),
        adminService.getDeliveryPartners().catch(() => ({ partners: [] })),
      ]);

      if (vRes?.success || Array.isArray(vRes?.vendors)) {
        setVendorApps(vRes.vendors || []);
      }
      if (dRes?.success || Array.isArray(dRes?.partners)) {
        setDeliveryApps(dRes.partners || []);
      }
    } catch (err) {
      if (!isBackground) {
        setError(err?.response?.data?.message || err?.message || 'Failed to load pending applications');
      }
    } finally {
      if (!isBackground) setLoading(false);
    }
  };

  // 6-second polling for live real-time updates
  useEffect(() => {
    loadAllApplications(false);
    const interval = setInterval(() => {
      loadAllApplications(true);
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  // ==========================================
  // SELLER (VENDOR) ACTIONS
  // ==========================================
  const handleApproveVendor = async (vendor) => {
    if (!window.confirm(`Approve seller store application for "${vendor.storeName || vendor.name}"?`)) return;

    setActionLoading(`vendor-${vendor._id}`);
    setError('');
    try {
      await adminService.updateVendorStatus(vendor._id, { status: 'approved' });
      setVendorApps((prev) =>
        prev.map((v) => (v._id === vendor._id ? { ...v, vendorStatus: 'approved', role: 'vendor' } : v))
      );
      setSuccess(`✓ Store "${vendor.storeName || vendor.name}" approved successfully! The seller can now log in and add live products.`);
      setTimeout(() => setSuccess(''), 4500);
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Approval failed');
    } finally {
      setActionLoading(null);
    }
  };

  // ==========================================
  // DELIVERY PARTNER ACTIONS
  // ==========================================
  const handleApproveDelivery = async (partner) => {
    if (!window.confirm(`Approve delivery partner application for "${partner.name}" (${partner.vehicleType} - ${partner.vehicleNumber || 'No reg'})?`)) return;

    setActionLoading(`delivery-${partner._id}`);
    setError('');
    try {
      await adminService.updateDeliveryPartnerStatus(partner._id, { status: 'approved' });
      setDeliveryApps((prev) =>
        prev.map((p) =>
          p._id === partner._id
            ? { ...p, deliveryStatus: 'approved', role: 'delivery', deliveryApprovedAt: new Date() }
            : p
        )
      );
      setSuccess(`✓ Delivery Partner "${partner.name}" approved successfully! The rider can now log in and access dispatch dashboard.`);
      setTimeout(() => setSuccess(''), 4500);
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Approval failed');
    } finally {
      setActionLoading(null);
    }
  };

  // ==========================================
  // UNIFIED REJECTION MODAL HANDLERS
  // ==========================================
  const openRejectModal = (item, type) => {
    setRejectModalItem({
      id: item._id,
      name: type === 'vendor' ? (item.storeName || item.name) : item.name,
      type,
    });
    setRejectionReason(
      type === 'vendor'
        ? 'Business documentation / GSTIN tax credentials could not be verified.'
        : 'Driving license or vehicle registration details could not be verified.'
    );
  };

  const submitRejection = async () => {
    if (!rejectModalItem) return;

    const { id, name, type } = rejectModalItem;
    setActionLoading(`${type}-${id}`);
    setError('');

    try {
      if (type === 'vendor') {
        await adminService.updateVendorStatus(id, {
          status: 'rejected',
          rejectionReason: rejectionReason.trim(),
        });
        setVendorApps((prev) =>
          prev.map((v) =>
            v._id === id
              ? { ...v, vendorStatus: 'rejected', vendorRejectionReason: rejectionReason.trim() }
              : v
          )
        );
        setSuccess(`Seller store "${name}" application marked as rejected in database.`);
      } else {
        await adminService.updateDeliveryPartnerStatus(id, {
          status: 'rejected',
          rejectionReason: rejectionReason.trim(),
        });
        setDeliveryApps((prev) =>
          prev.map((p) =>
            p._id === id
              ? { ...p, deliveryStatus: 'rejected', deliveryRejectionReason: rejectionReason.trim() }
              : p
          )
        );
        setSuccess(`Delivery Partner "${name}" application marked as rejected in database.`);
      }

      setRejectModalItem(null);
      setTimeout(() => setSuccess(''), 4500);
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Rejection failed');
    } finally {
      setActionLoading(null);
    }
  };

  // Filtering pending vs past records
  const pendingVendors = vendorApps.filter((v) => v.vendorStatus === 'pending');
  const pastVendors = vendorApps.filter((v) => v.vendorStatus !== 'pending');

  const pendingDelivery = deliveryApps.filter((p) => p.deliveryStatus === 'pending');
  const pastDelivery = deliveryApps.filter((p) => p.deliveryStatus !== 'pending');

  const totalPending = pendingVendors.length + pendingDelivery.length;

  // Filter with search query
  const q = searchQuery.toLowerCase().trim();
  const filteredPendingVendors = pendingVendors.filter(
    (v) =>
      !q ||
      v.name?.toLowerCase().includes(q) ||
      v.email?.toLowerCase().includes(q) ||
      v.storeName?.toLowerCase().includes(q) ||
      v.phone?.toLowerCase().includes(q) ||
      v.taxId?.toLowerCase().includes(q)
  );

  const filteredPendingDelivery = pendingDelivery.filter(
    (p) =>
      !q ||
      p.name?.toLowerCase().includes(q) ||
      p.email?.toLowerCase().includes(q) ||
      p.phone?.toLowerCase().includes(q) ||
      p.vehicleNumber?.toLowerCase().includes(q) ||
      p.drivingLicenseNumber?.toLowerCase().includes(q) ||
      p.deliveryCity?.toLowerCase().includes(q)
  );

  const getVehicleIcon = (type) => {
    const t = (type || '').toLowerCase();
    if (t.includes('car') || t.includes('van')) return <Car size={16} />;
    if (t.includes('truck')) return <Truck size={16} />;
    return <Bike size={16} />;
  };

  return (
    <div>
      {/* Page Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1.5rem',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0, color: '#f8fafc' }}>
              Pending Registration Approvals
            </h2>
            {totalPending > 0 && (
              <span
                style={{
                  background: 'rgba(245, 158, 11, 0.2)',
                  color: '#fbbf24',
                  border: '1px solid rgba(245, 158, 11, 0.4)',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  padding: '3px 10px',
                  borderRadius: '999px',
                }}
              >
                {totalPending} Action Required
              </span>
            )}
          </div>
          <p style={{ margin: '0.3rem 0 0', fontSize: '0.86rem', color: '#94a3b8' }}>
            Review, verify credentials, and grant platform access for Delivery Partners and Marketplace Sellers.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span
            style={{
              fontSize: '0.75rem',
              color: '#34d399',
              background: 'rgba(16, 185, 129, 0.1)',
              border: '1px solid rgba(16, 185, 129, 0.25)',
              padding: '5px 12px',
              borderRadius: 20,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <span
              style={{
                width: 7,
                height: 7,
                borderRadius: '50%',
                background: '#10b981',
                animation: 'pulse 1.5s infinite',
              }}
            />
            Live Sync Active (6s)
          </span>

          <button
            className="admin-btn admin-btn-secondary"
            onClick={() => loadAllApplications(false)}
            disabled={loading}
          >
            <RefreshCw size={15} className={loading ? 'spin-icon' : ''} />
            <span>{loading ? 'Refreshing...' : 'Refresh'}</span>
          </button>
        </div>
      </div>

      {/* Notifications */}
      {error && (
        <div
          style={{
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            padding: '0.85rem 1.25rem',
            borderRadius: '10px',
            color: '#f87171',
            marginBottom: '1.25rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}
        >
          <AlertTriangle size={18} />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div
          style={{
            background: 'rgba(16, 185, 129, 0.15)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            padding: '0.85rem 1.25rem',
            borderRadius: '10px',
            color: '#34d399',
            marginBottom: '1.25rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}
        >
          <CheckCircle size={18} />
          <span>{success}</span>
        </div>
      )}

      {/* Navigation Tabs & Search Controls */}
      <div
        className="admin-card"
        style={{
          marginBottom: '1.5rem',
          padding: '1rem 1.25rem',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
        }}
      >
        {/* Tab Buttons */}
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => handleTabSwitch('all')}
            style={{
              padding: '0.55rem 1.1rem',
              borderRadius: '8px',
              border: activeTab === 'all' ? '1px solid #6366f1' : '1px solid rgba(148, 163, 184, 0.15)',
              background: activeTab === 'all' ? '#4f46e5' : 'rgba(255, 255, 255, 0.03)',
              color: activeTab === 'all' ? '#ffffff' : '#94a3b8',
              fontWeight: 600,
              fontSize: '0.84rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              transition: 'all 0.2s',
            }}
          >
            <Layers size={16} />
            <span>All Requests</span>
            <span
              style={{
                background: activeTab === 'all' ? 'rgba(255, 255, 255, 0.25)' : 'rgba(148, 163, 184, 0.2)',
                padding: '1px 7px',
                borderRadius: '999px',
                fontSize: '0.72rem',
                fontWeight: 700,
              }}
            >
              {totalPending}
            </span>
          </button>

          <button
            type="button"
            onClick={() => handleTabSwitch('delivery')}
            style={{
              padding: '0.55rem 1.1rem',
              borderRadius: '8px',
              border: activeTab === 'delivery' ? '1px solid #0284c7' : '1px solid rgba(148, 163, 184, 0.15)',
              background: activeTab === 'delivery' ? '#0284c7' : 'rgba(255, 255, 255, 0.03)',
              color: activeTab === 'delivery' ? '#ffffff' : '#94a3b8',
              fontWeight: 600,
              fontSize: '0.84rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              transition: 'all 0.2s',
            }}
          >
            <Bike size={16} />
            <span>Delivery Requests</span>
            <span
              style={{
                background: activeTab === 'delivery' ? 'rgba(255, 255, 255, 0.25)' : 'rgba(56, 189, 248, 0.2)',
                color: activeTab === 'delivery' ? '#ffffff' : '#38bdf8',
                padding: '1px 7px',
                borderRadius: '999px',
                fontSize: '0.72rem',
                fontWeight: 700,
              }}
            >
              {pendingDelivery.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => handleTabSwitch('seller')}
            style={{
              padding: '0.55rem 1.1rem',
              borderRadius: '8px',
              border: activeTab === 'seller' ? '1px solid #d97706' : '1px solid rgba(148, 163, 184, 0.15)',
              background: activeTab === 'seller' ? '#d97706' : 'rgba(255, 255, 255, 0.03)',
              color: activeTab === 'seller' ? '#ffffff' : '#94a3b8',
              fontWeight: 600,
              fontSize: '0.84rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              transition: 'all 0.2s',
            }}
          >
            <Store size={16} />
            <span>Seller Requests</span>
            <span
              style={{
                background: activeTab === 'seller' ? 'rgba(255, 255, 255, 0.25)' : 'rgba(245, 158, 11, 0.2)',
                color: activeTab === 'seller' ? '#ffffff' : '#fbbf24',
                padding: '1px 7px',
                borderRadius: '999px',
                fontSize: '0.72rem',
                fontWeight: 700,
              }}
            >
              {pendingVendors.length}
            </span>
          </button>
        </div>

        {/* Search input */}
        <div style={{ position: 'relative', minWidth: '240px' }}>
          <Search
            size={16}
            style={{
              position: 'absolute',
              left: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#94a3b8',
            }}
          />
          <input
            type="text"
            placeholder="Search by name, email, phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '0.55rem 0.75rem 0.55rem 2.2rem',
              background: 'rgba(0, 0, 0, 0.3)',
              border: '1px solid rgba(148, 163, 184, 0.2)',
              borderRadius: '8px',
              color: '#f8fafc',
              fontSize: '0.84rem',
              outline: 'none',
            }}
          />
        </div>
      </div>

      {loading && !vendorApps.length && !deliveryApps.length ? (
        <div style={{ textAlign: 'center', padding: '4rem' }}>
          <div className="admin-loading-spinner" />
          <p style={{ color: '#94a3b8', fontSize: '0.88rem', marginTop: '1rem' }}>
            Fetching pending registration requests from database...
          </p>
        </div>
      ) : (
        <>
          {/* ========================================================== */}
          {/* SECTION 1: DELIVERY PARTNER REQUESTS */}
          {/* ========================================================== */}
          {(activeTab === 'all' || activeTab === 'delivery') && (
            <div className="admin-card" style={{ marginBottom: '2rem' }}>
              <div
                className="admin-card-header"
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '0.75rem',
                  borderBottom: '1px solid rgba(148, 163, 184, 0.1)',
                  paddingBottom: '1rem',
                  marginBottom: '1.25rem',
                }}
              >
                <div>
                  <h3
                    className="admin-card-title"
                    style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}
                  >
                    <Bike size={20} color="#38bdf8" />
                    <span>Delivery Partner Requests</span>
                    <span
                      style={{
                        background: 'rgba(56, 189, 248, 0.15)',
                        color: '#38bdf8',
                        border: '1px solid rgba(56, 189, 248, 0.3)',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        padding: '2px 8px',
                        borderRadius: '999px',
                      }}
                    >
                      {pendingDelivery.length} Pending
                    </span>
                  </h3>
                  <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                    Verify rider driving license, vehicle registration, and dispatch city
                  </span>
                </div>

                <Link
                  to="/admin/delivery-partners"
                  style={{
                    color: '#38bdf8',
                    fontSize: '0.8rem',
                    textDecoration: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                  }}
                >
                  <span>View Delivery Fleet</span> <ChevronRight size={14} />
                </Link>
              </div>

              {filteredPendingDelivery.length === 0 ? (
                <div className="admin-empty-state" style={{ padding: '2.5rem 1rem', textAlign: 'center' }}>
                  <CheckCircle size={36} color="#10b981" style={{ margin: '0 auto 0.75rem' }} />
                  <div style={{ fontWeight: 700, color: '#f8fafc', fontSize: '1rem' }}>
                    No Pending Delivery Partner Requests
                  </div>
                  <p style={{ fontSize: '0.82rem', color: '#94a3b8', margin: '0.25rem 0 0' }}>
                    All rider applications have been verified. New registrations will automatically appear here.
                  </p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {filteredPendingDelivery.map((partner) => (
                    <div
                      key={partner._id}
                      style={{
                        background: 'rgba(15, 23, 42, 0.65)',
                        border: '1px solid rgba(56, 189, 248, 0.25)',
                        borderRadius: '12px',
                        padding: '1.25rem',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.9rem',
                      }}
                    >
                      {/* Top Header */}
                      <div
                        style={{
                          display: 'flex',
                          flexWrap: 'wrap',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '1rem',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                          <div
                            style={{
                              width: '46px',
                              height: '46px',
                              borderRadius: '12px',
                              background: 'rgba(56, 189, 248, 0.15)',
                              border: '1px solid rgba(56, 189, 248, 0.3)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: '#38bdf8',
                              flexShrink: 0,
                            }}
                          >
                            <Bike size={22} />
                          </div>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <h4 style={{ margin: 0, color: '#f8fafc', fontSize: '1.05rem', fontWeight: 800 }}>
                                {partner.name}
                              </h4>
                              <span
                                style={{
                                  background: 'rgba(245, 158, 11, 0.15)',
                                  color: '#fbbf24',
                                  border: '1px solid rgba(245, 158, 11, 0.3)',
                                  fontSize: '0.7rem',
                                  fontWeight: 700,
                                  padding: '1px 7px',
                                  borderRadius: '999px',
                                }}
                              >
                                Pending Verification
                              </span>
                            </div>
                            <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: 2 }}>
                              Applied on {new Date(partner.createdAt).toLocaleString()} • City:{' '}
                              <strong style={{ color: '#e2e8f0' }}>{partner.deliveryCity || 'Mumbai'}</strong>
                            </div>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div style={{ display: 'flex', gap: '0.65rem', alignItems: 'center' }}>
                          <button
                            type="button"
                            onClick={() => handleApproveDelivery(partner)}
                            disabled={actionLoading === `delivery-${partner._id}`}
                            className="admin-btn admin-btn-success"
                            style={{ minWidth: 100, display: 'flex', alignItems: 'center', gap: 6 }}
                          >
                            <CheckCircle size={15} />
                            <span>
                              {actionLoading === `delivery-${partner._id}` ? 'Saving...' : 'Approve'}
                            </span>
                          </button>

                          <button
                            type="button"
                            onClick={() => openRejectModal(partner, 'delivery')}
                            disabled={actionLoading === `delivery-${partner._id}`}
                            className="admin-btn admin-btn-danger"
                            style={{ minWidth: 90, display: 'flex', alignItems: 'center', gap: 6 }}
                          >
                            <XCircle size={15} />
                            <span>Reject</span>
                          </button>
                        </div>
                      </div>

                      {/* Detail Grid */}
                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                          gap: '0.75rem',
                          background: 'rgba(0, 0, 0, 0.25)',
                          padding: '0.85rem 1rem',
                          borderRadius: '10px',
                          border: '1px solid rgba(148, 163, 184, 0.1)',
                          fontSize: '0.82rem',
                        }}
                      >
                        <div>
                          <span style={{ color: '#94a3b8', display: 'block', fontSize: '0.7rem', textTransform: 'uppercase' }}>
                            Email Address
                          </span>
                          <span style={{ color: '#f8fafc', wordBreak: 'break-all' }}>{partner.email}</span>
                        </div>

                        <div>
                          <span style={{ color: '#94a3b8', display: 'block', fontSize: '0.7rem', textTransform: 'uppercase' }}>
                            Phone Number
                          </span>
                          <span style={{ color: '#f8fafc' }}>{partner.phone || 'Not provided'}</span>
                        </div>

                        <div>
                          <span style={{ color: '#94a3b8', display: 'block', fontSize: '0.7rem', textTransform: 'uppercase' }}>
                            Vehicle Details
                          </span>
                          <span style={{ color: '#38bdf8', fontWeight: 600, textTransform: 'capitalize', display: 'flex', alignItems: 'center', gap: 4 }}>
                            {getVehicleIcon(partner.vehicleType)}
                            {partner.vehicleType || 'Bike'} ({partner.vehicleNumber || 'No reg number'})
                          </span>
                        </div>

                        <div>
                          <span style={{ color: '#94a3b8', display: 'block', fontSize: '0.7rem', textTransform: 'uppercase' }}>
                            Driving License
                          </span>
                          <span style={{ color: '#f59e0b', fontWeight: 700 }}>
                            {partner.drivingLicenseNumber || 'Pending verification'}
                          </span>
                        </div>

                        <div>
                          <span style={{ color: '#94a3b8', display: 'block', fontSize: '0.7rem', textTransform: 'uppercase' }}>
                            Emergency Contact
                          </span>
                          <span style={{ color: '#cbd5e1' }}>{partner.emergencyContact || 'None specified'}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ========================================================== */}
          {/* SECTION 2: SELLER (VENDOR) REQUESTS */}
          {/* ========================================================== */}
          {(activeTab === 'all' || activeTab === 'seller') && (
            <div className="admin-card" style={{ marginBottom: '2rem' }}>
              <div
                className="admin-card-header"
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '0.75rem',
                  borderBottom: '1px solid rgba(148, 163, 184, 0.1)',
                  paddingBottom: '1rem',
                  marginBottom: '1.25rem',
                }}
              >
                <div>
                  <h3
                    className="admin-card-title"
                    style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}
                  >
                    <Store size={20} color="#f59e0b" />
                    <span>Seller Requests (Vendors)</span>
                    <span
                      style={{
                        background: 'rgba(245, 158, 11, 0.15)',
                        color: '#fbbf24',
                        border: '1px solid rgba(245, 158, 11, 0.3)',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        padding: '2px 8px',
                        borderRadius: '999px',
                      }}
                    >
                      {pendingVendors.length} Pending
                    </span>
                  </h3>
                  <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                    Review merchant business identities, GSTIN / tax IDs, and authorize store catalog access
                  </span>
                </div>

                <Link
                  to="/admin/vendors"
                  style={{
                    color: '#f59e0b',
                    fontSize: '0.8rem',
                    textDecoration: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                  }}
                >
                  <span>View Vendor Directory</span> <ChevronRight size={14} />
                </Link>
              </div>

              {filteredPendingVendors.length === 0 ? (
                <div className="admin-empty-state" style={{ padding: '2.5rem 1rem', textAlign: 'center' }}>
                  <CheckCircle size={36} color="#10b981" style={{ margin: '0 auto 0.75rem' }} />
                  <div style={{ fontWeight: 700, color: '#f8fafc', fontSize: '1rem' }}>
                    No Pending Seller Applications
                  </div>
                  <p style={{ fontSize: '0.82rem', color: '#94a3b8', margin: '0.25rem 0 0' }}>
                    All seller store applications have been verified. New registrations will automatically appear here.
                  </p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {filteredPendingVendors.map((vendor) => (
                    <div
                      key={vendor._id}
                      style={{
                        background: 'rgba(15, 23, 42, 0.65)',
                        border: '1px solid rgba(245, 158, 11, 0.25)',
                        borderRadius: '12px',
                        padding: '1.25rem',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.9rem',
                      }}
                    >
                      {/* Top Header */}
                      <div
                        style={{
                          display: 'flex',
                          flexWrap: 'wrap',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '1rem',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                          <div
                            style={{
                              width: '46px',
                              height: '46px',
                              borderRadius: '12px',
                              background: 'rgba(245, 158, 11, 0.15)',
                              border: '1px solid rgba(245, 158, 11, 0.3)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 800,
                              color: '#f59e0b',
                              fontSize: '1.25rem',
                              flexShrink: 0,
                            }}
                          >
                            {(vendor.storeName || vendor.name || 'S').charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <h4 style={{ margin: 0, color: '#f8fafc', fontSize: '1.05rem', fontWeight: 800 }}>
                                {vendor.storeName || vendor.name}
                              </h4>
                              <span
                                style={{
                                  background: 'rgba(245, 158, 11, 0.15)',
                                  color: '#fbbf24',
                                  border: '1px solid rgba(245, 158, 11, 0.3)',
                                  fontSize: '0.7rem',
                                  fontWeight: 700,
                                  padding: '1px 7px',
                                  borderRadius: '999px',
                                }}
                              >
                                Pending Seller Approval
                              </span>
                            </div>
                            <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: 2 }}>
                              Owner: <strong style={{ color: '#e2e8f0' }}>{vendor.name}</strong> • Applied on{' '}
                              {new Date(vendor.createdAt).toLocaleString()}
                            </div>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div style={{ display: 'flex', gap: '0.65rem', alignItems: 'center' }}>
                          <button
                            type="button"
                            onClick={() => handleApproveVendor(vendor)}
                            disabled={actionLoading === `vendor-${vendor._id}`}
                            className="admin-btn admin-btn-success"
                            style={{ minWidth: 100, display: 'flex', alignItems: 'center', gap: 6 }}
                          >
                            <CheckCircle size={15} />
                            <span>
                              {actionLoading === `vendor-${vendor._id}` ? 'Saving...' : 'Approve'}
                            </span>
                          </button>

                          <button
                            type="button"
                            onClick={() => openRejectModal(vendor, 'vendor')}
                            disabled={actionLoading === `vendor-${vendor._id}`}
                            className="admin-btn admin-btn-danger"
                            style={{ minWidth: 90, display: 'flex', alignItems: 'center', gap: 6 }}
                          >
                            <XCircle size={15} />
                            <span>Reject</span>
                          </button>
                        </div>
                      </div>

                      {/* Detail Grid */}
                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                          gap: '0.75rem',
                          background: 'rgba(0, 0, 0, 0.25)',
                          padding: '0.85rem 1rem',
                          borderRadius: '10px',
                          border: '1px solid rgba(148, 163, 184, 0.1)',
                          fontSize: '0.82rem',
                        }}
                      >
                        <div>
                          <span style={{ color: '#94a3b8', display: 'block', fontSize: '0.7rem', textTransform: 'uppercase' }}>
                            Email Address
                          </span>
                          <span style={{ color: '#f8fafc', wordBreak: 'break-all' }}>{vendor.email}</span>
                        </div>

                        <div>
                          <span style={{ color: '#94a3b8', display: 'block', fontSize: '0.7rem', textTransform: 'uppercase' }}>
                            Phone Number
                          </span>
                          <span style={{ color: '#f8fafc' }}>{vendor.phone || 'Not provided'}</span>
                        </div>

                        <div>
                          <span style={{ color: '#94a3b8', display: 'block', fontSize: '0.7rem', textTransform: 'uppercase' }}>
                            Business Tax ID / GSTIN
                          </span>
                          <span style={{ color: '#fbbf24', fontWeight: 700 }}>{vendor.taxId || 'Not provided'}</span>
                        </div>

                        <div>
                          <span style={{ color: '#94a3b8', display: 'block', fontSize: '0.7rem', textTransform: 'uppercase' }}>
                            Business Address
                          </span>
                          <span style={{ color: '#cbd5e1' }}>{vendor.businessAddress || 'Not specified'}</span>
                        </div>

                        <div>
                          <span style={{ color: '#94a3b8', display: 'block', fontSize: '0.7rem', textTransform: 'uppercase' }}>
                            Payout Method / UPI
                          </span>
                          <span style={{ color: '#38bdf8' }}>
                            {vendor.payoutDetails?.upiId
                              ? `UPI: ${vendor.payoutDetails.upiId}`
                              : vendor.payoutDetails?.bankName
                              ? `${vendor.payoutDetails.bankName} (A/C: ${vendor.payoutDetails.accountNumber})`
                              : 'Pending Setup'}
                          </span>
                        </div>
                      </div>

                      {vendor.storeDescription && (
                        <p style={{ margin: '0.2rem 0 0', fontSize: '0.82rem', color: '#94a3b8', fontStyle: 'italic' }}>
                          "{vendor.storeDescription}"
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ========================================================== */}
          {/* SECTION 3: TOGGLEABLE REVIEWED HISTORY */}
          {/* ========================================================== */}
          <div style={{ marginTop: '1rem', textAlign: 'center' }}>
            <button
              type="button"
              onClick={() => setShowHistory(!showHistory)}
              className="admin-btn admin-btn-secondary"
              style={{ fontSize: '0.84rem' }}
            >
              <Clock size={15} />
              <span>{showHistory ? 'Hide Reviewed History' : 'Show Past Reviewed Applications History'}</span>
            </button>
          </div>

          {showHistory && (
            <div className="admin-card" style={{ marginTop: '1.5rem' }}>
              <h3 className="admin-card-title" style={{ marginBottom: '1rem' }}>
                <Clock size={18} color="#94a3b8" /> Past Processed Applications
              </h3>

              <div className="admin-table-responsive">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Type</th>
                      <th>Applicant / Store</th>
                      <th>Email & Phone</th>
                      <th>Status in DB</th>
                      <th>Action Date</th>
                      <th>Details / Note</th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* Processed Delivery Partners */}
                    {pastDelivery.map((p) => (
                      <tr key={`p-${p._id}`}>
                        <td>
                          <span
                            style={{
                              background: 'rgba(56, 189, 248, 0.15)',
                              color: '#38bdf8',
                              padding: '2px 8px',
                              borderRadius: 4,
                              fontSize: '0.75rem',
                              fontWeight: 700,
                            }}
                          >
                            Delivery
                          </span>
                        </td>
                        <td>
                          <strong>{p.name}</strong>
                          <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                            {p.vehicleType} ({p.vehicleNumber || 'No reg'})
                          </div>
                        </td>
                        <td>
                          <div>{p.email}</div>
                          <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>{p.phone}</div>
                        </td>
                        <td>
                          <span
                            className={`admin-status-badge ${
                              p.deliveryStatus === 'approved' ? 'success' : 'danger'
                            }`}
                          >
                            {p.deliveryStatus}
                          </span>
                        </td>
                        <td>
                          {p.deliveryApprovedAt
                            ? new Date(p.deliveryApprovedAt).toLocaleDateString()
                            : new Date(p.updatedAt || p.createdAt).toLocaleDateString()}
                        </td>
                        <td style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                          {p.deliveryRejectionReason || (p.deliveryStatus === 'approved' ? 'Verified & Activated' : 'N/A')}
                        </td>
                      </tr>
                    ))}

                    {/* Processed Vendors */}
                    {pastVendors.map((v) => (
                      <tr key={`v-${v._id}`}>
                        <td>
                          <span
                            style={{
                              background: 'rgba(245, 158, 11, 0.15)',
                              color: '#fbbf24',
                              padding: '2px 8px',
                              borderRadius: 4,
                              fontSize: '0.75rem',
                              fontWeight: 700,
                            }}
                          >
                            Seller
                          </span>
                        </td>
                        <td>
                          <strong>{v.storeName || v.name}</strong>
                          <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Owner: {v.name}</div>
                        </td>
                        <td>
                          <div>{v.email}</div>
                          <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>{v.phone}</div>
                        </td>
                        <td>
                          <span
                            className={`admin-status-badge ${
                              v.vendorStatus === 'approved' ? 'success' : 'danger'
                            }`}
                          >
                            {v.vendorStatus}
                          </span>
                        </td>
                        <td>
                          {v.vendorApprovedAt
                            ? new Date(v.vendorApprovedAt).toLocaleDateString()
                            : new Date(v.updatedAt || v.createdAt).toLocaleDateString()}
                        </td>
                        <td style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                          {v.vendorRejectionReason || (v.vendorStatus === 'approved' ? 'Store Active & Verified' : 'N/A')}
                        </td>
                      </tr>
                    ))}

                    {!pastDelivery.length && !pastVendors.length && (
                      <tr>
                        <td colSpan={6} style={{ textAlign: 'center', padding: '1.5rem', color: '#94a3b8' }}>
                          No past processed records found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* ========================================================== */}
      {/* UNIFIED REJECTION MODAL */}
      {/* ========================================================== */}
      {rejectModalItem && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '1rem',
          }}
        >
          <div
            style={{
              background: '#0f172a',
              border: '1px solid rgba(239, 68, 68, 0.4)',
              borderRadius: '16px',
              padding: '1.75rem',
              maxWidth: '500px',
              width: '100%',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '10px',
                  background: 'rgba(239, 68, 68, 0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#f87171',
                }}
              >
                <XCircle size={22} />
              </div>
              <div>
                <h3 style={{ margin: 0, color: '#f8fafc', fontSize: '1.15rem', fontWeight: 800 }}>
                  Reject Application
                </h3>
                <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                  {rejectModalItem.type === 'vendor' ? 'Seller Store' : 'Delivery Partner'}:{' '}
                  <strong style={{ color: '#e2e8f0' }}>{rejectModalItem.name}</strong>
                </span>
              </div>
            </div>

            <p style={{ fontSize: '0.84rem', color: '#cbd5e1', marginBottom: '1rem', lineHeight: 1.5 }}>
              Specify the reason for rejecting this registration request. The applicant will see this notification message:
            </p>

            <textarea
              rows={3}
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Enter explanation for rejection..."
              style={{
                width: '100%',
                padding: '0.75rem',
                borderRadius: '8px',
                background: 'rgba(0, 0, 0, 0.4)',
                border: '1px solid rgba(148, 163, 184, 0.25)',
                color: '#f8fafc',
                fontSize: '0.85rem',
                outline: 'none',
                boxSizing: 'border-box',
                resize: 'vertical',
                marginBottom: '1.25rem',
              }}
            />

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button
                type="button"
                onClick={() => setRejectModalItem(null)}
                className="admin-btn admin-btn-secondary"
                disabled={Boolean(actionLoading)}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={submitRejection}
                className="admin-btn admin-btn-danger"
                disabled={Boolean(actionLoading) || !rejectionReason.trim()}
              >
                {actionLoading ? 'Updating Database...' : 'Confirm Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
