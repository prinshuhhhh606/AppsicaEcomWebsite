import React, { useState, useEffect } from 'react';
import {
  Ticket,
  Plus,
  Edit,
  Trash2,
  CheckCircle,
  AlertTriangle,
  Calendar,
  Percent,
  DollarSign,
  X,
  RefreshCw,
} from 'lucide-react';
import { adminService } from '../../../services/adminService';
import { formatPrice } from '../../../utils/formatPrice';

export default function CouponManagement() {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Modal
  const [modal, setModal] = useState({ open: false, mode: 'create', data: null });
  const [form, setForm] = useState({
    code: '',
    discountType: 'percent',
    discountValue: 10,
    minOrderAmount: 499,
    maxDiscount: 1000,
    expiryDate: '',
    usageLimit: 500,
    isActive: true,
  });

  const loadCoupons = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await adminService.getCoupons();
      setCoupons(res?.coupons || (Array.isArray(res) ? res : []));
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Failed to load coupons');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCoupons();
  }, []);

  const handleOpenModal = (mode = 'create', coupon = null) => {
    if (mode === 'edit' && coupon) {
      setForm({
        code: coupon.code || '',
        discountType: coupon.discountType || 'percent',
        discountValue: coupon.discountValue || 10,
        minOrderAmount: coupon.minOrderAmount || 0,
        maxDiscount: coupon.maxDiscount || '',
        expiryDate: coupon.expiryDate ? new Date(coupon.expiryDate).toISOString().slice(0, 10) : '',
        usageLimit: coupon.usageLimit || 1000,
        isActive: coupon.isActive !== undefined ? coupon.isActive : true,
      });
      setModal({ open: true, mode: 'edit', data: coupon });
    } else {
      setForm({
        code: '',
        discountType: 'percent',
        discountValue: 15,
        minOrderAmount: 999,
        maxDiscount: 500,
        expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
        usageLimit: 500,
        isActive: true,
      });
      setModal({ open: true, mode: 'create', data: null });
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        code: form.code.toUpperCase().trim(),
        discountType: form.discountType,
        discountValue: Number(form.discountValue),
        minOrderAmount: Number(form.minOrderAmount),
        maxDiscount: form.maxDiscount ? Number(form.maxDiscount) : null,
        expiryDate: form.expiryDate || null,
        usageLimit: Number(form.usageLimit),
        isActive: form.isActive,
      };

      if (modal.mode === 'edit' && modal.data) {
        const res = await adminService.updateCoupon(modal.data._id, payload);
        const updated = res?.coupon || res;
        setCoupons((prev) => prev.map((c) => (c._id === updated._id ? updated : c)));
        setSuccess(`Coupon "${payload.code}" updated!`);
      } else {
        const res = await adminService.createCoupon(payload);
        const created = res?.coupon || res;
        setCoupons((prev) => [created, ...prev]);
        setSuccess(`Coupon "${payload.code}" created!`);
      }

      setModal({ open: false, mode: 'create', data: null });
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Failed to save coupon');
    }
  };

  const handleDelete = async (coupon) => {
    if (!window.confirm(`Delete coupon promo code "${coupon.code}"?`)) return;

    try {
      await adminService.deleteCoupon(coupon._id);
      setCoupons((prev) => prev.filter((c) => c._id !== coupon._id));
      setSuccess(`Coupon "${coupon.code}" deleted.`);
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
            Coupons & Promotional Discount Codes ({coupons.length})
          </h2>
          <p style={{ margin: '0.2rem 0 0', fontSize: '0.85rem', color: '#94a3b8' }}>
            Manage storefront cart promo vouchers, discount caps, usage thresholds, and expiry schedules.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="admin-btn admin-btn-secondary" onClick={loadCoupons}>
            <RefreshCw size={15} className={loading ? 'spin-icon' : ''} /> Refresh
          </button>
          <button className="admin-btn admin-btn-primary" onClick={() => handleOpenModal('create')}>
            <Plus size={16} /> Create Coupon
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

      {/* Table */}
      <div className="admin-table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Promo Code</th>
              <th>Discount Value</th>
              <th>Min Order Requirement</th>
              <th>Max Discount Cap</th>
              <th>Usage Limit</th>
              <th>Expiry Date</th>
              <th>Status</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="8" style={{ textAlign: 'center', padding: '3rem' }}>
                  <div className="admin-loading-spinner" />
                </td>
              </tr>
            ) : coupons.length === 0 ? (
              <tr>
                <td colSpan="8" style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
                  No coupon codes created yet. Click "Create Coupon" to launch a campaign.
                </td>
              </tr>
            ) : (
              coupons.map((coupon) => {
                const isExpired = coupon.expiryDate && new Date(coupon.expiryDate) < new Date();
                return (
                  <tr key={coupon._id}>
                    <td>
                      <div style={{ fontFamily: 'monospace', fontWeight: 800, fontSize: '0.95rem', color: '#818cf8', letterSpacing: '1px' }}>
                        {coupon.code}
                      </div>
                    </td>
                    <td>
                      <span className="admin-badge purple" style={{ fontWeight: 700, fontSize: '0.82rem' }}>
                        {coupon.discountType === 'percent' ? `${coupon.discountValue}% OFF` : `₹${coupon.discountValue} FLAT`}
                      </span>
                    </td>
                    <td>
                      {coupon.minOrderAmount > 0 ? formatPrice(coupon.minOrderAmount) : 'No min'}
                    </td>
                    <td>
                      {coupon.maxDiscount ? formatPrice(coupon.maxDiscount) : 'No cap'}
                    </td>
                    <td>
                      <span style={{ fontSize: '0.82rem', color: '#cbd5e1' }}>
                        {coupon.usedCount || 0} / {coupon.usageLimit || '∞'}
                      </span>
                    </td>
                    <td>
                      {coupon.expiryDate ? (
                        <div style={{ fontSize: '0.8rem', color: isExpired ? '#f87171' : '#cbd5e1' }}>
                          {new Date(coupon.expiryDate).toLocaleDateString()}
                          {isExpired && <span style={{ marginLeft: '4px', fontSize: '0.7rem' }}>(Expired)</span>}
                        </div>
                      ) : (
                        <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Never expires</span>
                      )}
                    </td>
                    <td>
                      <span className={`admin-badge ${coupon.isActive && !isExpired ? 'success' : 'danger'}`}>
                        {coupon.isActive && !isExpired ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '0.35rem' }}>
                        <button className="admin-btn admin-btn-secondary admin-btn-sm" onClick={() => handleOpenModal('edit', coupon)}>
                          <Edit size={13} />
                        </button>
                        <button className="admin-btn admin-btn-danger admin-btn-sm" onClick={() => handleDelete(coupon)}>
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* CREATE / EDIT COUPON MODAL */}
      {modal.open && (
        <div className="admin-modal-backdrop" onClick={() => setModal({ open: false, mode: 'create', data: null })}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <form onSubmit={handleSave}>
              <div className="admin-modal-header">
                <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#f8fafc' }}>
                  {modal.mode === 'edit' ? 'Edit Coupon Code' : 'Create Promotional Discount Coupon'}
                </h3>
                <button type="button" onClick={() => setModal({ open: false, mode: 'create', data: null })} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
                  <X size={20} />
                </button>
              </div>

              <div className="admin-modal-body">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="admin-form-group">
                    <label className="admin-form-label">Coupon Code *</label>
                    <input
                      type="text"
                      className="admin-form-input"
                      required
                      placeholder="e.g. FESTIVE20"
                      value={form.code}
                      onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                    />
                  </div>

                  <div className="admin-form-group">
                    <label className="admin-form-label">Discount Type *</label>
                    <select
                      className="admin-form-input"
                      value={form.discountType}
                      onChange={(e) => setForm({ ...form, discountType: e.target.value })}
                    >
                      <option value="percent">Percentage (%)</option>
                      <option value="fixed">Fixed Amount (₹)</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
                  <div className="admin-form-group">
                    <label className="admin-form-label">Discount Value *</label>
                    <input
                      type="number"
                      className="admin-form-input"
                      required
                      min="1"
                      value={form.discountValue}
                      onChange={(e) => setForm({ ...form, discountValue: e.target.value })}
                    />
                  </div>

                  <div className="admin-form-group">
                    <label className="admin-form-label">Min Cart Amount (₹)</label>
                    <input
                      type="number"
                      className="admin-form-input"
                      min="0"
                      value={form.minOrderAmount}
                      onChange={(e) => setForm({ ...form, minOrderAmount: e.target.value })}
                    />
                  </div>

                  <div className="admin-form-group">
                    <label className="admin-form-label">Max Discount (₹)</label>
                    <input
                      type="number"
                      className="admin-form-input"
                      placeholder="Optional"
                      value={form.maxDiscount}
                      onChange={(e) => setForm({ ...form, maxDiscount: e.target.value })}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="admin-form-group">
                    <label className="admin-form-label">Expiry Date</label>
                    <input
                      type="date"
                      className="admin-form-input"
                      value={form.expiryDate}
                      onChange={(e) => setForm({ ...form, expiryDate: e.target.value })}
                    />
                  </div>

                  <div className="admin-form-group">
                    <label className="admin-form-label">Max Redemptions</label>
                    <input
                      type="number"
                      className="admin-form-input"
                      min="1"
                      value={form.usageLimit}
                      onChange={(e) => setForm({ ...form, usageLimit: e.target.value })}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
                  <input
                    type="checkbox"
                    id="couponActive"
                    checked={form.isActive}
                    onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                  />
                  <label htmlFor="couponActive" style={{ fontSize: '0.85rem', color: '#cbd5e1', cursor: 'pointer' }}>
                    Coupon code is active and redeemable at checkout
                  </label>
                </div>
              </div>

              <div className="admin-modal-footer">
                <button type="button" className="admin-btn admin-btn-secondary" onClick={() => setModal({ open: false, mode: 'create', data: null })}>
                  Cancel
                </button>
                <button type="submit" className="admin-btn admin-btn-primary">
                  {modal.mode === 'edit' ? 'Update Coupon' : 'Create Campaign'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
