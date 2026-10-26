import React, { useState, useEffect } from 'react';
import {
  UserCheck,
  Search,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Store,
  Phone,
  Mail,
  FileText,
  Clock,
  ShieldCheck,
  RefreshCw,
  MapPin,
  Info,
} from 'lucide-react';
import { adminService } from '../../../services/adminService';

export default function VendorApplications() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Rejection modal state
  const [rejectingVendor, setRejectingVendor] = useState(null);
  const [rejectionReason, setRejectionReason] = useState(
    'KYC or business documentation did not meet platform guidelines.'
  );

  const loadApplications = async (isBackground = false) => {
    if (!isBackground) setLoading(true);
    setError('');
    try {
      const res = await adminService.getVendors();
      if (res?.success) {
        setApplications(res.vendors || []);
      }
    } catch (err) {
      if (!isBackground) {
        setError(err?.response?.data?.message || err?.message || 'Failed to load seller applications');
      }
    } finally {
      if (!isBackground) setLoading(false);
    }
  };

  // Secure 6-second polling for real-time seller application updates
  useEffect(() => {
    loadApplications(false);
    const pollInterval = setInterval(() => {
      loadApplications(true);
    }, 6000);
    return () => clearInterval(pollInterval);
  }, []);

  const handleApprove = async (vendor) => {
    if (!window.confirm(`Approve seller store application for "${vendor.storeName || vendor.name}"?`)) return;

    try {
      await adminService.updateVendorStatus(vendor._id, { status: 'approved' });
      setApplications((prev) =>
        prev.map((v) => (v._id === vendor._id ? { ...v, vendorStatus: 'approved' } : v))
      );
      setSuccess(`✓ Store "${vendor.storeName || vendor.name}" approved successfully! The seller can now log in and add live products.`);
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Approval failed');
    }
  };

  const openRejectModal = (vendor) => {
    setRejectingVendor(vendor);
    setRejectionReason('Business documentation / GSTIN could not be verified.');
  };

  const submitReject = async () => {
    if (!rejectingVendor) return;

    try {
      await adminService.updateVendorStatus(rejectingVendor._id, {
        status: 'rejected',
        rejectionReason: rejectionReason.trim(),
      });
      setApplications((prev) =>
        prev.map((v) =>
          v._id === rejectingVendor._id
            ? { ...v, vendorStatus: 'rejected', vendorRejectionReason: rejectionReason.trim() }
            : v
        )
      );
      setSuccess(`Store "${rejectingVendor.storeName || rejectingVendor.name}" application rejected.`);
      setRejectingVendor(null);
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Rejection failed');
    }
  };

  const pendingApps = applications.filter((v) => v.vendorStatus === 'pending');
  const pastApps = applications.filter((v) => v.vendorStatus !== 'pending');

  return (
    <div>
      {/* Header */}
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
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0, color: '#f8fafc' }}>
            Seller Approval Requests
          </h2>
          <p style={{ margin: '0.2rem 0 0', fontSize: '0.85rem', color: '#94a3b8' }}>
            Review merchant onboardings, verify business tax IDs, and grant live storefront selling privileges.
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span
            style={{
              fontSize: '0.75rem',
              color: '#34d399',
              background: 'rgba(16, 185, 129, 0.1)',
              border: '1px solid rgba(16, 185, 129, 0.25)',
              padding: '4px 10px',
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
            Live Polling Active (6s)
          </span>
          <button className="admin-btn admin-btn-secondary" onClick={() => loadApplications(false)}>
            <RefreshCw size={15} className={loading ? 'spin-icon' : ''} /> Refresh
          </button>
        </div>
      </div>

      {error && (
        <div
          style={{
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            padding: '0.85rem',
            borderRadius: '8px',
            color: '#f87171',
            marginBottom: '1rem',
          }}
        >
          {error}
        </div>
      )}

      {success && (
        <div
          style={{
            background: 'rgba(16, 185, 129, 0.15)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            padding: '0.85rem',
            borderRadius: '8px',
            color: '#34d399',
            marginBottom: '1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}
        >
          <CheckCircle size={16} /> {success}
        </div>
      )}

      {/* PENDING APPLICATIONS SECTION */}
      <div className="admin-card" style={{ marginBottom: '2rem' }}>
        <div className="admin-card-header">
          <h3 className="admin-card-title">
            <Clock size={18} color="#f59e0b" /> Pending Seller Applications ({pendingApps.length})
          </h3>
          <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
            Requires administrator verification before account activation
          </span>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem' }}>
            <div className="admin-loading-spinner" />
          </div>
        ) : pendingApps.length === 0 ? (
          <div className="admin-empty-state" style={{ padding: '2rem' }}>
            <CheckCircle size={36} color="#10b981" style={{ margin: '0 auto 0.75rem' }} />
            <div style={{ fontWeight: 600, color: '#f8fafc' }}>All Caught Up!</div>
            <p style={{ fontSize: '0.82rem', margin: '0.25rem 0 0' }}>
              There are currently no pending seller applications awaiting review.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {pendingApps.map((vendor) => (
              <div
                key={vendor._id}
                style={{
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid rgba(245, 158, 11, 0.35)',
                  borderRadius: '12px',
                  padding: '1.25rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.9rem',
                }}
              >
                {/* Header Row: Store, Applicant, Actions */}
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
                      }}
                    >
                      {(vendor.storeName || vendor.name)[0].toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#f8fafc' }}>
                        {vendor.storeName || `${vendor.name}'s Store`}
                      </div>
                      <div
                        style={{
                          fontSize: '0.82rem',
                          color: '#94a3b8',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.75rem',
                          marginTop: '3px',
                          flexWrap: 'wrap',
                        }}
                      >
                        <span>Seller: <strong style={{ color: '#e2e8f0' }}>{vendor.name}</strong></span>
                        <span>•</span>
                        <span>
                          <Mail size={12} style={{ display: 'inline', marginRight: '3px', verticalAlign: 'middle' }} />
                          {vendor.email}
                        </span>
                        <span>•</span>
                        <span>
                          <Phone size={12} style={{ display: 'inline', marginRight: '3px', verticalAlign: 'middle' }} />
                          {vendor.phone || 'Phone not provided'}
                        </span>
                        <span>•</span>
                        <span>Applied: <strong>{new Date(vendor.createdAt).toLocaleString()}</strong></span>
                      </div>
                    </div>
                  </div>

                  {/* Accept & Reject Action Buttons */}
                  <div style={{ display: 'flex', gap: '0.6rem' }}>
                    <button
                      className="admin-btn admin-btn-danger"
                      onClick={() => openRejectModal(vendor)}
                      style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600 }}
                    >
                      <XCircle size={16} /> Reject
                    </button>
                    <button
                      className="admin-btn admin-btn-success"
                      onClick={() => handleApprove(vendor)}
                      style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700 }}
                    >
                      <CheckCircle size={16} /> Accept (Approve Account)
                    </button>
                  </div>
                </div>

                {/* Business Details Breakdown */}
                <div
                  style={{
                    background: 'rgba(15, 23, 42, 0.5)',
                    border: '1px solid rgba(148, 163, 184, 0.1)',
                    borderRadius: '8px',
                    padding: '0.75rem 1rem',
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                    gap: '0.75rem',
                    fontSize: '0.8rem',
                  }}
                >
                  <div>
                    <span style={{ color: '#64748b', display: 'block', fontSize: '0.72rem', textTransform: 'uppercase', fontWeight: 600 }}>
                      GSTIN / Tax ID
                    </span>
                    <strong style={{ color: '#e2e8f0' }}>{vendor.taxId || 'Not provided'}</strong>
                  </div>

                  <div>
                    <span style={{ color: '#64748b', display: 'block', fontSize: '0.72rem', textTransform: 'uppercase', fontWeight: 600 }}>
                      Business / Warehouse Address
                    </span>
                    <span style={{ color: '#cbd5e1' }}>
                      <MapPin size={12} style={{ display: 'inline', marginRight: 4, verticalAlign: 'middle', color: '#94a3b8' }} />
                      {vendor.businessAddress || 'Not specified'}
                    </span>
                  </div>

                  <div style={{ gridColumn: 'span 2' }}>
                    <span style={{ color: '#64748b', display: 'block', fontSize: '0.72rem', textTransform: 'uppercase', fontWeight: 600 }}>
                      Store Description
                    </span>
                    <span style={{ color: '#cbd5e1' }}>
                      {vendor.storeDescription || 'No description provided'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* REJECTION REASON MODAL */}
      {rejectingVendor && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(5px)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
          }}
        >
          <div
            style={{
              background: '#0f172a',
              border: '1px solid rgba(239, 68, 68, 0.35)',
              borderRadius: '16px',
              padding: '1.75rem',
              maxWidth: '520px',
              width: '100%',
              boxShadow: '0 25px 50px rgba(0, 0, 0, 0.6)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: '1rem' }}>
              <div
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 10,
                  background: 'rgba(239, 68, 68, 0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ef4444',
                }}
              >
                <XCircle size={22} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.15rem', color: '#f8fafc' }}>
                  Reject Seller Application
                </h3>
                <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                  Store: <strong>{rejectingVendor.storeName || rejectingVendor.name}</strong> ({rejectingVendor.email})
                </span>
              </div>
            </div>

            <p style={{ fontSize: '0.85rem', color: '#cbd5e1', marginBottom: '1rem' }}>
              Please provide the reason for rejection. This reason will be stored in the database and shown to the applicant:
            </p>

            <textarea
              rows={3}
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="e.g. GSTIN mismatch or invalid business documentation"
              style={{
                width: '100%',
                padding: '0.75rem',
                borderRadius: '8px',
                background: '#020617',
                border: '1px solid rgba(148, 163, 184, 0.25)',
                color: '#fff',
                fontSize: '0.85rem',
                outline: 'none',
                boxSizing: 'border-box',
                marginBottom: '1rem',
                fontFamily: 'inherit',
              }}
            />

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button
                type="button"
                className="admin-btn admin-btn-secondary"
                onClick={() => setRejectingVendor(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="admin-btn admin-btn-danger"
                onClick={submitReject}
                style={{ fontWeight: 700 }}
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ALL VERIFIED SELLERS TABLE */}
      <div className="admin-card">
        <div className="admin-card-header">
          <h3 className="admin-card-title">
            <ShieldCheck size={18} color="#10b981" /> Historical Merchant Decisions ({pastApps.length})
          </h3>
        </div>

        <div className="admin-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Store & Owner</th>
                <th>Contact</th>
                <th>Tax / GSTIN</th>
                <th>Status</th>
                <th>Decision / Rejection Reason</th>
                <th>Decision Date</th>
              </tr>
            </thead>
            <tbody>
              {pastApps.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '2rem' }}>
                    No past records
                  </td>
                </tr>
              ) : (
                pastApps.map((v) => (
                  <tr key={v._id}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{v.storeName || v.name}</div>
                      <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{v.name}</div>
                    </td>
                    <td>
                      <div style={{ fontSize: '0.8rem' }}>{v.email}</div>
                      <div style={{ fontSize: '0.72rem', color: '#64748b' }}>{v.phone || 'No phone'}</div>
                    </td>
                    <td>{v.taxId || 'N/A'}</td>
                    <td>
                      <span className={`admin-badge ${v.vendorStatus === 'approved' ? 'success' : 'danger'}`}>
                        {v.vendorStatus}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.8rem', color: v.vendorStatus === 'rejected' ? '#fca5a5' : '#94a3b8', maxWidth: '240px' }}>
                      {v.vendorStatus === 'rejected'
                        ? (v.vendorRejectionReason || 'Verification criteria not met')
                        : 'Approved & Activated'}
                    </td>
                    <td style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                      {new Date(v.vendorApprovedAt || v.updatedAt || v.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
