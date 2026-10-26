import React, { useState, useEffect } from 'react';
import {
  Image,
  Plus,
  Edit,
  Trash2,
  CheckCircle,
  AlertTriangle,
  ExternalLink,
  X,
  RefreshCw,
} from 'lucide-react';
import { adminService } from '../../../services/adminService';

export default function BannerManagement() {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Modal
  const [modal, setModal] = useState({ open: false, mode: 'create', data: null });
  const [form, setForm] = useState({
    title: '',
    subtitle: '',
    image: '',
    link: '/products',
    position: 0,
    isActive: true,
  });

  const loadBanners = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await adminService.getBanners();
      setBanners(res?.banners || (Array.isArray(res) ? res : []));
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Failed to load banners');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBanners();
  }, []);

  const handleOpenModal = (mode = 'create', banner = null) => {
    if (mode === 'edit' && banner) {
      setForm({
        title: banner.title || '',
        subtitle: banner.subtitle || '',
        image: banner.image || '',
        link: banner.link || '/products',
        position: banner.position || 0,
        isActive: banner.isActive !== undefined ? banner.isActive : true,
      });
      setModal({ open: true, mode: 'edit', data: banner });
    } else {
      setForm({
        title: '',
        subtitle: '',
        image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1200&q=80',
        link: '/products',
        position: banners.length,
        isActive: true,
      });
      setModal({ open: true, mode: 'create', data: null });
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        title: form.title,
        subtitle: form.subtitle,
        image: form.image,
        link: form.link,
        position: Number(form.position),
        isActive: form.isActive,
      };

      if (modal.mode === 'edit' && modal.data) {
        const res = await adminService.updateBanner(modal.data._id, payload);
        const updated = res?.banner || res;
        setBanners((prev) => prev.map((b) => (b._id === updated._id ? updated : b)));
        setSuccess(`Banner "${payload.title}" updated!`);
      } else {
        const res = await adminService.createBanner(payload);
        const created = res?.banner || res;
        setBanners((prev) => [...prev, created]);
        setSuccess(`Banner "${payload.title}" created!`);
      }

      setModal({ open: false, mode: 'create', data: null });
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Failed to save banner');
    }
  };

  const handleDelete = async (banner) => {
    if (!window.confirm(`Delete banner "${banner.title}"?`)) return;

    try {
      await adminService.deleteBanner(banner._id);
      setBanners((prev) => prev.filter((b) => b._id !== banner._id));
      setSuccess(`Banner "${banner.title}" deleted.`);
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
            Storefront Hero & Marketing Banners ({banners.length})
          </h2>
          <p style={{ margin: '0.2rem 0 0', fontSize: '0.85rem', color: '#94a3b8' }}>
            Promote new seasonal collections, curated categories, and flash discount campaigns.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="admin-btn admin-btn-secondary" onClick={loadBanners}>
            <RefreshCw size={15} className={loading ? 'spin-icon' : ''} /> Refresh
          </button>
          <button className="admin-btn admin-btn-primary" onClick={() => handleOpenModal('create')}>
            <Plus size={16} /> Add Banner
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

      {/* Grid of Banners */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '1.5rem' }}>
        {loading ? (
          <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3rem' }}>
            <div className="admin-loading-spinner" />
          </div>
        ) : banners.length === 0 ? (
          <div className="admin-empty-state" style={{ gridColumn: '1 / -1' }}>
            No homepage promotional banners configured yet.
          </div>
        ) : (
          banners.map((banner) => (
            <div key={banner._id} className="admin-card" style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ position: 'relative', height: '170px', borderRadius: '8px', overflow: 'hidden', marginBottom: '1rem' }}>
                <img
                  src={banner.image}
                  alt={banner.title}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
                <div style={{ position: 'absolute', top: '10px', right: '10px' }}>
                  <span className={`admin-badge ${banner.isActive ? 'success' : 'neutral'}`} style={{ backdropFilter: 'blur(8px)' }}>
                    {banner.isActive ? 'Active Live' : 'Draft'}
                  </span>
                </div>
                <div style={{ position: 'absolute', bottom: '10px', left: '12px', background: 'rgba(0,0,0,0.6)', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.72rem', color: '#fff' }}>
                  Position: #{banner.position}
                </div>
              </div>

              <div style={{ flex: 1 }}>
                <h3 style={{ margin: '0 0 0.35rem', fontSize: '1.05rem', color: '#f8fafc', fontWeight: 700 }}>
                  {banner.title}
                </h3>
                {banner.subtitle && (
                  <p style={{ margin: '0 0 0.5rem', fontSize: '0.82rem', color: '#94a3b8' }}>
                    {banner.subtitle}
                  </p>
                )}
                <div style={{ fontSize: '0.78rem', color: '#818cf8', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <ExternalLink size={12} /> Target: {banner.link}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid var(--ap-border-subtle)' }}>
                <button className="admin-btn admin-btn-secondary admin-btn-sm" onClick={() => handleOpenModal('edit', banner)}>
                  <Edit size={13} /> Edit
                </button>
                <button className="admin-btn admin-btn-danger admin-btn-sm" onClick={() => handleDelete(banner)}>
                  <Trash2 size={13} /> Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* CREATE / EDIT BANNER MODAL */}
      {modal.open && (
        <div className="admin-modal-backdrop" onClick={() => setModal({ open: false, mode: 'create', data: null })}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <form onSubmit={handleSave}>
              <div className="admin-modal-header">
                <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#f8fafc' }}>
                  {modal.mode === 'edit' ? 'Edit Promotional Banner' : 'Create Homepage Banner'}
                </h3>
                <button type="button" onClick={() => setModal({ open: false, mode: 'create', data: null })} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
                  <X size={20} />
                </button>
              </div>

              <div className="admin-modal-body">
                <div className="admin-form-group">
                  <label className="admin-form-label">Banner Headline *</label>
                  <input
                    type="text"
                    className="admin-form-input"
                    required
                    placeholder="e.g. Autumn Minimalist Outerwear"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                  />
                </div>

                <div className="admin-form-group">
                  <label className="admin-form-label">Subtitle / Promotional Tagline</label>
                  <input
                    type="text"
                    className="admin-form-input"
                    placeholder="e.g. Crafted from 100% sustainable Australian merino wool"
                    value={form.subtitle}
                    onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
                  />
                </div>

                <div className="admin-form-group">
                  <label className="admin-form-label">Banner Image URL *</label>
                  <input
                    type="text"
                    className="admin-form-input"
                    required
                    placeholder="https://images.unsplash.com/photo-..."
                    value={form.image}
                    onChange={(e) => setForm({ ...form, image: e.target.value })}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem' }}>
                  <div className="admin-form-group">
                    <label className="admin-form-label">Destination Link</label>
                    <input
                      type="text"
                      className="admin-form-input"
                      placeholder="/products or /category/outerwear"
                      value={form.link}
                      onChange={(e) => setForm({ ...form, link: e.target.value })}
                    />
                  </div>

                  <div className="admin-form-group">
                    <label className="admin-form-label">Display Order</label>
                    <input
                      type="number"
                      className="admin-form-input"
                      min="0"
                      value={form.position}
                      onChange={(e) => setForm({ ...form, position: e.target.value })}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
                  <input
                    type="checkbox"
                    id="bannerActive"
                    checked={form.isActive}
                    onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                  />
                  <label htmlFor="bannerActive" style={{ fontSize: '0.85rem', color: '#cbd5e1', cursor: 'pointer' }}>
                    Publish banner on customer storefront hero carousel
                  </label>
                </div>
              </div>

              <div className="admin-modal-footer">
                <button type="button" className="admin-btn admin-btn-secondary" onClick={() => setModal({ open: false, mode: 'create', data: null })}>
                  Cancel
                </button>
                <button type="submit" className="admin-btn admin-btn-primary">
                  {modal.mode === 'edit' ? 'Update Banner' : 'Create Banner'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
