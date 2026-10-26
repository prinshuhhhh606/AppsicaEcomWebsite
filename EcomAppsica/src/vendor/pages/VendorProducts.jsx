import React, { useState, useEffect, useContext } from 'react';
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
  Sparkles
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

  // Modals
  const [productModal, setProductModal] = useState({
    open: false,
    mode: 'create', // 'create' | 'edit'
    id: null,
  });

  const [deleteModal, setDeleteModal] = useState({
    open: false,
    product: null,
  });

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
  });

  const [customImageUrl, setCustomImageUrl] = useState('');

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const [prodRes, catRes] = await Promise.all([
        vendorService.getProducts({
          search: searchTerm,
          category: selectedCategory,
          stockStatus: stockFilter,
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
  };

  useEffect(() => {
    loadData();
  }, [selectedCategory, stockFilter]);

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
      alert(err?.message || 'Failed to save product');
    }
  };

  // Confirm Delete Product
  const handleDeleteProduct = async () => {
    if (!deleteModal.product) return;
    try {
      await vendorService.deleteProduct(deleteModal.product._id);
      setSuccessMsg(`Product "${deleteModal.product.name}" deleted successfully.`);
      setDeleteModal({ open: false, product: null });
      loadData();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      alert(err?.message || 'Failed to delete product');
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
            Add, update inventory, manage pricing and publish items directly to Appsica Marketplace.
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
            placeholder="Search by product name, brand, SKU..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </form>

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
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
                  return (
                    <tr key={p._id}>
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
                        ) : (
                          <span className="vp-badge vp-badge-delivered">Live in Store</span>
                        )}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.4rem' }}>
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
                            className="vp-action-btn delete"
                            onClick={() => setDeleteModal({ open: true, product: p })}
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
          ADD / EDIT PRODUCT MODAL (Requirements 3, 4, 5)
          ========================================================= */}
      {productModal.open && (
        <div className="vp-modal-backdrop" onClick={() => setProductModal({ open: false, mode: 'create', id: null })}>
          <div className="vp-modal vp-modal-lg" onClick={(e) => e.stopPropagation()}>
            <div className="vp-modal-header">
              <h3>{productModal.mode === 'create' ? 'Add New Product to Store' : 'Edit Product Details'}</h3>
              <button
                className="vp-modal-close"
                onClick={() => setProductModal({ open: false, mode: 'create', id: null })}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmitProduct}>
              <div className="vp-modal-body">
                {/* Product Name */}
                <div className="vp-form-group">
                  <label className="vp-form-label">Product Name *</label>
                  <input
                    type="text"
                    required
                    className="vp-input"
                    placeholder="e.g. Wireless Noise-Cancelling Over-Ear Headphones"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>

                {/* Category & Brand */}
                <div className="vp-form-row">
                  <div className="vp-form-group">
                    <label className="vp-form-label">Category *</label>
                    <select
                      required
                      className="vp-select"
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    >
                      <option value="">Select Category</option>
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
                      placeholder={user?.storeName || 'Store Brand'}
                      value={formData.brand}
                      onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                    />
                  </div>
                </div>

                {/* Price, Original Price, Stock */}
                <div className="vp-form-row-3">
                  <div className="vp-form-group">
                    <label className="vp-form-label">Selling Price (₹) *</label>
                    <input
                      type="number"
                      required
                      min="1"
                      className="vp-input"
                      placeholder="1499"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    />
                  </div>

                  <div className="vp-form-group">
                    <label className="vp-form-label">Original / MRP (₹)</label>
                    <input
                      type="number"
                      min="1"
                      className="vp-input"
                      placeholder="1999"
                      value={formData.originalPrice}
                      onChange={(e) => setFormData({ ...formData, originalPrice: e.target.value })}
                    />
                  </div>

                  <div className="vp-form-group">
                    <label className="vp-form-label">Stock Quantity *</label>
                    <input
                      type="number"
                      required
                      min="0"
                      className="vp-input"
                      placeholder="25"
                      value={formData.stock}
                      onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                    />
                  </div>
                </div>

                {/* Description */}
                <div className="vp-form-group">
                  <label className="vp-form-label">Product Description</label>
                  <textarea
                    className="vp-textarea"
                    placeholder="Provide detailed description, specifications, features, warranty, and package contents..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>

                {/* IMAGE UPLOAD & GALLERY (Requirement 4) */}
                <div className="vp-form-group">
                  <label className="vp-form-label">Product Images & Gallery</label>

                  {/* Add Image Inputs */}
                  <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
                    <div style={{ flex: 1, minWidth: '240px' }}>
                      <input
                        type="url"
                        className="vp-input"
                        placeholder="Paste image URL (https://...)"
                        value={customImageUrl}
                        onChange={(e) => setCustomImageUrl(e.target.value)}
                      />
                    </div>
                    <button type="button" className="vp-btn vp-btn-secondary vp-btn-sm" onClick={handleAddImageUrl}>
                      <Plus size={15} /> Add URL
                    </button>

                    <label className="vp-btn vp-btn-secondary vp-btn-sm" style={{ cursor: 'pointer', margin: 0 }}>
                      <Upload size={15} /> Upload Local Image
                      <input type="file" accept="image/*" onChange={handleFileUpload} style={{ display: 'none' }} />
                    </label>
                  </div>

                  {/* Preset Suggestions */}
                  <div style={{ marginBottom: '0.75rem' }}>
                    <span style={{ fontSize: '0.74rem', color: '#94a3b8', display: 'block', marginBottom: '0.35rem' }}>
                      Quick image samples:
                    </span>
                    <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                      {PRESET_IMAGES.map((img, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            if (!formData.images.includes(img.url)) {
                              setFormData({ ...formData, images: [...formData.images, img.url] });
                            }
                          }}
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

                {/* Tags & Featured */}
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

                  <div className="vp-form-group" style={{ display: 'flex', alignItems: 'center', paddingTop: '1.5rem' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', cursor: 'pointer', fontSize: '0.88rem' }}>
                      <input
                        type="checkbox"
                        checked={formData.isFeatured}
                        onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })}
                        style={{ width: '18px', height: '18px', accentColor: '#6366f1' }}
                      />
                      <span style={{ color: '#fff', fontWeight: 500 }}>Feature this product on homepage</span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="vp-modal-footer">
                <button
                  type="button"
                  className="vp-btn vp-btn-secondary"
                  onClick={() => setProductModal({ open: false, mode: 'create', id: null })}
                >
                  Cancel
                </button>
                <button type="submit" className="vp-btn vp-btn-primary">
                  {productModal.mode === 'create' ? 'Publish Product' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================
          DELETE CONFIRMATION MODAL
          ========================================================= */}
      {deleteModal.open && deleteModal.product && (
        <div className="vp-modal-backdrop" onClick={() => setDeleteModal({ open: false, product: null })}>
          <div className="vp-modal" style={{ maxWidth: '440px' }} onClick={(e) => e.stopPropagation()}>
            <div className="vp-modal-header">
              <h3 style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#f87171' }}>
                <AlertTriangle size={20} /> Delete Product
              </h3>
              <button className="vp-modal-close" onClick={() => setDeleteModal({ open: false, product: null })}>
                <X size={20} />
              </button>
            </div>
            <div className="vp-modal-body">
              <p style={{ margin: '0 0 1rem', color: '#cbd5e1', fontSize: '0.92rem' }}>
                Are you sure you want to permanently delete <strong>"{deleteModal.product.name}"</strong>?
              </p>
              <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.82rem' }}>
                This action cannot be undone. All reviews associated with this product will also be removed.
              </p>
            </div>
            <div className="vp-modal-footer">
              <button
                type="button"
                className="vp-btn vp-btn-secondary"
                onClick={() => setDeleteModal({ open: false, product: null })}
              >
                Cancel
              </button>
              <button type="button" className="vp-btn vp-btn-danger" onClick={handleDeleteProduct}>
                Yes, Delete Product
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
