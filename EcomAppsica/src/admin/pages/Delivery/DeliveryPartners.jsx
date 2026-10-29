import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Bike,
  ShieldCheck,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Search,
  RefreshCw,
  Phone,
  Mail,
  MapPin,
  Clock,
  UserCheck,
  UserPlus,
  Edit3,
  X,
  Lock,
  Layers,
  ArrowRight,
  Package
} from 'lucide-react';
import { adminService } from '../../../services/adminService';

export default function DeliveryPartners() {
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');

  // Add Partner Modal
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [addForm, setAddForm] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    vehicleType: 'bike',
    vehicleNumber: '',
    drivingLicenseNumber: '',
    deliveryCity: 'Mumbai',
    emergencyContact: '',
  });

  // Edit Partner Modal
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    _id: '',
    name: '',
    email: '',
    phone: '',
    password: '',
    vehicleType: 'bike',
    vehicleNumber: '',
    drivingLicenseNumber: '',
    deliveryCity: 'Mumbai',
    emergencyContact: '',
    deliveryStatus: 'approved',
  });

  const [saving, setSaving] = useState(false);
  const [modalError, setModalError] = useState('');

  const loadPartners = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await adminService.getDeliveryPartners();
      if (res?.success) {
        setPartners(res.partners || []);
      }
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Failed to load delivery fleet');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPartners();
  }, []);

  const handleStatusChange = async (partnerId, newStatus) => {
    const actionLabel = newStatus === 'approved' ? 'activate / approve' : newStatus;
    const confirmMsg = `Are you sure you want to ${actionLabel} this delivery partner?`;
    if (!window.confirm(confirmMsg)) return;

    try {
      const res = await adminService.updateDeliveryPartnerStatus(partnerId, newStatus);
      if (res?.success) {
        setSuccess(`Delivery partner status updated to "${newStatus}"!`);
        setPartners((prev) =>
          prev.map((p) => (p._id === partnerId ? { ...p, deliveryStatus: newStatus } : p))
        );
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err) {
      setError(err?.response?.data?.message || 'Status update failed');
      setTimeout(() => setError(''), 4000);
    }
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    setModalError('');

    if (!addForm.name || !addForm.email || !addForm.password || !addForm.phone) {
      setModalError('Please fill in all required fields (Name, Email, Password, Phone).');
      return;
    }

    if (addForm.password.length < 6) {
      setModalError('Password must be at least 6 characters long.');
      return;
    }

    setSaving(true);
    try {
      const res = await adminService.createDeliveryPartner(addForm);
      if (res?.success) {
        setSuccess(`Delivery Partner "${res.partner?.name}" added and activated successfully!`);
        setAddModalOpen(false);
        setAddForm({
          name: '',
          email: '',
          password: '',
          phone: '',
          vehicleType: 'bike',
          vehicleNumber: '',
          drivingLicenseNumber: '',
          deliveryCity: 'Mumbai',
          emergencyContact: '',
        });
        loadPartners();
        setTimeout(() => setSuccess(''), 4000);
      }
    } catch (err) {
      setModalError(err?.response?.data?.message || err?.message || 'Failed to create delivery partner');
    } finally {
      setSaving(false);
    }
  };

  const openEditModal = (p) => {
    setEditForm({
      _id: p._id,
      name: p.name || '',
      email: p.email || '',
      phone: p.phone || '',
      password: '',
      vehicleType: p.vehicleType || 'bike',
      vehicleNumber: p.vehicleNumber || '',
      drivingLicenseNumber: p.drivingLicenseNumber || '',
      deliveryCity: p.deliveryCity || 'Mumbai',
      emergencyContact: p.emergencyContact || '',
      deliveryStatus: p.deliveryStatus || 'approved',
    });
    setModalError('');
    setEditModalOpen(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setModalError('');

    if (!editForm.name || !editForm.email || !editForm.phone) {
      setModalError('Name, email, and phone are required.');
      return;
    }

    setSaving(true);
    try {
      const payload = { ...editForm };
      if (!payload.password) delete payload.password;

      const res = await adminService.updateDeliveryPartner(editForm._id, payload);
      if (res?.success) {
        setSuccess(`Delivery Partner "${editForm.name}" updated successfully!`);
        setEditModalOpen(false);
        loadPartners();
        setTimeout(() => setSuccess(''), 4000);
      }
    } catch (err) {
      setModalError(err?.response?.data?.message || err?.message || 'Failed to update delivery partner');
    } finally {
      setSaving(false);
    }
  };

  const filteredPartners = partners.filter((p) => {
    const matchesStatus = statusFilter === 'all' || p.deliveryStatus === statusFilter;
    const matchesSearch =
      search === '' ||
      p.name?.toLowerCase().includes(search.toLowerCase()) ||
      p.email?.toLowerCase().includes(search.toLowerCase()) ||
      p.vehicleNumber?.toLowerCase().includes(search.toLowerCase()) ||
      p.deliveryCity?.toLowerCase().includes(search.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const totalCount = partners.length;
  const approvedCount = partners.filter((p) => p.deliveryStatus === 'approved').length;
  const pendingCount = partners.filter((p) => p.deliveryStatus === 'pending').length;
  const suspendedCount = partners.filter((p) => p.deliveryStatus === 'suspended').length;
  const onlineCount = partners.filter((p) => p.isOnline).length;

  return (
    <div>
      {/* Title & Stats */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
          marginBottom: '1.5rem',
        }}
      >
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, margin: '0 0 0.25rem', color: '#f8fafc' }}>
            Delivery Fleet Management
          </h2>
          <p style={{ margin: 0, fontSize: '0.85rem', color: '#94a3b8' }}>
            Add and manage delivery personnel, verify vehicle registrations, monitor live availability, and assign parcels.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <Link
            to="/admin/delivery-assignments"
            className="admin-btn admin-btn-secondary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, textDecoration: 'none' }}
          >
            <Package size={16} />
            <span>Dispatch Monitoring</span>
          </Link>

          <button
            onClick={() => {
              setModalError('');
              setAddModalOpen(true);
            }}
            className="admin-btn admin-btn-primary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
          >
            <UserPlus size={16} />
            <span>Add Delivery Partner</span>
          </button>

          <button
            onClick={loadPartners}
            className="admin-btn admin-btn-secondary"
            disabled={loading}
            style={{ minHeight: 38 }}
            title="Refresh fleet list"
          >
            <RefreshCw size={16} className={loading ? 'spin-icon' : ''} />
            <span>Sync</span>
          </button>
        </div>
      </div>

      {error && (
        <div style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 10, padding: '0.85rem', marginBottom: '1rem', color: '#f87171' }}>
          {error}
        </div>
      )}

      {success && (
        <div style={{ background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 10, padding: '0.85rem', marginBottom: '1rem', color: '#34d399' }}>
          {success}
        </div>
      )}

      {/* Fleet Stats Overview */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        <div className="admin-card" style={{ padding: '1.2rem', marginBottom: 0 }}>
          <div style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700 }}>Total Fleet Riders</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#f8fafc', margin: '4px 0' }}>{totalCount}</div>
          <div style={{ fontSize: '0.78rem', color: '#818cf8' }}>Registered partners</div>
        </div>

        <div className="admin-card" style={{ padding: '1.2rem', marginBottom: 0 }}>
          <div style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700 }}>Approved Active</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#34d399', margin: '4px 0' }}>{approvedCount}</div>
          <div style={{ fontSize: '0.78rem', color: '#34d399' }}>Eligible for assignment</div>
        </div>

        <div className="admin-card" style={{ padding: '1.2rem', marginBottom: 0 }}>
          <div style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700 }}>Pending Review</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#fbbf24', margin: '4px 0' }}>{pendingCount}</div>
          <div style={{ fontSize: '0.78rem', color: '#fbbf24' }}>Requires KYC verification</div>
        </div>

        <div className="admin-card" style={{ padding: '1.2rem', marginBottom: 0 }}>
          <div style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700 }}>Online Now</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#38bdf8', margin: '4px 0' }}>{onlineCount}</div>
          <div style={{ fontSize: '0.78rem', color: '#38bdf8' }}>Available on road</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="admin-card" style={{ padding: '1rem 1.25rem', marginBottom: '1.25rem', display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {[
            { key: 'all', label: `All (${partners.length})` },
            { key: 'pending', label: `Pending (${pendingCount})` },
            { key: 'approved', label: `Approved (${approvedCount})` },
            { key: 'suspended', label: `Suspended (${suspendedCount})` },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setStatusFilter(tab.key)}
              style={{
                padding: '0.45rem 0.9rem',
                borderRadius: 8,
                border: 'none',
                background: statusFilter === tab.key ? '#6366f1' : 'rgba(255, 255, 255, 0.05)',
                color: statusFilter === tab.key ? 'white' : '#94a3b8',
                fontSize: '0.82rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div style={{ position: 'relative', width: '100%', maxWidth: 280 }}>
          <Search size={16} style={{ position: 'absolute', left: 10, top: 11, color: '#64748b' }} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search rider name, city, plate…"
            style={{
              width: '100%',
              padding: '0.55rem 0.75rem 0.55rem 2.2rem',
              background: '#0f172a',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: 8,
              color: '#f8fafc',
              fontSize: '0.82rem',
              outline: 'none',
            }}
          />
        </div>
      </div>

      {/* Partners Table */}
      <div className="admin-card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem 0', color: '#94a3b8' }}>
            <RefreshCw size={28} className="spin-icon" style={{ margin: '0 auto 0.5rem' }} />
            <p>Loading delivery fleet records…</p>
          </div>
        ) : filteredPartners.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#94a3b8' }}>
            <Bike size={42} style={{ margin: '0 auto 0.75rem', opacity: 0.4 }} />
            <p style={{ margin: 0 }}>No delivery partners match criteria.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ background: '#0f172a', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', textAlign: 'left', color: '#94a3b8' }}>
                  <th style={{ padding: '0.9rem 1rem', fontWeight: 600 }}>Rider</th>
                  <th style={{ padding: '0.9rem 1rem', fontWeight: 600 }}>Vehicle & License</th>
                  <th style={{ padding: '0.9rem 1rem', fontWeight: 600 }}>City & Contact</th>
                  <th style={{ padding: '0.9rem 1rem', fontWeight: 600 }}>Workload</th>
                  <th style={{ padding: '0.9rem 1rem', fontWeight: 600 }}>Presence</th>
                  <th style={{ padding: '0.9rem 1rem', fontWeight: 600 }}>Status</th>
                  <th style={{ padding: '0.9rem 1rem', fontWeight: 600, textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredPartners.map((p) => {
                  const status = p.deliveryStatus || 'pending';
                  const isApproved = status === 'approved';
                  const isPending = status === 'pending';
                  const isSuspended = status === 'suspended';
                  const activeWorkload = p.activeOrdersCount || 0;

                  return (
                    <tr key={p._id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                      {/* Rider */}
                      <td style={{ padding: '0.9rem 1rem' }}>
                        <div style={{ fontWeight: 700, color: '#f8fafc', fontSize: '0.92rem' }}>
                          {p.name}
                        </div>
                        <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                          {p.email}
                        </div>
                      </td>

                      {/* Vehicle */}
                      <td style={{ padding: '0.9rem 1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#cbd5e1', fontWeight: 600 }}>
                          <Bike size={14} color="#34d399" />
                          <span style={{ textTransform: 'uppercase' }}>{p.vehicleNumber || 'No plate'}</span>
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                          Type: {p.vehicleType || 'bike'} • DL: {p.drivingLicenseNumber || 'N/A'}
                        </div>
                      </td>

                      {/* City & Contact */}
                      <td style={{ padding: '0.9rem 1rem' }}>
                        <div style={{ color: '#cbd5e1' }}>
                          {p.phone || 'No phone'}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 4 }}>
                          <MapPin size={12} /> {p.deliveryCity || 'Mumbai'}
                        </div>
                      </td>

                      {/* Active Workload */}
                      <td style={{ padding: '0.9rem 1rem' }}>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                            padding: '3px 8px',
                            borderRadius: 6,
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            background: activeWorkload > 0 ? 'rgba(56, 189, 248, 0.15)' : 'rgba(148, 163, 184, 0.1)',
                            color: activeWorkload > 0 ? '#38bdf8' : '#94a3b8',
                          }}
                        >
                          <Package size={12} />
                          {activeWorkload} active {activeWorkload === 1 ? 'order' : 'orders'}
                        </span>
                      </td>

                      {/* Presence */}
                      <td style={{ padding: '0.9rem 1rem' }}>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 5,
                            background: p.isOnline ? 'rgba(16, 185, 129, 0.15)' : 'rgba(148, 163, 184, 0.15)',
                            color: p.isOnline ? '#34d399' : '#94a3b8',
                            padding: '2px 8px',
                            borderRadius: 999,
                            fontSize: '0.75rem',
                            fontWeight: 700,
                          }}
                        >
                          <span
                            style={{
                              width: 6,
                              height: 6,
                              borderRadius: '50%',
                              backgroundColor: p.isOnline ? '#10b981' : '#64748b',
                            }}
                          />
                          {p.isOnline ? 'Online' : 'Offline'}
                        </span>
                      </td>

                      {/* Approval Status */}
                      <td style={{ padding: '0.9rem 1rem' }}>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                            padding: '3px 8px',
                            borderRadius: 6,
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            background:
                              status === 'approved'
                                ? 'rgba(16, 185, 129, 0.15)'
                                : status === 'pending'
                                ? 'rgba(245, 158, 11, 0.15)'
                                : 'rgba(239, 68, 68, 0.15)',
                            color:
                              status === 'approved'
                                ? '#34d399'
                                : status === 'pending'
                                ? '#fbbf24'
                                : '#f87171',
                          }}
                        >
                          {status.toUpperCase()}
                        </span>
                      </td>

                      {/* Actions */}
                      <td style={{ padding: '0.9rem 1rem', textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'flex-end', alignItems: 'center' }}>
                          <button
                            onClick={() => openEditModal(p)}
                            className="admin-btn admin-btn-secondary admin-btn-sm"
                            title="Edit Rider Details"
                            style={{ padding: '4px 8px' }}
                          >
                            <Edit3 size={13} /> Edit
                          </button>

                          {isPending && (
                            <button
                              onClick={() => handleStatusChange(p._id, 'approved')}
                              className="admin-btn admin-btn-success admin-btn-sm"
                              title="Approve Driver KYC"
                            >
                              <CheckCircle size={13} /> Approve
                            </button>
                          )}

                          {isApproved && (
                            <button
                              onClick={() => handleStatusChange(p._id, 'suspended')}
                              className="admin-btn admin-btn-danger admin-btn-sm"
                              title="Deactivate / Suspend Driver"
                            >
                              <XCircle size={13} /> Deactivate
                            </button>
                          )}

                          {isSuspended && (
                            <button
                              onClick={() => handleStatusChange(p._id, 'approved')}
                              className="admin-btn admin-btn-success admin-btn-sm"
                              title="Reactivate Driver"
                            >
                              <CheckCircle size={13} /> Activate
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL: ADD DELIVERY PARTNER */}
      {addModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.75)',
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
              border: '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: 16,
              maxWidth: 600,
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '1.25rem 1.5rem',
                borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ background: '#6366f1', padding: 8, borderRadius: 10, color: 'white' }}>
                  <UserPlus size={20} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.15rem', color: '#f8fafc', fontWeight: 800 }}>
                    Add Delivery Partner
                  </h3>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: '#94a3b8' }}>
                    Create and immediately activate a verified delivery rider account.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setAddModalOpen(false)}
                style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} style={{ padding: '1.5rem' }}>
              {modalError && (
                <div
                  style={{
                    background: 'rgba(239, 68, 68, 0.15)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    color: '#f87171',
                    padding: '0.75rem 1rem',
                    borderRadius: 8,
                    marginBottom: '1rem',
                    fontSize: '0.85rem',
                  }}
                >
                  {modalError}
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#cbd5e1', marginBottom: 4 }}>
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ramesh Patel"
                    value={addForm.name}
                    onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
                    style={{ width: '100%', padding: '0.6rem 0.8rem', background: '#1e293b', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: 8, color: '#fff', fontSize: '0.85rem' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#cbd5e1', marginBottom: 4 }}>
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. ramesh.delivery@appsica.com"
                    value={addForm.email}
                    onChange={(e) => setAddForm({ ...addForm, email: e.target.value })}
                    style={{ width: '100%', padding: '0.6rem 0.8rem', background: '#1e293b', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: 8, color: '#fff', fontSize: '0.85rem' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#cbd5e1', marginBottom: 4 }}>
                    Login Password * (Min 6 chars)
                  </label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    placeholder="Create secure password"
                    value={addForm.password}
                    onChange={(e) => setAddForm({ ...addForm, password: e.target.value })}
                    style={{ width: '100%', padding: '0.6rem 0.8rem', background: '#1e293b', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: 8, color: '#fff', fontSize: '0.85rem' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#cbd5e1', marginBottom: 4 }}>
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="e.g. 9820012345"
                    value={addForm.phone}
                    onChange={(e) => setAddForm({ ...addForm, phone: e.target.value })}
                    style={{ width: '100%', padding: '0.6rem 0.8rem', background: '#1e293b', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: 8, color: '#fff', fontSize: '0.85rem' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#cbd5e1', marginBottom: 4 }}>
                    Vehicle Type
                  </label>
                  <select
                    value={addForm.vehicleType}
                    onChange={(e) => setAddForm({ ...addForm, vehicleType: e.target.value })}
                    style={{ width: '100%', padding: '0.6rem 0.8rem', background: '#1e293b', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: 8, color: '#fff', fontSize: '0.85rem' }}
                  >
                    <option value="bike">Motorcycle (Bike)</option>
                    <option value="scooter">Scooter</option>
                    <option value="electric">Electric Bike / EV</option>
                    <option value="van">Delivery Van</option>
                    <option value="car">Car</option>
                    <option value="bicycle">Bicycle</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#cbd5e1', marginBottom: 4 }}>
                    Vehicle Number / Plate
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. MH-02-CD-5678"
                    value={addForm.vehicleNumber}
                    onChange={(e) => setAddForm({ ...addForm, vehicleNumber: e.target.value })}
                    style={{ width: '100%', padding: '0.6rem 0.8rem', background: '#1e293b', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: 8, color: '#fff', fontSize: '0.85rem' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#cbd5e1', marginBottom: 4 }}>
                    Operating City
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Mumbai"
                    value={addForm.deliveryCity}
                    onChange={(e) => setAddForm({ ...addForm, deliveryCity: e.target.value })}
                    style={{ width: '100%', padding: '0.6rem 0.8rem', background: '#1e293b', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: 8, color: '#fff', fontSize: '0.85rem' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#cbd5e1', marginBottom: 4 }}>
                    Driving License (DL) Number
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. MH0220210001234"
                    value={addForm.drivingLicenseNumber}
                    onChange={(e) => setAddForm({ ...addForm, drivingLicenseNumber: e.target.value })}
                    style={{ width: '100%', padding: '0.6rem 0.8rem', background: '#1e293b', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: 8, color: '#fff', fontSize: '0.85rem' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '1.25rem' }}>
                <button
                  type="button"
                  onClick={() => setAddModalOpen(false)}
                  className="admin-btn admin-btn-secondary"
                  disabled={saving}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="admin-btn admin-btn-primary"
                  disabled={saving}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
                >
                  {saving ? (
                    <>
                      <RefreshCw size={14} className="spin-icon" /> Creating Account...
                    </>
                  ) : (
                    <>
                      <UserPlus size={14} /> Add Delivery Partner
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EDIT DELIVERY PARTNER */}
      {editModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.75)',
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
              border: '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: 16,
              maxWidth: 600,
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '1.25rem 1.5rem',
                borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ background: '#3b82f6', padding: 8, borderRadius: 10, color: 'white' }}>
                  <Edit3 size={20} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.15rem', color: '#f8fafc', fontWeight: 800 }}>
                    Edit Delivery Partner
                  </h3>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: '#94a3b8' }}>
                    Update contact details, vehicle info, or reset password.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setEditModalOpen(false)}
                style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} style={{ padding: '1.5rem' }}>
              {modalError && (
                <div
                  style={{
                    background: 'rgba(239, 68, 68, 0.15)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    color: '#f87171',
                    padding: '0.75rem 1rem',
                    borderRadius: 8,
                    marginBottom: '1rem',
                    fontSize: '0.85rem',
                  }}
                >
                  {modalError}
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#cbd5e1', marginBottom: 4 }}>
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    style={{ width: '100%', padding: '0.6rem 0.8rem', background: '#1e293b', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: 8, color: '#fff', fontSize: '0.85rem' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#cbd5e1', marginBottom: 4 }}>
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={editForm.email}
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                    style={{ width: '100%', padding: '0.6rem 0.8rem', background: '#1e293b', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: 8, color: '#fff', fontSize: '0.85rem' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#cbd5e1', marginBottom: 4 }}>
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    required
                    value={editForm.phone}
                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                    style={{ width: '100%', padding: '0.6rem 0.8rem', background: '#1e293b', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: 8, color: '#fff', fontSize: '0.85rem' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#cbd5e1', marginBottom: 4 }}>
                    Operating City
                  </label>
                  <input
                    type="text"
                    value={editForm.deliveryCity}
                    onChange={(e) => setEditForm({ ...editForm, deliveryCity: e.target.value })}
                    style={{ width: '100%', padding: '0.6rem 0.8rem', background: '#1e293b', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: 8, color: '#fff', fontSize: '0.85rem' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#cbd5e1', marginBottom: 4 }}>
                    Vehicle Type
                  </label>
                  <select
                    value={editForm.vehicleType}
                    onChange={(e) => setEditForm({ ...editForm, vehicleType: e.target.value })}
                    style={{ width: '100%', padding: '0.6rem 0.8rem', background: '#1e293b', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: 8, color: '#fff', fontSize: '0.85rem' }}
                  >
                    <option value="bike">Motorcycle (Bike)</option>
                    <option value="scooter">Scooter</option>
                    <option value="electric">Electric Bike / EV</option>
                    <option value="van">Delivery Van</option>
                    <option value="car">Car</option>
                    <option value="bicycle">Bicycle</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#cbd5e1', marginBottom: 4 }}>
                    Vehicle Plate Number
                  </label>
                  <input
                    type="text"
                    value={editForm.vehicleNumber}
                    onChange={(e) => setEditForm({ ...editForm, vehicleNumber: e.target.value })}
                    style={{ width: '100%', padding: '0.6rem 0.8rem', background: '#1e293b', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: 8, color: '#fff', fontSize: '0.85rem' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#cbd5e1', marginBottom: 4 }}>
                    Reset Password (Optional)
                  </label>
                  <input
                    type="password"
                    minLength={6}
                    placeholder="Leave blank to keep current"
                    value={editForm.password}
                    onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
                    style={{ width: '100%', padding: '0.6rem 0.8rem', background: '#1e293b', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: 8, color: '#fff', fontSize: '0.85rem' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#cbd5e1', marginBottom: 4 }}>
                    Account Status
                  </label>
                  <select
                    value={editForm.deliveryStatus}
                    onChange={(e) => setEditForm({ ...editForm, deliveryStatus: e.target.value })}
                    style={{ width: '100%', padding: '0.6rem 0.8rem', background: '#1e293b', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: 8, color: '#fff', fontSize: '0.85rem' }}
                  >
                    <option value="approved">Approved & Active</option>
                    <option value="pending">Pending Review</option>
                    <option value="suspended">Suspended / Deactivated</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '1.25rem' }}>
                <button
                  type="button"
                  onClick={() => setEditModalOpen(false)}
                  className="admin-btn admin-btn-secondary"
                  disabled={saving}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="admin-btn admin-btn-primary"
                  disabled={saving}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
                >
                  {saving ? (
                    <>
                      <RefreshCw size={14} className="spin-icon" /> Saving...
                    </>
                  ) : (
                    <>
                      <Edit3 size={14} /> Update Partner
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
