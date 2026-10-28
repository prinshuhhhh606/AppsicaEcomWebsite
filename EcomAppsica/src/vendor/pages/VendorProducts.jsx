import React, { useState, useEffect, useContext, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Package,
  Plus,
  Search,
  Edit,
  Trash2,
  ExternalLink,
  Upload,
  X,
  Image,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Sparkles,
  Power,
  EyeOff,
  ShieldAlert,
} from 'lucide-react';
import { vendorService } from '../../services/vendorService';
import { categoryService } from '../../services/categoryService';
import { formatPrice } from '../../utils/formatPrice';
import { AuthContext } from '../../context/AuthContextValue';

// Preset sample images for quick convenience
const PRESET_IMAGES = [
  { name: 'Studio Audio Headphones', url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80' },
  { name: 'Ceramic Smartwatch', url: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80' },
  { name: 'Minimalist Keyboard', url: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=800&q=80' },
  { name: 'Desk Ambient Lamp', url: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=800&q=80' },
  { name: 'Organic Cotton Shirt', url: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80' },
  { name: 'Leather Tech Sleeve', url: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=800&q=80' },
];

export default function VendorProducts() {
  const { user } = useContext(AuthContext);

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [stockFilter, setStockFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Modals & Action Loaders
  const [productModal, setProductModal] = useState({
    open: false,
    mode: 'create', // 'create' | 'edit'
    id: null,
  });

  const [deleteModal, setDeleteModal] = useState({
    open: false,
    product: null,
    isDeleting: false,
    errorMessage: '',
  });

  const [togglingId, setTogglingId] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    price: '',
    originalPrice: '',
    stock: 20,
    brand: '',
    description: '',
    images: [],
    tags: '',
    isFeatured: false,
    isActive: true,
  });

  const [customImageUrl, setCustomImageUrl] = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [prodRes, catRes] = await Promise.all([
        vendorService.getProducts({
          search: searchTerm,
          category: selectedCategory,
          stockStatus: stockFilter,
          status: statusFilter !== 'all' ? statusFilter : undefined,
        }),
        categoryService.getAll().catch(() => ({ categories: [] })),
      ]);

      setProducts(prodRes?.products || []);
      const cats = catRes?.categories || catRes?.data?.categories || (Array.isArray(catRes) ? catRes : []);
      setCategories(cats);
    } catch (err) {
      setError(err?.message || 'Failed to load vendor products');
    } finally {
      setLoading(false);
    }
  }, [searchTerm, selectedCategory, stockFilter, statusFilter]);

  useEffect(() => {
    let cancelled = false;
    const initFetch = async () => {
      try {
        const [prodRes, catRes] = await Promise.all([
          vendorService.getProducts({
            search: searchTerm,
            category: selectedCategory,
            stockStatus: stockFilter,
            status: statusFilter !== 'all' ? statusFilter : undefined,
          }),
          categoryService.getAll().catch(() => ({ categories: [] })),
        ]);

        if (!cancelled) {
          setProducts(prodRes?.products || []);
          const cats = catRes?.categories || catRes?.data?.categories || (Array.isArray(catRes) ? catRes : []);
          setCategories(cats);
          setLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err?.message || 'Failed to load vendor products');
          setLoading(false);
        }
      }
    };

    initFetch();
    return () => {
      cancelled = true;
    };
  }, [searchTerm, selectedCategory, stockFilter, statusFilter]);

  // Open Create Modal
  const handleOpenCreateModal = () => {
    setFormData({
      name: '',
      category: categories[0]?._id || '',
      price: '',
      originalPrice: '',
      stock: 25,
      brand: user?.storeName || 'My Brand',
      description: '',
      images: [PRESET_IMAGES[0].url],
      tags: '',
      isFeatured: false,
      isActive: true,
    });
    setCustomImageUrl('');
    setProductModal({ open: true, mode: 'create', id: null });
  };

  // Open Edit Modal
  const handleOpenEditModal = (product) => {
    setFormData({
      name: product.name,
      category: product.category?._id || product.category || '',
      price: product.price,
      originalPrice: product.originalPrice || product.price,
      stock: product.stock,
      brand: product.brand || user?.storeName || '',
      description: product.description || '',
      images: Array.isArray(product.images) && product.images.length ? product.images : [PRESET_IMAGES[0].url],
      tags: Array.isArray(product.tags) ? product.tags.join(', ') : '',
      isFeatured: Boolean(product.isFeatured),
      isActive: product.isActive !== false,
    });
    setCustomImageUrl('');
    setProductModal({ open: true, mode: 'edit', id: product._id });
  };

  // Add custom URL image
  const handleAddImageUrl = (e) => {
    e.preventDefault();
    if (!customImageUrl.trim()) return;
    setFormData((prev) => ({
      ...prev,
      images: [...prev.images, customImageUrl.trim()],
    }));
    setCustomImageUrl('');
  };

  // Handle local file upload (converts to base64 preview URL)
  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      if (reader.result) {
        setFormData((prev) => ({
          ...prev,
          images: [...prev.images, reader.result],
        }));
      }
    };
    reader.readAsDataURL(file);
  };

  // Remove image from gallery
  const handleRemoveImage = (indexToRemove) => {
    setFormData((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== indexToRemove),
    }));
  };

  // Submit Product Form
  const handleSubmitProduct = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.price || !formData.category) {
      alert('Please fill in required fields: Name, Category, and Price');
      return;
    }

    setIsSaving(true);
    try {
      if (productModal.mode === 'create') {
        const res = await vendorService.createProduct(formData);
        setSuccessMsg(res?.message || 'Product created successfully!');
      } else {
        const res = await vendorService.updateProduct(productModal.id, formData);
        setSuccessMsg(res?.message || 'Product updated successfully!');
      }

      setProductModal({ open: false, mode: 'create', id: null });
      loadData();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      alert(err?.response?.data?.message || err?.message || 'Failed to save product');
    } finally {
      setIsSaving(false);
    }
  };

  // Toggle Product Active / Deactivate State
  const handleToggleStatus = async (productId, explicitState = null) => {
    setTogglingId(productId);
    try {
      const res = await vendorService.toggleProductStatus(productId, explicitState);
      setSuccessMsg(res?.message || 'Product status updated successfully!');
      // Update local state immediately
      setProducts((prev) =>
        prev.map((p) =>
          p._id === productId ? { ...p, isActive: res?.product?.isActive ?? !p.isActive } : p
        )
      );
      if (deleteModal.open) {
        setDeleteModal({ open: false, product: null, isDeleting: false, errorMessage: '' });
      }
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Failed to update product status');
      setTimeout(() => setError(''), 4000);
    } finally {
      setTogglingId(null);
    }
  };

  // Confirm Delete Product (Safely handles pending orders and past order history)
  const handleDeleteProduct = async () => {
    if (!deleteModal.product) return;
    setDeleteModal((prev) => ({ ...prev, isDeleting: true, errorMessage: '' }));

    try {
      const res = await vendorService.deleteProduct(deleteModal.product._id);
      setSuccessMsg(res?.message || `Product "${deleteModal.product.name}" deleted successfully.`);
      setDeleteModal({ open: false, product: null, isDeleting: false, errorMessage: '' });
      loadData();
      setTimeout(() => setSuccessMsg(''), 4500);
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to delete product';
      setDeleteModal((prev) => ({ ...prev, isDeleting: false, errorMessage: msg }));
    }
  };

  return (
    <div>
      {/* Header bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '1.5rem',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#fff', margin: '0 0 0.25rem 0' }}>
            Store Products Catalog
          </h2>
          <p style={{ color: '#94a3b8', margin: 0, fontSize: '0.9rem' }}>
            Add, update inventory, manage pricing, activate/deactivate, and publish items directly to Appsica Marketplace.
          </p>
        </div>

        <button className="vp-btn vp-btn-primary" onClick={handleOpenCreateModal}>
          <Plus size={18} />
          <span>Add New Product</span>
        </button>
      </div>

      {/* Success Notification */}
      {successMsg && (
        <div
          style={{
            background: 'rgba(16, 185, 129, 0.12)',
            border: '1px solid rgba(16, 185, 129, 0.35)',
            color: '#6ee7b7',
            padding: '0.85rem 1rem',
            borderRadius: '10px',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <CheckCircle size={18} /> {successMsg}
        </div>
      )}

      {error && (
        <div
          style={{
            background: 'rgba(239, 68, 68, 0.12)',
            border: '1px solid rgba(239, 68, 68, 0.35)',
            color: '#f87171',
            padding: '0.85rem 1rem',
            borderRadius: '10px',
            marginBottom: '1.5rem',
          }}
        >
          {error}
        </div>
      )}

      {/* Toolbar: Search & Filters */}
      <div className="vendor-toolbar">
        <form
          className="vendor-search-box"
          onSubmit={(e) => {
            e.preventDefault();
            loadData();
          }}
        >
          <Search size={18} />
          <input
            type="text"
            placeholder="Search by product name, brand, tags..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </form>

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Category Filter */}
          <select
            className="vendor-filter-select"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c._id} value={c._id}>
                {c.name}
              </option>
            ))}
          </select>

          {/* Stock Filter */}
          <select
            className="vendor-filter-select"
            value={stockFilter}
            onChange={(e) => setStockFilter(e.target.value)}
          >
            <option value="">All Stock Levels</option>
            <option value="in_stock">In Stock (&gt; 5)</option>
            <option value="low_stock">Low Stock (1 - 5)</option>
            <option value="out_of_stock">Out of Stock (0)</option>
          </select>

          {/* Status Filter */}
          <select
            className="vendor-filter-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Statuses</option>
            <option value="active">Live & Active</option>
            <option value="inactive">Deactivated (Paused)</option>
            <option value="pending">Pending Review</option>
          </select>

          <button
            className="vp-btn vp-btn-secondary"
            onClick={loadData}
            title="Refresh list"
            disabled={loading}
          >
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Products Table Card */}
      <div className="vendor-card" style={{ padding: 0 }}>
        {products.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem 1.5rem', color: '#94a3b8' }}>
            <Package size={48} style={{ margin: '0 auto 1rem', color: '#475569' }} />
            <h3 style={{ color: '#fff', fontSize: '1.15rem', marginBottom: '0.5rem' }}>
              No Products Found
            </h3>
            <p style={{ maxWidth: '420px', margin: '0 auto 1.5rem', fontSize: '0.9rem' }}>
              You have not added any products matching your search criteria yet. Start selling by adding your first product!
            </p>
            <button className="vp-btn vp-btn-primary" onClick={handleOpenCreateModal}>
              <Plus size={18} /> Add Your First Product
            </button>
          </div>
        ) : (
          <div className="vendor-table-container" style={{ border: 'none' }}>
            <table className="vendor-table">
              <thead>
                <tr>
                  <th>Product Details</th>
                  <th>Category</th>
                  <th>Price</th>
                  <th>Original Price</th>
                  <th>Stock Inventory</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => {
                  const isPending = p.vendorStatus === 'pending';
                  const isDeactivated = p.isActive === false;
                  return (
                    <tr key={p._id} style={isDeactivated ? { opacity: 0.82 } : {}}>
                      <td>
                        <div className="vendor-prod-cell">
                          <img
                            src={
                              p.images?.[0] ||
                              'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=100&q=80'
                            }
                            alt={p.name}
                            className="vendor-product-thumb"
                          />
                          <div>
                            <span className="vendor-prod-name">{p.name}</span>
                            <span className="vendor-prod-meta">
                              Brand: {p.brand || user?.storeName} {p.isFeatured && '• ⭐ Featured'}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span style={{ color: '#cbd5e1' }}>{p.category?.name || 'General'}</span>
                      </td>
                      <td style={{ fontWeight: 700, color: '#34d399' }}>{formatPrice(p.price)}</td>
                      <td style={{ color: '#64748b', textDecoration: p.originalPrice > p.price ? 'line-through' : 'none' }}>
                        {formatPrice(p.originalPrice || p.price)}
                      </td>
                      <td>
                        {p.stock > 5 ? (
                          <span className="vp-badge vp-badge-instock">{p.stock} in stock</span>
                        ) : p.stock > 0 ? (
                          <span className="vp-badge vp-badge-lowstock">{p.stock} left (Low)</span>
                        ) : (
                          <span className="vp-badge vp-badge-outstock">0 (Out of stock)</span>
                        )}
                      </td>
                      <td>
                        {isPending ? (
                          <span className="vp-badge vp-badge-pending">Pending Review</span>
                        ) : isDeactivated ? (
                          <span className="vp-badge vp-badge-deactivated" title="Deactivated by seller - hidden from storefront">
                            <EyeOff size={12} /> Deactivated
                          </span>
                        ) : (
                          <span className="vp-badge vp-badge-delivered" title="Active on storefront">
                            <CheckCircle size={12} /> Live in Store
                          </span>
                        )}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                          <Link
                            to={`/product/${p.slug || p._id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="vp-action-btn"
                            title="Preview on Public Storefront"
                          >
                            <ExternalLink size={15} />
                          </Link>
                          <button
                            className="vp-action-btn"
                            onClick={() => handleOpenEditModal(p)}
                            title="Edit Product"
                          >
                            <Edit size={15} />
                          </button>
                          <button
                            className={`vp-action-btn ${isDeactivated ? 'toggle-active' : 'toggle-inactive'}`}
                            onClick={() => handleToggleStatus(p._id)}
                            disabled={togglingId === p._id}
                            title={isDeactivated ? 'Activate Product (Publish to Storefront)' : 'Deactivate Product (Hide from Storefront)'}
                            style={isDeactivated ? { color: '#34d399', borderColor: 'rgba(52, 211, 153, 0.4)' } : {}}
                          >
                            {togglingId === p._id ? (
                              <RefreshCw size={14} className="animate-spin" />
                            ) : (
                              <Power size={15} />
                            )}
                          </button>
                          <button
                            className="vp-action-btn delete"
                            onClick={() => setDeleteModal({ open: true, product: p, isDeleting: false, errorMessage: '' })}
                            title="Delete Product"
                          >
                            <Trash2 size={15} />
                          </button>
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

      {/* =========================================================
          ADD / EDIT PRODUCT MODAL
          ========================================================= */}
      {productModal.open && (
        <div className="vp-modal-backdrop" onClick={() => !isSaving && setProductModal({ open: false, mode: 'create', id: null })}>
          <div className="vp-modal vp-modal-lg" onClick={(e) => e.stopPropagation()}>
            <div className="vp-modal-header">
              <h3>{productModal.mode === 'create' ? 'Add New Product to Store' : 'Edit Product Details'}</h3>
              <button
                className="vp-modal-close"
                disabled={isSaving}
                onClick={() => setProductModal({ open: false, mode: 'create', id: null })}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmitProduct} className="vp-modal-form">
              <div className="vp-modal-body">
                {/* Product Name */}
                <div className="vp-form-group">
                  <label className="vp-form-label">Product Title / Name *</label>
                  <input
                    type="text"
                    className="vp-input"
                    placeholder="e.g., Premium Leather Messenger Bag"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>

                {/* Category & Brand */}
                <div className="vp-form-row">
                  <div className="vp-form-group">
                    <label className="vp-form-label">Category *</label>
                    <select
                      className="vp-select"
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      required
                    >
                      <option value="">Select a Category</option>
                      {categories.map((c) => (
                        <option key={c._id} value={c._id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="vp-form-group">
                    <label className="vp-form-label">Brand / Collection</label>
                    <input
                      type="text"
                      className="vp-input"
                      placeholder={user?.storeName || 'Custom Store'}
                      value={formData.brand}
                      onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                    />
                  </div>
                </div>

                {/* Price, Original Price & Stock */}
                <div className="vp-form-row-3">
                  <div className="vp-form-group">
                    <label className="vp-form-label">Selling Price (₹) *</label>
                    <input
                      type="number"
                      className="vp-input"
                      placeholder="999"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      required
                      min="0"
                    />
                  </div>

                  <div className="vp-form-group">
                    <label className="vp-form-label">Original Price (₹)</label>
                    <input
                      type="number"
                      className="vp-input"
                      placeholder="1499"
                      value={formData.originalPrice}
                      onChange={(e) => setFormData({ ...formData, originalPrice: e.target.value })}
                      min="0"
                    />
                  </div>

                  <div className="vp-form-group">
                    <label className="vp-form-label">Initial Stock *</label>
                    <input
                      type="number"
                      className="vp-input"
                      placeholder="20"
                      value={formData.stock}
                      onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                      required
                      min="0"
                    />
                  </div>
                </div>

                {/* Description */}
                <div className="vp-form-group">
                  <label className="vp-form-label">Product Description</label>
                  <textarea
                    className="vp-textarea"
                    placeholder="Describe materials, sizing, features, warranty, and care instructions..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={4}
                  />
                </div>

                {/* Product Images */}
                <div className="vp-form-group">
                  <label className="vp-form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Image size={16} /> Product Media & Photos
                  </label>

                  {/* Add by image URL */}
                  <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
                    <input
                      type="url"
                      className="vp-input"
                      placeholder="Paste external image URL (e.g. Unsplash, Cloudinary, AWS S3)..."
                      value={customImageUrl}
                      onChange={(e) => setCustomImageUrl(e.target.value)}
                    />
                    <button type="button" className="vp-btn vp-btn-secondary vp-btn-sm" onClick={handleAddImageUrl}>
                      Add URL
                    </button>
                    <label className="vp-btn vp-btn-secondary vp-btn-sm" style={{ cursor: 'pointer', margin: 0 }}>
                      <Upload size={14} /> Upload
                      <input type="file" accept="image/*" onChange={handleFileUpload} style={{ display: 'none' }} />
                    </label>
                  </div>

                  {/* Quick preset images */}
                  <div style={{ marginBottom: '1rem' }}>
                    <span style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block', marginBottom: '0.35rem' }}>
                      <Sparkles size={12} style={{ display: 'inline', marginRight: 4 }} />
                      Quick sample photos for testing:
                    </span>
                    <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                      {PRESET_IMAGES.map((img, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() =>
                            setFormData((prev) => ({
                              ...prev,
                              images: [...prev.images, img.url],
                            }))
                          }
                          style={{
                            background: 'rgba(30, 41, 59, 0.6)',
                            border: '1px solid rgba(148, 163, 184, 0.2)',
                            color: '#cbd5e1',
                            padding: '0.25rem 0.55rem',
                            borderRadius: '6px',
                            fontSize: '0.73rem',
                            cursor: 'pointer',
                          }}
                        >
                          + {img.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Images preview gallery */}
                  <div className="vp-image-preview-grid">
                    {formData.images.map((imgUrl, idx) => (
                      <div key={idx} className="vp-image-preview-item">
                        <img src={imgUrl} alt={`Product ${idx}`} />
                        <button
                          type="button"
                          className="vp-image-preview-remove"
                          onClick={() => handleRemoveImage(idx)}
                          title="Remove image"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Tags & Visibility Options */}
                <div className="vp-form-row">
                  <div className="vp-form-group">
                    <label className="vp-form-label">Search Tags (comma separated)</label>
                    <input
                      type="text"
                      className="vp-input"
                      placeholder="wireless, bluetooth, anc, soundcraft"
                      value={formData.tags}
                      onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                    />
                  </div>

                  <div className="vp-form-group" style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', paddingTop: '1.2rem' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', cursor: 'pointer', fontSize: '0.88rem' }}>
                      <input
                        type="checkbox"
                        checked={formData.isActive}
                        onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                        style={{ width: '18px', height: '18px', accentColor: '#10b981' }}
                      />
                      <span style={{ color: '#fff', fontWeight: 600 }}>
                        Active on Storefront (Shoppers can buy)
                      </span>
                    </label>

                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', cursor: 'pointer', fontSize: '0.85rem' }}>
                      <input
                        type="checkbox"
                        checked={formData.isFeatured}
                        onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })}
                        style={{ width: '18px', height: '18px', accentColor: '#6366f1' }}
                      />
                      <span style={{ color: '#cbd5e1' }}>Feature this product on homepage</span>
                    </label>
                  </div>
                </div>
              </div>

              <div
                className="vp-modal-footer"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '1.1rem 1.5rem',
                  background: '#0b1120',
                  borderTop: '1px solid rgba(148, 163, 184, 0.2)',
                  flexShrink: 0,
                  position: 'sticky',
                  bottom: 0,
                  zIndex: 20,
                }}
              >
                <button
                  type="button"
                  className="vp-btn vp-btn-secondary"
                  disabled={isSaving}
                  onClick={() => setProductModal({ open: false, mode: 'create', id: null })}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="vp-btn vp-btn-primary"
                  disabled={isSaving}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontWeight: 700,
                    padding: '0.75rem 1.75rem',
                    fontSize: '0.92rem',
                    boxShadow: '0 4px 18px rgba(99, 102, 241, 0.45)',
                  }}
                >
                  {isSaving ? (
                    <>
                      <RefreshCw size={16} className="animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Plus size={18} />
                      <span>{productModal.mode === 'create' ? 'Publish Product to Store' : 'Save Changes'}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================
          DELETE CONFIRMATION MODAL (Safe with order protection)
          ========================================================= */}
      {deleteModal.open && deleteModal.product && (
        <div
          className="vp-modal-backdrop"
          onClick={() =>
            !deleteModal.isDeleting &&
            setDeleteModal({ open: false, product: null, isDeleting: false, errorMessage: '' })
          }
        >
          <div className="vp-modal" style={{ maxWidth: '480px' }} onClick={(e) => e.stopPropagation()}>
            <div className="vp-modal-header">
              <h3 style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#f87171' }}>
                <AlertTriangle size={20} /> Delete Product
              </h3>
              <button
                className="vp-modal-close"
                disabled={deleteModal.isDeleting}
                onClick={() => setDeleteModal({ open: false, product: null, isDeleting: false, errorMessage: '' })}
              >
                <X size={20} />
              </button>
            </div>
            <div className="vp-modal-body" style={{ padding: '1.25rem 1.5rem' }}>
              {/* Product preview banner */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                  padding: '0.85rem 1rem',
                  background: 'rgba(30, 41, 59, 0.5)',
                  border: '1px solid rgba(148, 163, 184, 0.2)',
                  borderRadius: '12px',
                  marginBottom: '1.25rem',
                }}
              >
                <img
                  src={
                    deleteModal.product.images?.[0] ||
                    'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=100&q=80'
                  }
                  alt={deleteModal.product.name}
                  style={{ width: 52, height: 52, borderRadius: 8, objectFit: 'cover' }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontWeight: 700,
                      color: '#fff',
                      fontSize: '0.95rem',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {deleteModal.product.name}
                  </div>
                  <div style={{ fontSize: '0.82rem', color: '#94a3b8', marginTop: 2 }}>
                    Price:{' '}
                    <span style={{ color: '#34d399', fontWeight: 600 }}>
                      {formatPrice(deleteModal.product.price)}
                    </span>{' '}
                    • Stock: {deleteModal.product.stock} units
                  </div>
                </div>
              </div>

              {deleteModal.errorMessage ? (
                <div
                  style={{
                    background: 'rgba(239, 68, 68, 0.15)',
                    border: '1px solid rgba(239, 68, 68, 0.35)',
                    color: '#fca5a5',
                    padding: '0.85rem 1rem',
                    borderRadius: '10px',
                    fontSize: '0.86rem',
                    lineHeight: '1.45',
                    marginBottom: '1rem',
                  }}
                >
                  <div
                    style={{
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      marginBottom: 4,
                      color: '#f87171',
                    }}
                  >
                    <ShieldAlert size={16} /> Deletion Blocked
                  </div>
                  {deleteModal.errorMessage}
                  <div style={{ marginTop: '0.85rem' }}>
                    <button
                      type="button"
                      className="vp-btn vp-btn-secondary vp-btn-sm"
                      style={{
                        background: 'rgba(245, 158, 11, 0.2)',
                        border: '1px solid rgba(245, 158, 11, 0.4)',
                        color: '#fbbf24',
                        fontWeight: 600,
                      }}
                      onClick={() => handleToggleStatus(deleteModal.product._id, false)}
                    >
                      <Power size={14} /> Deactivate This Product Instead
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <p style={{ margin: '0 0 0.85rem', color: '#cbd5e1', fontSize: '0.92rem' }}>
                    Are you sure you want to delete <strong>"{deleteModal.product.name}"</strong>?
                  </p>
                  <div
                    style={{
                      background: 'rgba(15, 23, 42, 0.7)',
                      border: '1px solid rgba(148, 163, 184, 0.15)',
                      borderRadius: '8px',
                      padding: '0.75rem 0.9rem',
                      fontSize: '0.82rem',
                      color: '#94a3b8',
                      lineHeight: '1.45',
                    }}
                  >
                    ℹ️ <strong>Safety Protection:</strong>
                    <ul style={{ margin: '0.4rem 0 0 1.1rem', padding: 0 }}>
                      <li>
                        Products with pending orders cannot be deleted and must be deactivated instead.
                      </li>
                      <li>
                        Products with completed orders will be safely archived to protect order and receipt history.
                      </li>
                    </ul>
                  </div>
                </>
              )}
            </div>
            <div className="vp-modal-footer">
              <button
                type="button"
                className="vp-btn vp-btn-secondary"
                disabled={deleteModal.isDeleting}
                onClick={() =>
                  setDeleteModal({ open: false, product: null, isDeleting: false, errorMessage: '' })
                }
              >
                Cancel
              </button>
              <button
                type="button"
                className="vp-btn vp-btn-danger"
                disabled={deleteModal.isDeleting}
                onClick={handleDeleteProduct}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
              >
                {deleteModal.isDeleting ? (
                  <>
                    <RefreshCw size={15} className="animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 size={15} />
                    <span>Confirm Delete</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
