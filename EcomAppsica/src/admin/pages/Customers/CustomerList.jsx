import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  CheckCircle,
  AlertTriangle,
  Eye,
  ShieldAlert,
  ShieldCheck,
  ShoppingBag,
  Mail,
  Phone,
  Calendar,
  X,
  RefreshCw,
} from 'lucide-react';
import { adminService } from '../../../services/adminService';
import { formatPrice } from '../../../utils/formatPrice';

export default function CustomerList() {
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Selected customer profile modal
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerOrders, setCustomerOrders] = useState([]);
  const [loadingProfile, setLoadingProfile] = useState(false);

  // Suspend / activate modal
  const [statusModal, setStatusModal] = useState({ open: false, customer: null, isBlocked: false, reason: '' });

  const loadCustomers = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await adminService.getCustomers({ search });
      if (res?.success) {
        setCustomers(res.customers || []);
      }
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Failed to load customers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      loadCustomers();
    }, 300);
    return () => clearTimeout(delayDebounce);
  }, [search]);

  // View Customer Profile & Orders
  const handleViewProfile = async (customer) => {
    setSelectedCustomer(customer);
    setLoadingProfile(true);
    try {
      const res = await adminService.getCustomerById(customer._id);
      if (res?.success) {
        setCustomerOrders(res.orders || []);
      }
    } catch {
      setCustomerOrders([]);
    } finally {
      setLoadingProfile(false);
    }
  };

  // Toggle Suspend / Activate
  const handleSaveStatus = async (e) => {
    e.preventDefault();
    if (!statusModal.customer) return;

    try {
      await adminService.updateCustomerStatus(statusModal.customer._id, {
        isBlocked: statusModal.isBlocked,
        reason: statusModal.reason,
      });

      setCustomers((prev) =>
        prev.map((c) =>
          c._id === statusModal.customer._id ? { ...c, isBlocked: statusModal.isBlocked } : c
        )
      );

      setSuccess(`Customer account ${statusModal.isBlocked ? 'suspended' : 'activated'} successfully!`);
      setStatusModal({ open: false, customer: null, isBlocked: false, reason: '' });
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Failed to update customer status');
      setTimeout(() => setError(''), 4000);
    }
  };

  return (
    <div>
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0, color: '#f8fafc' }}>
            Registered Customers ({customers.length})
          </h2>
          <p style={{ margin: '0.2rem 0 0', fontSize: '0.85rem', color: '#94a3b8' }}>
            Inspect customer profiles, order history, contact data, and security suspension states.
          </p>
        </div>
        <button className="admin-btn admin-btn-secondary" onClick={loadCustomers}>
          <RefreshCw size={15} className={loading ? 'spin-icon' : ''} /> Refresh
        </button>
      </div>

      {/* Alerts */}
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

      {/* Search Bar */}
      <div className="admin-filter-bar">
        <div className="admin-search-box">
          <Search size={16} className="admin-search-icon" />
          <input
            type="text"
            className="admin-search-input"
            placeholder="Search customers by name, email, or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Customers Table */}
      <div className="admin-table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Customer</th>
              <th>Contact Details</th>
              <th>Joined Date</th>
              <th>Orders Placed</th>
              <th>Account Status</th>
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
            ) : customers.length === 0 ? (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
                  No customer records matched your query.
                </td>
              </tr>
            ) : (
              customers.map((cust) => (
                <tr key={cust._id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div className="admin-avatar">
                        {(cust.name || 'U')[0].toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, color: '#f8fafc' }}>{cust.name}</div>
                        <div style={{ fontSize: '0.75rem', color: '#818cf8' }}>ID: {cust._id.slice(-6)}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div style={{ fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#cbd5e1' }}>
                      <Mail size={13} color="#94a3b8" /> {cust.email}
                    </div>
                    {cust.phone && (
                      <div style={{ fontSize: '0.75rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '2px' }}>
                        <Phone size={12} /> {cust.phone}
                      </div>
                    )}
                  </td>
                  <td>
                    <div style={{ fontSize: '0.82rem', color: '#cbd5e1' }}>
                      {new Date(cust.createdAt).toLocaleDateString()}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: '#64748b' }}>
                      {new Date(cust.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </td>
                  <td>
                    <span className="admin-badge info" style={{ fontWeight: 700 }}>
                      <ShoppingBag size={12} /> {cust.orderCount ?? 0} orders
                    </span>
                  </td>
                  <td>
                    {cust.isBlocked ? (
                      <span className="admin-badge danger">
                        <ShieldAlert size={12} /> Suspended
                      </span>
                    ) : (
                      <span className="admin-badge success">
                        <ShieldCheck size={12} /> Active
                      </span>
                    )}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: '0.5rem' }}>
                      <button
                        className="admin-btn admin-btn-secondary admin-btn-sm"
                        onClick={() => handleViewProfile(cust)}
                        title="View Full Profile & Order History"
                      >
                        <Eye size={14} /> Profile
                      </button>

                      {cust.isBlocked ? (
                        <button
                          className="admin-btn admin-btn-success admin-btn-sm"
                          onClick={() => setStatusModal({ open: true, customer: cust, isBlocked: false, reason: 'Reactivated by admin' })}
                        >
                          Activate
                        </button>
                      ) : (
                        <button
                          className="admin-btn admin-btn-danger admin-btn-sm"
                          onClick={() => setStatusModal({ open: true, customer: cust, isBlocked: true, reason: 'Suspended for policy violation' })}
                        >
                          Suspend
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

      {/* CUSTOMER PROFILE DRAWER / MODAL */}
      {selectedCustomer && (
        <div className="admin-modal-backdrop" onClick={() => setSelectedCustomer(null)}>
          <div className="admin-modal admin-modal-lg" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div className="admin-avatar" style={{ width: '40px', height: '40px', fontSize: '1.1rem' }}>
                  {(selectedCustomer.name || 'U')[0].toUpperCase()}
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#f8fafc' }}>{selectedCustomer.name}</h3>
                  <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{selectedCustomer.email}</span>
                </div>
              </div>
              <button
                onClick={() => setSelectedCustomer(null)}
                style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <div className="admin-modal-body">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem', background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '10px', border: '1px solid var(--ap-border)' }}>
                <div>
                  <div className="admin-stat-label">Phone</div>
                  <div style={{ fontWeight: 600 }}>{selectedCustomer.phone || 'Not provided'}</div>
                </div>
                <div>
                  <div className="admin-stat-label">Account Created</div>
                  <div style={{ fontWeight: 600 }}>{new Date(selectedCustomer.createdAt).toLocaleDateString()}</div>
                </div>
                <div>
                  <div className="admin-stat-label">Account Role</div>
                  <div style={{ fontWeight: 600, textTransform: 'capitalize' }}>{selectedCustomer.role}</div>
                </div>
                <div>
                  <div className="admin-stat-label">Account Status</div>
                  <div>
                    {selectedCustomer.isBlocked ? (
                      <span className="admin-badge danger">Suspended</span>
                    ) : (
                      <span className="admin-badge success">Active</span>
                    )}
                  </div>
                </div>
              </div>

              <h4 style={{ margin: '0 0 0.75rem', fontSize: '0.95rem', color: '#cbd5e1' }}>
                Order History ({customerOrders.length})
              </h4>

              {loadingProfile ? (
                <div style={{ textAlign: 'center', padding: '2rem' }}>
                  <div className="admin-loading-spinner" />
                </div>
              ) : customerOrders.length === 0 ? (
                <div className="admin-empty-state" style={{ padding: '1.5rem' }}>
                  This customer has not placed any orders yet.
                </div>
              ) : (
                <div className="admin-table-container">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Order ID</th>
                        <th>Date</th>
                        <th>Total</th>
                        <th>Status</th>
                        <th>Payment</th>
                      </tr>
                    </thead>
                    <tbody>
                      {customerOrders.map((ord) => (
                        <tr key={ord._id}>
                          <td style={{ fontFamily: 'monospace', color: '#818cf8', fontWeight: 600 }}>
                            {ord.orderId}
                          </td>
                          <td>{new Date(ord.createdAt).toLocaleDateString()}</td>
                          <td style={{ fontWeight: 700 }}>{formatPrice(ord.total)}</td>
                          <td>
                            <span className="admin-badge info">{ord.orderStatus}</span>
                          </td>
                          <td>
                            <span className={`admin-badge ${ord.paymentStatus === 'Paid' ? 'success' : 'neutral'}`}>
                              {ord.paymentStatus}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="admin-modal-footer">
              <button className="admin-btn admin-btn-secondary" onClick={() => setSelectedCustomer(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SUSPEND / ACTIVATE CONFIRMATION MODAL */}
      {statusModal.open && (
        <div className="admin-modal-backdrop" onClick={() => setStatusModal({ open: false, customer: null, isBlocked: false, reason: '' })}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <form onSubmit={handleSaveStatus}>
              <div className="admin-modal-header">
                <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#f8fafc' }}>
                  {statusModal.isBlocked ? 'Suspend Customer Account' : 'Reactivate Customer Account'}
                </h3>
                <button
                  type="button"
                  onClick={() => setStatusModal({ open: false, customer: null, isBlocked: false, reason: '' })}
                  style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
                >
                  <X size={20} />
                </button>
              </div>

              <div className="admin-modal-body">
                <p style={{ margin: '0 0 1rem', fontSize: '0.88rem', color: '#cbd5e1' }}>
                  Are you sure you want to {statusModal.isBlocked ? 'suspend' : 'reactivate'} account for{' '}
                  <strong>{statusModal.customer?.name}</strong> ({statusModal.customer?.email})?
                </p>

                <div className="admin-form-group">
                  <label className="admin-form-label">Administrative Reason / Note</label>
                  <textarea
                    className="admin-form-textarea"
                    rows="3"
                    required
                    placeholder="Provide reason for this account status change..."
                    value={statusModal.reason}
                    onChange={(e) => setStatusModal({ ...statusModal, reason: e.target.value })}
                  />
                </div>
              </div>

              <div className="admin-modal-footer">
                <button
                  type="button"
                  className="admin-btn admin-btn-secondary"
                  onClick={() => setStatusModal({ open: false, customer: null, isBlocked: false, reason: '' })}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`admin-btn ${statusModal.isBlocked ? 'admin-btn-danger' : 'admin-btn-success'}`}
                >
                  Confirm {statusModal.isBlocked ? 'Suspension' : 'Activation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
