import React, { useState, useEffect } from 'react';
import {
  Layers,
  Plus,
  Search,
  Edit,
  Trash2,
  CheckCircle,
  AlertTriangle,
  X,
  RefreshCw,
} from 'lucide-react';
import { categoryService } from '../../../services/categoryService';

export default function CategoryManagement() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [search, setSearch] = useState('');

  // Modal state
  const [modal, setModal] = useState({ open: false, mode: 'create', data: null });
  const [form, setForm] = useState({ name: '', slug: '', description: '', image: '' });

  const loadCategories = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await categoryService.getAll();
      setCategories(res?.categories || (Array.isArray(res) ? res : []));
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const handleOpenModal = (mode = 'create', cat = null) => {
    if (mode === 'edit' && cat) {
      setForm({
        name: cat.name || '',
        slug: cat.slug || '',
        description: cat.description || '',
        image: cat.image || '',
      });
      setModal({ open: true, mode: 'edit', data: cat });
    } else {
      setForm({ name: '', slug: '', description: '', image: '' });
      setModal({ open: true, mode: 'create', data: null });
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        name: form.name,
        slug: form.slug || form.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        description: form.description,
        image: form.image || 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=400&q=80',
      };

      if (modal.mode === 'edit' && modal.data) {
        const res = await categoryService.update(modal.data._id, payload);
        const updated = res?.category || res;
        setCategories((prev) => prev.map((c) => (c._id === updated._id ? updated : c)));
        setSuccess(`Category "${payload.name}" updated!`);
      } else {
        const res = await categoryService.create(payload);
        const created = res?.category || res;
        setCategories((prev) => [...prev, created]);
        setSuccess(`Category "${payload.name}" created!`);
      }

      setModal({ open: false, mode: 'create', data: null });
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Failed to save category');
    }
  };

  const handleDelete = async (cat) => {
    if (!window.confirm(`Delete category "${cat.name}"? Products in this category may be affected.`)) return;

    try {
      await categoryService.delete(cat._id);
      setCategories((prev) => prev.filter((c) => c._id !== cat._id));
      setSuccess(`Category "${cat.name}" deleted.`);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Delete failed');
    }
  };

  const filtered = categories.filter((c) =>
    !search || c.name?.toLowerCase().includes(search.toLowerCase()) || c.slug?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0, color: '#f8fafc' }}>
            Store Categories & Taxonomies ({categories.length})
          </h2>
          <p style={{ margin: '0.2rem 0 0', fontSize: '0.85rem', color: '#94a3b8' }}>
            Configure product catalog groupings, slugs, and navigation hero imagery.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="admin-btn admin-btn-secondary" onClick={loadCategories}>
            <RefreshCw size={15} className={loading ? 'spin-icon' : ''} /> Refresh
          </button>
          <button className="admin-btn admin-btn-primary" onClick={() => handleOpenModal('create')}>
            <Plus size={16} /> New Category
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

      {/* Search */}
      <div className="admin-filter-bar">
        <div className="admin-search-box">
          <Search size={16} className="admin-search-icon" />
          <input
            type="text"
            className="admin-search-input"
            placeholder="Search categories by name or slug..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Grid of categories */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.25rem' }}>
        {loading ? (
          <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3rem' }}>
            <div className="admin-loading-spinner" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="admin-empty-state" style={{ gridColumn: '1 / -1' }}>
            No categories found
          </div>
        ) : (
          filtered.map((cat) => (
            <div
              key={cat._id}
              className="admin-card"
              style={{ display: 'flex', flexDirection: 'column', padding: '1.25rem' }}
            >
              <div style={{ position: 'relative', height: '140px', borderRadius: '8px', overflow: 'hidden', marginBottom: '1rem' }}>
                <img
                  src={cat.image || 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=400&q=80'}
                  alt={cat.name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, transparent 40%, rgba(7, 11, 20, 0.85) 100%)' }} />
                <div style={{ position: 'absolute', bottom: '10px', left: '12px', right: '12px' }}>
                  <span className="admin-badge neutral" style={{ background: 'rgba(0,0,0,0.6)', color: '#fff' }}>
                    /{cat.slug}
                  </span>
                </div>
              </div>

              <div style={{ flex: 1 }}>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: '0 0 0.35rem', color: '#f8fafc' }}>
                  {cat.name}
                </h3>
                <p style={{ fontSize: '0.8rem', color: '#94a3b8', margin: 0, lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {cat.description || 'No description provided.'}
                </p>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid var(--ap-border-subtle)' }}>
                <button
                  className="admin-btn admin-btn-secondary admin-btn-sm"
                  onClick={() => handleOpenModal('edit', cat)}
                >
                  <Edit size={13} /> Edit
                </button>
                <button
                  className="admin-btn admin-btn-danger admin-btn-sm"
                  onClick={() => handleDelete(cat)}
                >
                  <Trash2 size={13} /> Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* CREATE / EDIT CATEGORY MODAL */}
      {modal.open && (
        <div className="admin-modal-backdrop" onClick={() => setModal({ open: false, mode: 'create', data: null })}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <form onSubmit={handleSave}>
              <div className="admin-modal-header">
                <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#f8fafc' }}>
                  {modal.mode === 'edit' ? 'Edit Category' : 'Create New Category'}
                </h3>
                <button
                  type="button"
                  onClick={() => setModal({ open: false, mode: 'create', data: null })}
                  style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
                >
                  <X size={20} />
                </button>
              </div>

              <div className="admin-modal-body">
                <div className="admin-form-group">
                  <label className="admin-form-label">Category Name *</label>
                  <input
                    type="text"
                    className="admin-form-input"
                    required
                    placeholder="e.g. Footwear & Boots"
                    value={form.name}
                    onChange={(e) => {
                      const name = e.target.value;
                      setForm({
                        ...form,
                        name,
                        slug: modal.mode === 'create' ? name.toLowerCase().replace(/[^a-z0-9]+/g, '-') : form.slug,
                      });
                    }}
                  />
                </div>

                <div className="admin-form-group">
                  <label className="admin-form-label">URL Slug</label>
                  <input
                    type="text"
                    className="admin-form-input"
                    placeholder="footwear-boots"
                    value={form.slug}
                    onChange={(e) => setForm({ ...form, slug: e.target.value })}
                  />
                </div>

                <div className="admin-form-group">
                  <label className="admin-form-label">Banner Image URL</label>
                  <input
                    type="text"
                    className="admin-form-input"
                    placeholder="https://images.unsplash.com/..."
                    value={form.image}
                    onChange={(e) => setForm({ ...form, image: e.target.value })}
                  />
                </div>

                <div className="admin-form-group">
                  <label className="admin-form-label">Description</label>
                  <textarea
                    className="admin-form-textarea"
                    rows="3"
                    placeholder="Summary shown on catalog page header..."
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                  />
                </div>
              </div>

              <div className="admin-modal-footer">
                <button
                  type="button"
                  className="admin-btn admin-btn-secondary"
                  onClick={() => setModal({ open: false, mode: 'create', data: null })}
                >
                  Cancel
                </button>
                <button type="submit" className="admin-btn admin-btn-primary">
                  {modal.mode === 'edit' ? 'Update Category' : 'Create Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
