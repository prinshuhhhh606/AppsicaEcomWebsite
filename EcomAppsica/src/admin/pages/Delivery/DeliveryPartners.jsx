import React, { useState, useEffect } from 'react';
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
  UserCheck
} from 'lucide-react';
import { adminService } from '../../../services/adminService';

export default function DeliveryPartners() {
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');

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
    const confirmMsg = `Are you sure you want to change this rider status to "${newStatus}"?`;
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
            Verify rider identity, review vehicle registrations, activate accounts, and track driver availability.
          </p>
        </div>

        <button
          onClick={loadPartners}
          className="admin-btn admin-btn-secondary"
          disabled={loading}
          style={{ minHeight: 38 }}
        >
          <RefreshCw size={16} className={loading ? 'spin-icon' : ''} />
          <span>Sync Fleet</span>
        </button>
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
          <div style={{ fontSize: '0.78rem', color: '#fbbf24' }}>Requires document KYC</div>
        </div>

        <div className="admin-card" style={{ padding: '1.2rem', marginBottom: 0 }}>
          <div style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700 }}>Online Now</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#38bdf8', margin: '4px 0' }}>{onlineCount}</div>
          <div style={{ fontSize: '0.78rem', color: '#38bdf8' }}>Ready on road</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="admin-card" style={{ padding: '1rem 1.25rem', marginBottom: '1.25rem', display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {[
            { key: 'all', label: `All (${partners.length})` },
            { key: 'pending', label: `Pending (${pendingCount})` },
            { key: 'approved', label: `Approved (${approvedCount})` },
            { key: 'suspended', label: 'Suspended' },
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
                  <th style={{ padding: '0.9rem 1rem', fontWeight: 600 }}>Presence</th>
                  <th style={{ padding: '0.9rem 1rem', fontWeight: 600 }}>Approval Status</th>
                  <th style={{ padding: '0.9rem 1rem', fontWeight: 600, textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredPartners.map((p) => {
                  const status = p.deliveryStatus || 'pending';
                  const isApproved = status === 'approved';
                  const isPending = status === 'pending';

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
                        <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'flex-end' }}>
                          {isPending && (
                            <button
                              onClick={() => handleStatusChange(p._id, 'approved')}
                              className="admin-btn admin-btn-success admin-btn-sm"
                              title="Approve Driver KYC"
                            >
                              <CheckCircle size={14} /> Approve
                            </button>
                          )}

                          {isApproved && (
                            <button
                              onClick={() => handleStatusChange(p._id, 'suspended')}
                              className="admin-btn admin-btn-danger admin-btn-sm"
                              title="Suspend Driver"
                            >
                              <XCircle size={14} /> Suspend
                            </button>
                          )}

                          {status === 'suspended' && (
                            <button
                              onClick={() => handleStatusChange(p._id, 'approved')}
                              className="admin-btn admin-btn-primary admin-btn-sm"
                              title="Reactivate Driver"
                            >
                              <CheckCircle size={14} /> Reactivate
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
    </div>
  );
}
