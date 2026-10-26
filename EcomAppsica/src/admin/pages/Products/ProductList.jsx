import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Package,
  Plus,
  Search,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Layers,
  Store,
  DollarSign,
  Eye,
  X,
  RefreshCw,
  Star,
} from 'lucide-react';
import { productService } from '../../../services/productService';
import { categoryService } from '../../../services/categoryService';
import { formatPrice } from '../../../utils/formatPrice';

export default function ProductList() {
  const [searchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Filters
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || 'all');
  const [stockFilter, setStockFilter] = useState('all');

  // Add / Edit Modal
  const [productModal, setProductModal] = useState({ open: false, mode: 'create', data: null });
  const [form, setForm] = useState({
    name: '',
    category: '',
    price: '',
    originalPrice: '',
    stock: 20,
    brand: 'Appsica Studio',
    description: '',
    images: '',
    isFeatured: false,
  });

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const [prodRes, catRes] = await Promise.all([
        productService.getAllForAdmin({ limit: 100 }),
        categoryService.getAll(),
      ]);

      setProducts(prodRes?.products || (Array.isArray(prodRes) ? prodRes : []));
      setCategories(catRes?.categories || (Array.isArray(catRes) ? catRes : []));
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Failed to load catalog products');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Product Moderation (Approve / Reject)
  const handleModerate = async (productId, status) => {
    let rejectionReason = '';
    if (status === 'rejected') {
      rejectionReason = window.prompt('Specify reason for rejection:', 'Listing does not comply with marketplace catalog quality guidelines.');
      if (rejectionReason === null) return;
    }

    try {
      await productService.moderate(productId, { vendorStatus: status, rejectionReason });
      setProducts((prev) =>
        prev.map((p) => ((p._id || p.id) === productId ? { ...p, vendorStatus: status } : p))
      );
      setSuccess(`Product marked as ${status} successfully!`);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Moderation action failed');
    }
  };

  // Open Create/Edit modal
  const handleOpenModal = (mode = 'create', prod = null) => {
    if (mode === 'edit' && prod) {
      setForm({
        name: prod.name || '',
        category: prod.category?._id || prod.category || '',
        price: prod.price || '',
        originalPrice: prod.originalPrice || '',
        stock: prod.stock !== undefined ? prod.stock : 20,
        brand: prod.brand || '',
        description: prod.description || '',
        images: Array.isArray(prod.images) ? prod.images.join(', ') : prod.images || '',
        isFeatured: !!prod.isFeatured,
      });
      setProductModal({ open: true, mode: 'edit', data: prod });
    } else {
      setForm({
        name: '',
        category: categories[0]?._id || '',
        price: '',
        originalPrice: '',
        stock: 25,
        brand: 'Appsica Official',
        description: '',
        images: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80',
        isFeatured: false,
      });
      setProductModal({ open: true, mode: 'create', data: null });
    }
  };

  // Save Product (Create or Update)
  const handleSaveProduct = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        name: form.name,
        category: form.category,
        price: Number(form.price),
        originalPrice: form.originalPrice ? Number(form.originalPrice) : Number(form.price),
        stock: Number(form.stock),
        brand: form.brand,
        description: form.description,
        images: form.images.split(',').map((s) => s.trim()).filter(Boolean),
        isFeatured: form.isFeatured,
      };

      if (productModal.mode === 'edit' && productModal.data) {
        const res = await productService.update(productModal.data._id || productModal.data.id, payload);
        const updated = res?.product || res;
        setProducts((prev) => prev.map((p) => ((p._id || p.id) === (updated._id || updated.id) ? updated : p)));
        setSuccess(`Product "${payload.name}" updated!`);
      } else {
        const res = await productService.create(payload);
        const created = res?.product || res;
        setProducts((prev) => [created, ...prev]);
        setSuccess(`Product "${payload.name}" created!`);
      }

      setProductModal({ open: false, mode: 'create', data: null });
      setTimeout(() => setSuccess(''), 3000);
      loadData();
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Failed to save product');
    }
  };

  // Delete Product
  const handleDeleteProduct = async (prod) => {
    if (!window.confirm(`Are you sure you want to delete "${prod.name}"?`)) return;

    try {
      await productService.delete(prod._id || prod.id);
      setProducts((prev) => prev.filter((p) => (p._id || p.id) !== (prod._id || prod.id)));
      setSuccess(`Product "${prod.name}" deleted.`);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Delete failed');
    }
  };

  // Filter products
  const filtered = products.filter((p) => {
    const q = search.toLowerCase();
    const matchesSearch =
      !search ||
      p.name?.toLowerCase().includes(q) ||
      p.brand?.toLowerCase().includes(q) ||
      p.vendor?.storeName?.toLowerCase().includes(q);

    const matchesCategory =
      !selectedCategory ||
      (p.category?._id === selectedCategory || p.category === selectedCategory);

    const pStatus = p.vendorStatus || 'approved';
    const matchesStatus =
      statusFilter === 'all' || pStatus.toLowerCase() === statusFilter.toLowerCase();

    const matchesStock =
      stockFilter === 'all'
        ? true
        : stockFilter === 'low_stock'
        ? p.stock > 0 && p.stock <= 5
        : stockFilter === 'out_of_stock'
        ? p.stock === 0
        : true;

    return matchesSearch && matchesCategory && matchesStatus && matchesStock;
  });

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0, color: '#f8fafc' }}>
            Products & Catalog Inventory ({products.length})
          </h2>
          <p style={{ margin: '0.2rem 0 0', fontSize: '0.85rem', color: '#94a3b8' }}>
            Moderate vendor submissions, adjust pricing, monitor low-stock warnings, and manage catalog items.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="admin-btn admin-btn-secondary" onClick={loadData}>
            <RefreshCw size={15} className={loading ? 'spin-icon' : ''} /> Refresh
          </button>
          <button className="admin-btn admin-btn-primary" onClick={() => handleOpenModal('create')}>
            <Plus size={16} /> Add Product
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

      {/* Filter Bar */}
      <div className="admin-filter-bar">
        <div className="admin-search-box">
          <Search size={16} className="admin-search-icon" />
          <input
            type="text"
            className="admin-search-input"
            placeholder="Search products by title, brand, or vendor..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
          <select
            className="admin-select"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c._id} value={c._id}>{c.name}</option>
            ))}
          </select>

          <select
            className="admin-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Moderation States</option>
            <option value="approved">Approved & Live</option>
            <option value="pending">Pending Moderation</option>
            <option value="rejected">Rejected / Needs Review</option>
          </select>

          <select
            className="admin-select"
            value={stockFilter}
            onChange={(e) => setStockFilter(e.target.value)}
          >
            <option value="all">All Stock Levels</option>
            <option value="low_stock">⚠️ Low Stock (&le; 5)</option>
            <option value="out_of_stock">🚫 Out of Stock (0)</option>
          </select>
        </div>
      </div>

      {/* Products Table */}
      <div className="admin-table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Product Item</th>
              <th>Category</th>
              <th>Vendor Store</th>
              <th>Price</th>
              <th>Stock</th>
              <th>Moderation</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '3rem' }}>
                  <div className="admin-loading-spinner" />
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
                  No products matched the active filters.
                </td>
              </tr>
            ) : (
              filtered.map((prod) => {
                const img = Array.isArray(prod.images) ? prod.images[0] : prod.images;
                const status = prod.vendorStatus || 'approved';
                const isLowStock = prod.stock !== undefined && prod.stock <= 5;
                const isOutOfStock = prod.stock === 0;

                return (
                  <tr key={prod._id || prod.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <img
                          src={img || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=150&q=80'}
                          alt={prod.name}
                          style={{ width: '42px', height: '42px', objectFit: 'cover', borderRadius: '8px', border: '1px solid var(--ap-border)' }}
                        />
                        <div>
                          <div style={{ fontWeight: 600, color: '#f8fafc', maxWidth: '280px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {prod.name}
                          </div>
                          <div style={{ fontSize: '0.72rem', color: '#818cf8' }}>
                            {prod.brand || 'Appsica Studio'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="admin-badge neutral">
                        {prod.category?.name || 'Catalog'}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontSize: '0.82rem', fontWeight: 500, color: '#cbd5e1' }}>
                        {prod.vendor?.storeName || 'Appsica Official'}
                      </div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 700 }}>{formatPrice(prod.price)}</div>
                      {prod.originalPrice > prod.price && (
                        <div style={{ fontSize: '0.7rem', color: '#64748b', textDecoration: 'line-through' }}>
                          {formatPrice(prod.originalPrice)}
                        </div>
                      )}
                    </td>
                    <td>
                      {isOutOfStock ? (
                        <span className="admin-badge danger">Out of Stock</span>
                      ) : isLowStock ? (
                        <span className="admin-badge warning">Low: {prod.stock} left</span>
                      ) : (
                        <span style={{ fontWeight: 600, color: '#34d399' }}>{prod.stock} units</span>
                      )}
                    </td>
                    <td>
                      <span className={`admin-badge ${
                        status === 'approved' ? 'success' :
                        status === 'pending' ? 'warning' : 'danger'
                      }`}>
                        {status}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '0.4rem', alignItems: 'center' }}>
                        {status === 'pending' && (
                          <>
                            <button
                              className="admin-btn admin-btn-success admin-btn-sm"
                              onClick={() => handleModerate(prod._id || prod.id, 'approved')}
                              title="Approve for live store"
                            >
                              Approve
                            </button>
                            <button
                              className="admin-btn admin-btn-danger admin-btn-sm"
                              onClick={() => handleModerate(prod._id || prod.id, 'rejected')}
                              title="Reject listing"
                            >
                              Reject
                            </button>
                          </>
                        )}
                        <button
                          className="admin-btn admin-btn-secondary admin-btn-sm"
                          onClick={() => handleOpenModal('edit', prod)}
                          title="Edit Product"
                        >
                          <Edit size={13} />
                        </button>
                        <button
                          className="admin-btn admin-btn-danger admin-btn-sm"
                          onClick={() => handleDeleteProduct(prod)}
                          title="Delete Product"
                        >
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

      {/* CREATE / EDIT PRODUCT MODAL */}
      {productModal.open && (
        <div className="admin-modal-backdrop" onClick={() => setProductModal({ open: false, mode: 'create', data: null })}>
          <div className="admin-modal admin-modal-lg" onClick={(e) => e.stopPropagation()}>
            <form onSubmit={handleSaveProduct}>
              <div className="admin-modal-header">
                <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#f8fafc' }}>
                  {productModal.mode === 'edit' ? 'Edit Catalog Product' : 'Add New Marketplace Product'}
                </h3>
                <button
                  type="button"
                  onClick={() => setProductModal({ open: false, mode: 'create', data: null })}
                  style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
                >
                  <X size={20} />
                </button>
              </div>

              <div className="admin-modal-body">
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem' }}>
                  <div className="admin-form-group">
                    <label className="admin-form-label">Product Title *</label>
                    <input
                      type="text"
                      className="admin-form-input"
                      required
                      placeholder="e.g. Minimalist Wool Overcoat"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                    />
                  </div>

                  <div className="admin-form-group">
                    <label className="admin-form-label">Category *</label>
                    <select
                      className="admin-form-input"
                      required
                      value={form.category}
                      onChange={(e) => setForm({ ...form, category: e.target.value })}
                    >
                      <option value="">Select Category</option>
                      {categories.map((c) => (
                        <option key={c._id} value={c._id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
                  <div className="admin-form-group">
                    <label className="admin-form-label">Selling Price (₹) *</label>
                    <input
                      type="number"
                      className="admin-form-input"
                      required
                      min="1"
                      placeholder="4999"
                      value={form.price}
                      onChange={(e) => setForm({ ...form, price: e.target.value })}
                    />
                  </div>

                  <div className="admin-form-group">
                    <label className="admin-form-label">Original Price / MRP (₹)</label>
                    <input
                      type="number"
                      className="admin-form-input"
                      min="1"
                      placeholder="6999"
                      value={form.originalPrice}
                      onChange={(e) => setForm({ ...form, originalPrice: e.target.value })}
                    />
                  </div>

                  <div className="admin-form-group">
                    <label className="admin-form-label">Available Inventory Stock *</label>
                    <input
                      type="number"
                      className="admin-form-input"
                      required
                      min="0"
                      value={form.stock}
                      onChange={(e) => setForm({ ...form, stock: e.target.value })}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="admin-form-group">
                    <label className="admin-form-label">Brand / Label</label>
                    <input
                      type="text"
                      className="admin-form-input"
                      placeholder="e.g. Atelier H"
                      value={form.brand}
                      onChange={(e) => setForm({ ...form, brand: e.target.value })}
                    />
                  </div>

                  <div className="admin-form-group">
                    <label className="admin-form-label">Image URLs (comma separated)</label>
                    <input
                      type="text"
                      className="admin-form-input"
                      placeholder="https://images.unsplash.com/photo-..."
                      value={form.images}
                      onChange={(e) => setForm({ ...form, images: e.target.value })}
                    />
                  </div>
                </div>

                <div className="admin-form-group">
                  <label className="admin-form-label">Product Detailed Description</label>
                  <textarea
                    className="admin-form-textarea"
                    rows="4"
                    placeholder="Describe material, dimensions, warranty, and features..."
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                  />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
                  <input
                    type="checkbox"
                    id="isFeatured"
                    checked={form.isFeatured}
                    onChange={(e) => setForm({ ...form, isFeatured: e.target.checked })}
                  />
                  <label htmlFor="isFeatured" style={{ fontSize: '0.85rem', color: '#cbd5e1', cursor: 'pointer' }}>
                    Feature this product on homepage curated showcases
                  </label>
                </div>
              </div>

              <div className="admin-modal-footer">
                <button
                  type="button"
                  className="admin-btn admin-btn-secondary"
                  onClick={() => setProductModal({ open: false, mode: 'create', data: null })}
                >
                  Cancel
                </button>
                <button type="submit" className="admin-btn admin-btn-primary">
                  {productModal.mode === 'edit' ? 'Save Changes' : 'Create Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
