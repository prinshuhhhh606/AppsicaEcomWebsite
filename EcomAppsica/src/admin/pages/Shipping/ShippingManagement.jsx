import React, { useState, useEffect, useCallback } from 'react';
import {
  Truck,
  Plus,
  Edit,
  Trash2,
  CheckCircle,
  AlertTriangle,
  MapPin,
  Clock,
  DollarSign,
  X,
  RefreshCw,
  Search,
  Check,
  Shield,
  Layers,
} from 'lucide-react';
import { adminService } from '../../../services/adminService';
import { formatPrice } from '../../../utils/formatPrice';

export default function ShippingManagement() {
  const [zones, setZones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [search, setSearch] = useState('');

  // Modal
  const [modal, setModal] = useState({ open: false, mode: 'create', data: null });
  const [form, setForm] = useState({
    name: '',
    rate: 0,
    freeShippingThreshold: 999,
    estimatedDays: '3-5 business days',
    statesText: '',
    pincodesText: '',
    isActive: true,
  });

  const loadZones = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await adminService.getShippingZones();
      setZones(res?.zones || (Array.isArray(res) ? res : []));
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Failed to load shipping zones');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    adminService
      .getShippingZones()
      .then((res) => {
        if (!active) return;
        setZones(res?.zones || (Array.isArray(res) ? res : []));
      })
      .catch((err) => {
        if (!active) return;
        setError(err?.response?.data?.message || err?.message || 'Failed to load shipping zones');
      })
      .finally(() => {
        if (!active) return;
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const handleOpenModal = (mode = 'create', zone = null) => {
    if (mode === 'edit' && zone) {
      setForm({
        name: zone.name || '',
        rate: zone.rate !== undefined ? zone.rate : 0,
        freeShippingThreshold: zone.freeShippingThreshold !== undefined ? zone.freeShippingThreshold : 999,
        estimatedDays: zone.estimatedDays || '3-5 business days',
        statesText: Array.isArray(zone.states) ? zone.states.join(', ') : '',
        pincodesText: Array.isArray(zone.pincodes) ? zone.pincodes.join(', ') : '',
        isActive: zone.isActive !== undefined ? zone.isActive : true,
      });
      setModal({ open: true, mode: 'edit', data: zone });
    } else {
      setForm({
        name: '',
        rate: 79,
        freeShippingThreshold: 999,
        estimatedDays: '2-4 business days',
        statesText: '',
        pincodesText: '',
        isActive: true,
      });
      setModal({ open: true, mode: 'create', data: null });
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const states = form.statesText
        ? form.statesText
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean)
        : [];

      const pincodes = form.pincodesText
        ? form.pincodesText
            .split(',')
            .map((p) => p.trim())
            .filter(Boolean)
        : [];

      const payload = {
        name: form.name.trim(),
        rate: Number(form.rate),
        freeShippingThreshold: Number(form.freeShippingThreshold),
        estimatedDays: form.estimatedDays.trim() || '3-5 business days',
        states,
        pincodes,
        isActive: !!form.isActive,
      };

      if (modal.mode === 'edit' && modal.data) {
        const res = await adminService.updateShipping(modal.data._id, payload);
        const updated = res?.zone || res;
        setZones((prev) => prev.map((z) => (z._id === updated._id ? updated : z)));
        setSuccess(`Shipping zone "${payload.name}" updated successfully!`);
      } else {
        const res = await adminService.createShippingZone(payload);
        const created = res?.zone || res;
        setZones((prev) => [...prev, created]);
        setSuccess(`Shipping zone "${payload.name}" created successfully!`);
      }

      setModal({ open: false, mode: 'create', data: null });
      setTimeout(() => setSuccess(''), 3500);
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Failed to save shipping zone');
    }
  };

  const handleToggleActive = async (zone) => {
    try {
      const nextState = !zone.isActive;
      const res = await adminService.updateShipping(zone._id, { isActive: nextState });
      const updated = res?.zone || { ...zone, isActive: nextState };
      setZones((prev) => prev.map((z) => (z._id === zone._id ? updated : z)));
      setSuccess(`Zone "${zone.name}" marked as ${nextState ? 'Active' : 'Disabled'}.`);
      setTimeout(() => setSuccess(''), 2500);
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Failed to update zone status');
    }
  };

  const handleDelete = async (zone) => {
    if (!window.confirm(`Delete shipping zone "${zone.name}" permanently?`)) return;

    try {
      await adminService.deleteShippingZone(zone._id);
      setZones((prev) => prev.filter((z) => z._id !== zone._id));
      setSuccess(`Shipping zone "${zone.name}" deleted successfully.`);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Delete failed');
    }
  };

  const filteredZones = zones.filter((z) => {
    if (!search) return true;
    const q = search.toLowerCase();
    const matchName = z.name?.toLowerCase().includes(q);
    const matchStates = Array.isArray(z.states) && z.states.some((st) => st.toLowerCase().includes(q));
    const matchPincodes = Array.isArray(z.pincodes) && z.pincodes.some((pin) => pin.includes(q));
    return matchName || matchStates || matchPincodes;
  });

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0, color: '#063b2c' }}>
            Shipping Zones & Logistics Configuration ({zones.length})
          </h2>
          <p style={{ margin: '0.2rem 0 0', fontSize: '0.85rem', color: '#000000' }}>
            Configure zonal delivery pricing, regional states/pincodes coverage, free shipping cart thresholds, and estimated transit times.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button className="admin-btn admin-btn-secondary" onClick={loadZones} disabled={loading}>
            <RefreshCw size={15} className={loading ? 'spin-icon' : ''} /> Refresh
          </button>
          <button className="admin-btn admin-btn-primary" onClick={() => handleOpenModal('create')}>
            <Plus size={16} /> Add Shipping Zone
          </button>
        </div>
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

      {/* Search / Filter bar */}
      <div className="admin-filter-bar">
        <div className="admin-search-box">
          <Search size={16} className="admin-search-icon" />
          <input
            type="text"
            className="admin-search-input"
            placeholder="Search zones by name, state, or pincode..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Zones Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.25rem' }}>
        {loading ? (
          <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3rem' }}>
            <div className="admin-loading-spinner" />
          </div>
        ) : filteredZones.length === 0 ? (
          <div className="admin-empty-state" style={{ gridColumn: '1 / -1' }}>
            {search ? 'No shipping zones matching your search.' : 'No shipping zones created yet. Click "Add Shipping Zone" to begin.'}
          </div>
        ) : (
          filteredZones.map((zone) => (
            <div key={zone._id} className="admin-card" style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(6, 182, 212, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#06b6d4', flexShrink: 0 }}>
                    <Truck size={20} />
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.05rem', color: '#063b2c', fontWeight: 800 }}>
                      {zone.name}
                    </h3>
                    <span style={{ fontSize: '0.75rem', color: '#000000', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px', fontWeight: 500 }}>
                      <Clock size={12} color="#063b2c" /> {zone.estimatedDays || 'Standard 3-5 business days'}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleToggleActive(zone)}
                  className={`admin-badge ${zone.isActive ? 'success' : 'neutral'}`}
                  style={{ cursor: 'pointer', border: 'none', background: zone.isActive ? 'rgba(16, 185, 129, 0.15)' : '#f3f4f6', color: zone.isActive ? '#065f46' : '#000000' }}
                  title="Click to toggle active status"
                >
                  {zone.isActive ? 'Active' : 'Disabled'}
                </button>
              </div>

              {/* Rate & Free Shipping Card */}
              <div style={{ background: '#f8f9f6', padding: '0.85rem 1rem', borderRadius: '8px', border: '1px solid var(--ap-border)', margin: '0.35rem 0 0.85rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', fontSize: '0.85rem' }}>
                <div>
                  <div className="admin-stat-label" style={{ color: '#000000', fontWeight: 600 }}>Shipping Rate</div>
                  <div style={{ fontWeight: 800, fontSize: '1.15rem', color: zone.rate === 0 ? '#059669' : '#000000' }}>
                    {zone.rate === 0 ? 'FREE' : formatPrice(zone.rate)}
                  </div>
                </div>
                <div>
                  <div className="admin-stat-label" style={{ color: '#000000', fontWeight: 600 }}>Free Delivery Above</div>
                  <div style={{ fontWeight: 800, color: '#063b2c', fontSize: '1.05rem' }}>
                    {formatPrice(zone.freeShippingThreshold || 999)}
                  </div>
                </div>
              </div>

              {/* Regional Coverage details */}
              <div style={{ marginBottom: '1rem', flex: 1 }}>
                <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.35rem', fontWeight: 600 }}>
                  Regional Coverage:
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                  {zone.states && zone.states.length > 0 ? (
                    zone.states.slice(0, 4).map((st, i) => (
                      <span key={i} style={{ fontSize: '0.7rem', background: 'rgba(99, 102, 241, 0.12)', color: '#a5b4fc', padding: '0.15rem 0.45rem', borderRadius: '4px', border: '1px solid rgba(99, 102, 241, 0.25)' }}>
                        {st}
                      </span>
                    ))
                  ) : (
                    <span style={{ fontSize: '0.72rem', color: '#64748b' }}>All States (Pan-India)</span>
                  )}
                  {zone.states && zone.states.length > 4 && (
                    <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>+{zone.states.length - 4} more</span>
                  )}
                </div>

                {zone.pincodes && zone.pincodes.length > 0 && (
                  <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '0.35rem' }}>
                    Specific pincodes configured: {zone.pincodes.length} pincodes
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: 'auto', paddingTop: '0.75rem', borderTop: '1px solid var(--ap-border-subtle)' }}>
                <button className="admin-btn admin-btn-secondary admin-btn-sm" onClick={() => handleOpenModal('edit', zone)}>
                  <Edit size={13} /> Edit
                </button>
                <button className="admin-btn admin-btn-danger admin-btn-sm" onClick={() => handleDelete(zone)}>
                  <Trash2 size={13} /> Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* CREATE / EDIT SHIPPING MODAL */}
      {modal.open && (
        <div className="admin-modal-backdrop" onClick={() => setModal({ open: false, mode: 'create', data: null })}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <form onSubmit={handleSave}>
              <div className="admin-modal-header">
                <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#063b2c', fontWeight: 800 }}>
                  {modal.mode === 'edit' ? 'Edit Shipping Zone' : 'Create Shipping Zone'}
                </h3>
                <button type="button" onClick={() => setModal({ open: false, mode: 'create', data: null })} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
                  <X size={20} />
                </button>
              </div>

              <div className="admin-modal-body">
                <div className="admin-form-group">
                  <label className="admin-form-label">Zone Name *</label>
                  <input
                    type="text"
                    className="admin-form-input"
                    required
                    placeholder="e.g. Standard Pan-India Courier"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="admin-form-group">
                    <label className="admin-form-label">Delivery Fee (₹) *</label>
                    <input
                      type="number"
                      className="admin-form-input"
                      required
                      min="0"
                      value={form.rate}
                      onChange={(e) => setForm({ ...form, rate: e.target.value })}
                    />
                  </div>

                  <div className="admin-form-group">
                    <label className="admin-form-label">Free Shipping Cart Threshold (₹)</label>
                    <input
                      type="number"
                      className="admin-form-input"
                      required
                      min="0"
                      value={form.freeShippingThreshold}
                      onChange={(e) => setForm({ ...form, freeShippingThreshold: e.target.value })}
                    />
                  </div>
                </div>

                <div className="admin-form-group">
                  <label className="admin-form-label">Estimated Transit Days</label>
                  <input
                    type="text"
                    className="admin-form-input"
                    placeholder="e.g. 2-4 business days"
                    value={form.estimatedDays}
                    onChange={(e) => setForm({ ...form, estimatedDays: e.target.value })}
                  />
                </div>

                <div className="admin-form-group">
                  <label className="admin-form-label">Covered States (Optional - Comma separated)</label>
                  <input
                    type="text"
                    className="admin-form-input"
                    placeholder="e.g. Maharashtra, Delhi, Karnataka, Gujarat (Leave empty for all)"
                    value={form.statesText}
                    onChange={(e) => setForm({ ...form, statesText: e.target.value })}
                  />
                  <small style={{ color: '#94a3b8', fontSize: '0.72rem' }}>Leave blank to apply to all nationwide addresses</small>
                </div>

                <div className="admin-form-group">
                  <label className="admin-form-label">Specific Pincodes (Optional - Comma separated)</label>
                  <input
                    type="text"
                    className="admin-form-input"
                    placeholder="e.g. 400001, 110001, 560001"
                    value={form.pincodesText}
                    onChange={(e) => setForm({ ...form, pincodesText: e.target.value })}
                  />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.75rem' }}>
                  <input
                    type="checkbox"
                    id="zoneActive"
                    checked={form.isActive}
                    onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                  />
                  <label htmlFor="zoneActive" style={{ fontSize: '0.85rem', color: '#cbd5e1', cursor: 'pointer' }}>
                    Zone is enabled for checkout address calculation
                  </label>
                </div>
              </div>

              <div className="admin-modal-footer">
                <button type="button" className="admin-btn admin-btn-secondary" onClick={() => setModal({ open: false, mode: 'create', data: null })}>
                  Cancel
                </button>
                <button type="submit" className="admin-btn admin-btn-primary">
                  {modal.mode === 'edit' ? 'Update Zone' : 'Create Zone'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
