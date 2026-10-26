import React, { useState, useEffect } from 'react';
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
} from 'lucide-react';
import { adminService } from '../../../services/adminService';
import { formatPrice } from '../../../utils/formatPrice';

export default function ShippingManagement() {
  const [zones, setZones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Modal
  const [modal, setModal] = useState({ open: false, mode: 'create', data: null });
  const [form, setForm] = useState({
    name: '',
    rate: 0,
    freeShippingThreshold: 999,
    estimatedDays: '3-5 business days',
    isActive: true,
  });

  const loadZones = async () => {
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
  };

  useEffect(() => {
    loadZones();
  }, []);

  const handleOpenModal = (mode = 'create', zone = null) => {
    if (mode === 'edit' && zone) {
      setForm({
        name: zone.name || '',
        rate: zone.rate || 0,
        freeShippingThreshold: zone.freeShippingThreshold !== undefined ? zone.freeShippingThreshold : 999,
        estimatedDays: zone.estimatedDays || '3-5 business days',
        isActive: zone.isActive !== undefined ? zone.isActive : true,
      });
      setModal({ open: true, mode: 'edit', data: zone });
    } else {
      setForm({
        name: '',
        rate: 99,
        freeShippingThreshold: 999,
        estimatedDays: '2-4 business days',
        isActive: true,
      });
      setModal({ open: true, mode: 'create', data: null });
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        name: form.name,
        rate: Number(form.rate),
        freeShippingThreshold: Number(form.freeShippingThreshold),
        estimatedDays: form.estimatedDays,
        isActive: form.isActive,
      };

      if (modal.mode === 'edit' && modal.data) {
        const res = await adminService.updateShipping(modal.data._id, payload);
        const updated = res?.zone || res;
        setZones((prev) => prev.map((z) => (z._id === updated._id ? updated : z)));
        setSuccess(`Shipping zone "${payload.name}" updated!`);
      } else {
        const res = await adminService.createShippingZone(payload);
        const created = res?.zone || res;
        setZones((prev) => [...prev, created]);
        setSuccess(`Shipping zone "${payload.name}" created!`);
      }

      setModal({ open: false, mode: 'create', data: null });
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Failed to save shipping zone');
    }
  };

  const handleDelete = async (zone) => {
    if (!window.confirm(`Delete shipping zone "${zone.name}"?`)) return;

    try {
      await adminService.deleteShippingZone(zone._id);
      setZones((prev) => prev.filter((z) => z._id !== zone._id));
      setSuccess(`Shipping zone "${zone.name}" deleted.`);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Delete failed');
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0, color: '#f8fafc' }}>
            Shipping Zones & Logistics Configuration ({zones.length})
          </h2>
          <p style={{ margin: '0.2rem 0 0', fontSize: '0.85rem', color: '#94a3b8' }}>
            Configure zonal delivery pricing, free shipping cart thresholds, and estimated transit days.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="admin-btn admin-btn-secondary" onClick={loadZones}>
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

      {/* Zones Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.25rem' }}>
        {loading ? (
          <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3rem' }}>
            <div className="admin-loading-spinner" />
          </div>
        ) : zones.length === 0 ? (
          <div className="admin-empty-state" style={{ gridColumn: '1 / -1' }}>
            No shipping zones created yet.
          </div>
        ) : (
          zones.map((zone) => (
            <div key={zone._id} className="admin-card" style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <div style={{ width: '38px', height: '38px', borderRadius: '8px', background: 'rgba(6, 182, 212, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#06b6d4' }}>
                    <Truck size={20} />
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.05rem', color: '#f8fafc', fontWeight: 700 }}>
                      {zone.name}
                    </h3>
                    <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                      {zone.estimatedDays || 'Standard delivery'}
                    </span>
                  </div>
                </div>
                <span className={`admin-badge ${zone.isActive ? 'success' : 'neutral'}`}>
                  {zone.isActive ? 'Active' : 'Disabled'}
                </span>
              </div>

              <div style={{ background: 'rgba(255,255,255,0.02)', padding: '0.85rem 1rem', borderRadius: '8px', border: '1px solid var(--ap-border)', margin: '0.5rem 0 1rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', fontSize: '0.85rem' }}>
                <div>
                  <div className="admin-stat-label">Shipping Rate</div>
                  <div style={{ fontWeight: 800, fontSize: '1.1rem', color: zone.rate === 0 ? '#34d399' : '#f8fafc' }}>
                    {zone.rate === 0 ? 'FREE' : formatPrice(zone.rate)}
                  </div>
                </div>
                <div>
                  <div className="admin-stat-label">Free Above</div>
                  <div style={{ fontWeight: 700, color: '#818cf8' }}>
                    {formatPrice(zone.freeShippingThreshold || 999)}
                  </div>
                </div>
              </div>

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
                <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#f8fafc' }}>
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
                    placeholder="e.g. 3-5 business days"
                    value={form.estimatedDays}
                    onChange={(e) => setForm({ ...form, estimatedDays: e.target.value })}
                  />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
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
