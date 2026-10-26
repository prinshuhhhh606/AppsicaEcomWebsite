import React, { useState, useEffect } from 'react';
import {
  Store,
  Search,
  CheckCircle,
  AlertTriangle,
  Eye,
  DollarSign,
  Package,
  Phone,
  Mail,
  ShieldAlert,
  ShieldCheck,
  X,
  RefreshCw,
} from 'lucide-react';
import { adminService } from '../../../services/adminService';
import { formatPrice } from '../../../utils/formatPrice';

export default function VendorList() {
  const [vendors, setVendors] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedVendor, setSelectedVendor] = useState(null);

  const loadVendors = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await adminService.getVendors();
      if (res?.success) {
        setVendors(res.vendors || []);
      }
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Failed to load vendors');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVendors();
  }, []);

  const handleToggleStatus = async (vendor, newStatus) => {
    const confirmMsg = `Are you sure you want to mark store "${vendor.storeName || vendor.name}" as ${newStatus}?`;
    if (!window.confirm(confirmMsg)) return;

    try {
      await adminService.updateVendorStatus(vendor._id, { status: newStatus });
      setVendors((prev) =>
        prev.map((v) => (v._id === vendor._id ? { ...v, vendorStatus: newStatus } : v))
      );
      setSuccess(`Vendor status updated to "${newStatus}"!`);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Failed to update vendor status');
    }
  };

  const filtered = vendors.filter((v) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      (v.storeName && v.storeName.toLowerCase().includes(q)) ||
      (v.name && v.name.toLowerCase().includes(q)) ||
      (v.email && v.email.toLowerCase().includes(q))
    );
  });

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0, color: '#f8fafc' }}>
            Vendor Store Directory ({vendors.length})
          </h2>
          <p style={{ margin: '0.2rem 0 0', fontSize: '0.85rem', color: '#94a3b8' }}>
            Active marketplace sellers, commission agreements, store profiles, and bank payout configuration.
          </p>
        </div>
        <button className="admin-btn admin-btn-secondary" onClick={loadVendors}>
          <RefreshCw size={15} className={loading ? 'spin-icon' : ''} /> Refresh
        </button>
      </div>

      {error && (
        <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', padding: '0.85rem', borderRadius: '8px', color: '#f87171', marginBottom: '1rem' }}>
          {error}
        </div>
      )}
      {success && (
        <div style={{ background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.3)', padding: '0.85rem', borderRadius: '8px', color: '#34d399', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <CheckCircle size={16} /> {success}
        </div>
      )}

      {/* Filter Bar */}
      <div className="admin-filter-bar">
        <div className="admin-search-box">
          <Search size={16} className="admin-search-icon" />
          <input
            type="text"
            className="admin-search-input"
            placeholder="Search vendors by store name, owner, or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Vendors Table */}
      <div className="admin-table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Store Profile</th>
              <th>Owner & Contact</th>
              <th>Commission</th>
              <th>Bank Account</th>
              <th>Status</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: '3rem' }}>
                  <div className="admin-loading-spinner" />
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
                  No vendor records found.
                </td>
              </tr>
            ) : (
              filtered.map((vendor) => (
                <tr key={vendor._id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'linear-gradient(135deg, #6366f1, #06b6d4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, color: '#fff' }}>
                        {(vendor.storeName || vendor.name || 'V')[0].toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, color: '#f8fafc' }}>{vendor.storeName || vendor.name}</div>
                        <div style={{ fontSize: '0.72rem', color: '#818cf8' }}>GSTIN: {vendor.taxId || 'N/A'}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{vendor.name}</div>
                    <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{vendor.email}</div>
                    {vendor.phone && <div style={{ fontSize: '0.72rem', color: '#64748b' }}>{vendor.phone}</div>}
                  </td>
                  <td>
                    <span className="admin-badge purple" style={{ fontWeight: 700 }}>
                      {vendor.commissionRate || 10}% Fee
                    </span>
                  </td>
                  <td>
                    {vendor.payoutDetails?.bankName ? (
                      <div style={{ fontSize: '0.8rem' }}>
                        <div style={{ fontWeight: 600 }}>{vendor.payoutDetails.bankName}</div>
                        <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                          A/C: ••••{String(vendor.payoutDetails.accountNumber || '').slice(-4)}
                        </div>
                      </div>
                    ) : (
                      <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Not configured</span>
                    )}
                  </td>
                  <td>
                    <span className={`admin-badge ${
                      vendor.vendorStatus === 'approved' ? 'success' :
                      vendor.vendorStatus === 'pending' ? 'warning' : 'danger'
                    }`}>
                      {vendor.vendorStatus}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: '0.4rem' }}>
                      <button
                        className="admin-btn admin-btn-secondary admin-btn-sm"
                        onClick={() => setSelectedVendor(vendor)}
                      >
                        <Eye size={13} /> Details
                      </button>

                      {vendor.vendorStatus === 'approved' ? (
                        <button
                          className="admin-btn admin-btn-danger admin-btn-sm"
                          onClick={() => handleToggleStatus(vendor, 'rejected')}
                          title="Suspend vendor from selling"
                        >
                          Suspend
                        </button>
                      ) : (
                        <button
                          className="admin-btn admin-btn-success admin-btn-sm"
                          onClick={() => handleToggleStatus(vendor, 'approved')}
                          title="Reactivate vendor store"
                        >
                          Approve
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* VENDOR DETAILS MODAL */}
      {selectedVendor && (
        <div className="admin-modal-backdrop" onClick={() => setSelectedVendor(null)}>
          <div className="admin-modal admin-modal-lg" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <Store size={22} color="#6366f1" />
                <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#f8fafc' }}>
                  {selectedVendor.storeName || selectedVendor.name}
                </h3>
              </div>
              <button onClick={() => setSelectedVendor(null)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <div className="admin-modal-body">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.5rem', background: 'rgba(255,255,255,0.02)', padding: '1.25rem', borderRadius: '10px', border: '1px solid var(--ap-border)' }}>
                <div>
                  <div className="admin-stat-label">Store Owner</div>
                  <div style={{ fontWeight: 600 }}>{selectedVendor.name}</div>
                </div>
                <div>
                  <div className="admin-stat-label">Email Address</div>
                  <div style={{ fontWeight: 600 }}>{selectedVendor.email}</div>
                </div>
                <div>
                  <div className="admin-stat-label">Phone Number</div>
                  <div style={{ fontWeight: 600 }}>{selectedVendor.phone || 'N/A'}</div>
                </div>
                <div>
                  <div className="admin-stat-label">GSTIN / Tax ID</div>
                  <div style={{ fontWeight: 600 }}>{selectedVendor.taxId || 'N/A'}</div>
                </div>
                <div>
                  <div className="admin-stat-label">Platform Commission</div>
                  <div style={{ fontWeight: 700, color: '#818cf8' }}>{selectedVendor.commissionRate || 10}%</div>
                </div>
                <div>
                  <div className="admin-stat-label">Store Status</div>
                  <div>
                    <span className={`admin-badge ${selectedVendor.vendorStatus === 'approved' ? 'success' : 'warning'}`}>
                      {selectedVendor.vendorStatus}
                    </span>
                  </div>
                </div>
              </div>

              <h4 style={{ margin: '0 0 0.75rem', fontSize: '0.95rem', color: '#cbd5e1' }}>
                Settlement & Bank Details
              </h4>
              <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--ap-border)' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', fontSize: '0.85rem' }}>
                  <div><strong>Bank Name:</strong> {selectedVendor.payoutDetails?.bankName || 'Not configured'}</div>
                  <div><strong>Account Number:</strong> {selectedVendor.payoutDetails?.accountNumber || 'Not configured'}</div>
                  <div><strong>IFSC Code:</strong> {selectedVendor.payoutDetails?.ifsc || 'Not configured'}</div>
                  <div><strong>Beneficiary Name:</strong> {selectedVendor.payoutDetails?.accountHolderName || selectedVendor.name}</div>
                </div>
              </div>
            </div>

            <div className="admin-modal-footer">
              <button className="admin-btn admin-btn-secondary" onClick={() => setSelectedVendor(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
