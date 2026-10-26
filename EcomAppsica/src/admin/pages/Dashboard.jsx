import React, { useState, useEffect } from 'react';
import {
  ShoppingBag,
  Package,
  Users,
  CreditCard,
  Plus,
  Trash2,
  Edit,
  Eye,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  Search,
  ExternalLink,
  Layers,
  X,
  Truck,
  FileText,
  Printer,
  RotateCcw,
  Check,
  ShieldCheck,
  Calendar,
  MapPin,
  Clock,
  ArrowRight
} from 'lucide-react';
import { adminService } from '../../services/adminService';
import { productService } from '../../services/productService';
import { orderService } from '../../services/orderService';
import { categoryService } from '../../services/categoryService';
import { paymentService } from '../../services/paymentService';
import { formatPrice } from '../../utils/formatPrice';
import './Dashboard.css';

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('overview'); // overview, orders, products, categories, customers, payments
  const [stats, setStats] = useState(null);
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Search & Filter States
  const [orderFilter, setOrderFilter] = useState('all');
  const [orderSearch, setOrderSearch] = useState('');
  const [productSearch, setProductSearch] = useState('');

  // Modals
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [productModal, setProductModal] = useState({ open: false, mode: 'create', data: null });
  const [categoryModal, setCategoryModal] = useState({ open: false });
  const [trackingModal, setTrackingModal] = useState({
    open: false,
    order: null,
    courierName: 'BlueDart Express',
    trackingNumber: '',
    estimatedDeliveryDate: '',
  });
  const [invoiceModal, setInvoiceModal] = useState({ open: false, order: null });
  const [shippingLabelModal, setShippingLabelModal] = useState({ open: false, order: null });

  // Forms
  const [productForm, setProductForm] = useState({
    name: '',
    category: '',
    price: '',
    originalPrice: '',
    stock: '',
    brand: '',
    description: '',
    images: '',
    isFeatured: false,
  });

  const [categoryForm, setCategoryForm] = useState({
    name: '',
    slug: '',
    description: '',
    image: '',
  });

  // Load all initial data from backend APIs
  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const [statsRes, ordersRes, productsRes, categoriesRes, customersRes, paymentsRes] = await Promise.all([
        adminService.getDashboardStats().catch(() => ({})),
        orderService.getAllOrders().catch(() => ({ orders: [] })),
        productService.getAll({ limit: 100 }).catch(() => ({ products: [] })),
        categoryService.getAll().catch(() => ({ categories: [] })),
        adminService.getCustomers().catch(() => ({ customers: [] })),
        paymentService.getAll().catch(() => ({ payments: [] })),
      ]);

      setStats(statsRes?.stats || statsRes?.data?.stats || statsRes?.data || statsRes || {});
      setOrders(ordersRes?.orders || ordersRes?.data?.orders || (Array.isArray(ordersRes) ? ordersRes : []));
      setProducts(productsRes?.products || productsRes?.data?.products || (Array.isArray(productsRes) ? productsRes : []));
      setCategories(categoriesRes?.categories || categoriesRes?.data?.categories || (Array.isArray(categoriesRes) ? categoriesRes : []));
      setCustomers(customersRes?.customers || customersRes?.data?.customers || (Array.isArray(customersRes) ? customersRes : []));
      setPayments(paymentsRes?.payments || paymentsRes?.data?.payments || (Array.isArray(paymentsRes) ? paymentsRes : []));
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Update order status with server-side validation
  const handleStatusChange = async (orderId, newStatus) => {
    try {
      const res = await orderService.updateStatus(orderId, newStatus);
      const updated = res?.order || res;
      setOrders((prev) =>
        prev.map((ord) => ((ord._id === orderId || ord.orderId === orderId) ? { ...ord, ...updated, orderStatus: newStatus } : ord))
      );
      setSuccessMsg(`Order status successfully updated to "${newStatus}"`);
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Failed to update order status');
      setTimeout(() => setError(''), 4000);
    }
  };

  // Verify Payment on Backend
  const handleVerifyPayment = async (orderId) => {
    try {
      const res = await orderService.verifyPayment(orderId);
      const updated = res?.order || res;
      setOrders((prev) =>
        prev.map((ord) => ((ord._id === orderId || ord.orderId === orderId) ? { ...ord, ...updated, paymentStatus: 'Paid' } : ord))
      );
      setSuccessMsg('Payment successfully verified and marked as Paid');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Failed to verify payment');
    }
  };

  // Open Tracking Modal
  const handleOpenTrackingModal = (order) => {
    setTrackingModal({
      open: true,
      order,
      courierName: order.courierName || 'BlueDart Express',
      trackingNumber: order.trackingNumber || `TRK-BD-${Date.now().toString().slice(-6)}`,
      estimatedDeliveryDate: order.estimatedDeliveryDate
        ? new Date(order.estimatedDeliveryDate).toISOString().slice(0, 10)
        : new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    });
  };

  // Save Tracking Details to Backend
  const handleSaveTracking = async (e) => {
    e.preventDefault();
    if (!trackingModal.order) return;
    try {
      const res = await orderService.updateTracking(trackingModal.order.orderId || trackingModal.order._id, {
        courierName: trackingModal.courierName,
        trackingNumber: trackingModal.trackingNumber,
        estimatedDeliveryDate: trackingModal.estimatedDeliveryDate,
        autoAdvanceStatus: true,
      });

      const updated = res?.order || res;
      setOrders((prev) =>
        prev.map((ord) =>
          ord._id === trackingModal.order._id || ord.orderId === trackingModal.order.orderId
            ? { ...ord, ...updated, courierName: trackingModal.courierName, trackingNumber: trackingModal.trackingNumber }
            : ord
        )
      );

      setSuccessMsg('Shipment tracking number and courier details updated!');
      setTrackingModal({ open: false, order: null, courierName: '', trackingNumber: '', estimatedDeliveryDate: '' });
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Failed to update tracking');
    }
  };

  // Cancel Order & Restore Stock
  const handleCancelOrder = async (orderId) => {
    const reason = window.prompt('Specify cancellation reason:');
    if (reason === null) return;
    try {
      await orderService.cancelOrder(orderId, reason || 'Cancelled by administrator');
      setOrders((prev) =>
        prev.map((ord) =>
          ord._id === orderId || ord.orderId === orderId ? { ...ord, orderStatus: 'Cancelled' } : ord
        )
      );
      setSuccessMsg('Order cancelled and inventory restored to stock.');
      setTimeout(() => setSuccessMsg(''), 3000);
      loadData(); // reload product stocks
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Could not cancel order');
    }
  };

  // Process Refund
  const handleRefundOrder = async (orderId) => {
    const reason = window.prompt('Specify refund reason:');
    if (reason === null) return;
    try {
      await orderService.processRefund(orderId, reason || 'Refund issued by admin');
      setOrders((prev) =>
        prev.map((ord) =>
          ord._id === orderId || ord.orderId === orderId
            ? { ...ord, paymentStatus: 'Refunded', orderStatus: 'Cancelled' }
            : ord
        )
      );
      setSuccessMsg('Refund processed and payment marked as Refunded.');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Could not process refund');
    }
  };

  // Product Actions
  const handleOpenProductModal = (mode = 'create', product = null) => {
    if (mode === 'edit' && product) {
      setProductForm({
        name: product.name || '',
        category: product.category?._id || product.category || '',
        price: product.price || '',
        originalPrice: product.originalPrice || '',
        stock: product.stock !== undefined ? product.stock : 20,
        brand: product.brand || '',
        description: product.description || '',
        images: Array.isArray(product.images) ? product.images.join(', ') : product.images || '',
        isFeatured: !!product.isFeatured,
      });
      setProductModal({ open: true, mode: 'edit', data: product });
    } else {
      setProductForm({
        name: '',
        category: categories[0]?._id || '',
        price: '',
        originalPrice: '',
        stock: 20,
        brand: 'Appsica Studio',
        description: '',
        images: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80',
        isFeatured: false,
      });
      setProductModal({ open: true, mode: 'create', data: null });
    }
  };

  const handleSaveProduct = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        name: productForm.name,
        category: productForm.category,
        price: Number(productForm.price),
        originalPrice: productForm.originalPrice ? Number(productForm.originalPrice) : Number(productForm.price),
        stock: Number(productForm.stock),
        brand: productForm.brand,
        description: productForm.description,
        images: productForm.images.split(',').map((s) => s.trim()).filter(Boolean),
        isFeatured: productForm.isFeatured,
      };

      if (productModal.mode === 'edit' && productModal.data) {
        const updated = await productService.update(productModal.data._id || productModal.data.id, payload);
        const prod = updated?.product || updated;
        setProducts((prev) => prev.map((p) => ((p._id || p.id) === (prod._id || prod.id) ? prod : p)));
        setSuccessMsg(`Product "${payload.name}" updated successfully!`);
      } else {
        const created = await productService.create(payload);
        const prod = created?.product || created;
        setProducts((prev) => [prod, ...prev]);
        setSuccessMsg(`Product "${payload.name}" created successfully!`);
      }

      setProductModal({ open: false, mode: 'create', data: null });
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Failed to save product');
    }
  };

  const handleDeleteProduct = async (productId, name) => {
    if (!window.confirm(`Are you sure you want to delete "${name}"?`)) return;
    try {
      await productService.delete(productId);
      setProducts((prev) => prev.filter((p) => (p._id || p.id) !== productId));
      setSuccessMsg(`Product "${name}" deleted.`);
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Failed to delete product');
    }
  };

  // Category Actions
  const handleSaveCategory = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        name: categoryForm.name,
        slug: categoryForm.slug || categoryForm.name.toLowerCase().replace(/\s+/g, '-'),
        description: categoryForm.description,
        image: categoryForm.image,
      };
      const res = await categoryService.create(payload);
      const cat = res?.category || res;
      setCategories((prev) => [...prev, cat]);
      setCategoryModal({ open: false });
      setCategoryForm({ name: '', slug: '', description: '', image: '' });
      setSuccessMsg(`Category "${payload.name}" created!`);
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Failed to save category');
    }
  };

  // Payment Refund Action
  const handleRefundPayment = async (paymentId) => {
    if (!window.confirm('Are you sure you want to refund this payment transaction?')) return;
    try {
      await paymentService.refund(paymentId);
      setPayments((prev) => prev.map((p) => (p._id === paymentId ? { ...p, status: 'refunded' } : p)));
      setSuccessMsg('Payment transaction refunded successfully.');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Failed to refund payment');
    }
  };

  // Compute Required 7 Summary Stats for Orders
  const orderStats = {
    total: orders.length,
    pending: orders.filter((o) => o.paymentStatus === 'Pending' || o.orderStatus === 'Order Placed').length,
    processing: orders.filter((o) => o.orderStatus === 'Processing').length,
    readyToShip: orders.filter((o) => o.orderStatus === 'Ready to Ship').length,
    shipped: orders.filter((o) => o.orderStatus === 'Shipped').length,
    delivered: orders.filter((o) => o.orderStatus === 'Delivered').length,
    cancelled: orders.filter((o) => o.orderStatus === 'Cancelled').length,
  };

  // Filtering Orders
  const filteredOrders = orders.filter((ord) => {
    const matchesFilter =
      orderFilter === 'all'
        ? true
        : orderFilter === 'pending'
        ? ord.paymentStatus === 'Pending' || ord.orderStatus === 'Order Placed'
        : (ord.orderStatus || '').toLowerCase() === orderFilter.toLowerCase();

    const matchesSearch =
      !orderSearch ||
      (ord.orderId && ord.orderId.toLowerCase().includes(orderSearch.toLowerCase())) ||
      (ord.shippingAddress?.fullName && ord.shippingAddress.fullName.toLowerCase().includes(orderSearch.toLowerCase())) ||
      (ord.shippingAddress?.phone && ord.shippingAddress.phone.includes(orderSearch)) ||
      (ord.transactionId && ord.transactionId.toLowerCase().includes(orderSearch.toLowerCase()));

    return matchesFilter && matchesSearch;
  });

  const filteredProducts = products.filter(
    (p) =>
      !productSearch ||
      p.name?.toLowerCase().includes(productSearch.toLowerCase()) ||
      p.brand?.toLowerCase().includes(productSearch.toLowerCase())
  );

  const lowStockProducts = products.filter((p) => p.stock !== undefined && p.stock <= 5);

  return (
    <div className="container admin-container">
      {/* Top Header */}
      <div className="admin-header">
        <div>
          <span className="eyebrow">APPSICA SECURE CONTROL PANEL</span>
          <h1>Admin Management Dashboard</h1>
          <p>Real-time order lifecycle, payment gateway audit, inventory stock control, and logistics tracking.</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="btn btn-secondary" onClick={loadData} title="Refresh Live Database Data">
            <RefreshCw size={16} className={loading ? 'spin-icon' : ''} /> Refresh
          </button>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div className="form-alert" style={{ marginBottom: '1.5rem' }}>
          <AlertTriangle size={18} /> {error}
        </div>
      )}
      {successMsg && (
        <div className="form-success" style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <CheckCircle size={18} /> {successMsg}
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="admin-tabs">
        <button className={`admin-tab-btn ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>
          <ShoppingBag size={17} /> Overview
        </button>
        <button className={`admin-tab-btn ${activeTab === 'orders' ? 'active' : ''}`} onClick={() => setActiveTab('orders')}>
          <Package size={17} /> Orders ({orders.length})
        </button>
        <button className={`admin-tab-btn ${activeTab === 'products' ? 'active' : ''}`} onClick={() => setActiveTab('products')}>
          <ShoppingBag size={17} /> Products & Stock ({products.length})
        </button>
        <button className={`admin-tab-btn ${activeTab === 'categories' ? 'active' : ''}`} onClick={() => setActiveTab('categories')}>
          <Layers size={17} /> Categories ({categories.length})
        </button>
        <button className={`admin-tab-btn ${activeTab === 'customers' ? 'active' : ''}`} onClick={() => setActiveTab('customers')}>
          <Users size={17} /> Customers ({customers.length})
        </button>
        <button className={`admin-tab-btn ${activeTab === 'payments' ? 'active' : ''}`} onClick={() => setActiveTab('payments')}>
          <CreditCard size={17} /> Payments ({payments.length})
        </button>
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <>
          <div className="admin-stat-grid">
            <article className="admin-stat-card">
              <span className="admin-stat-icon"><ShoppingBag size={22} /></span>
              <span className="admin-stat-label">Total Revenue</span>
              <strong>{formatPrice(stats?.totalSales || orders.reduce((sum, o) => sum + (o.total || 0), 0))}</strong>
            </article>
            <article className="admin-stat-card">
              <span className="admin-stat-icon"><Package size={22} /></span>
              <span className="admin-stat-label">Total Orders</span>
              <strong>{stats?.totalOrders ?? orders.length}</strong>
            </article>
            <article className="admin-stat-card">
              <span className="admin-stat-icon"><ShoppingBag size={22} /></span>
              <span className="admin-stat-label">Live Products</span>
              <strong>{stats?.totalProducts ?? products.length}</strong>
            </article>
            <article className="admin-stat-card">
              <span className="admin-stat-icon"><Users size={22} /></span>
              <span className="admin-stat-label">Registered Customers</span>
              <strong>{stats?.totalCustomers ?? customers.length}</strong>
            </article>
          </div>

          {/* Low Stock Alert Section */}
          {lowStockProducts.length > 0 && (
            <div className="admin-card" style={{ borderColor: 'rgba(245, 158, 11, 0.3)' }}>
              <div className="admin-card-header">
                <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#fbbf24' }}>
                  <AlertTriangle size={20} /> Low Inventory Alerts ({lowStockProducts.length} items)
                </h2>
                <button className="table-btn" onClick={() => setActiveTab('products')}>Manage All Stock</button>
              </div>
              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>Category</th>
                      <th>Price</th>
                      <th>Remaining Stock</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lowStockProducts.slice(0, 5).map((prod) => (
                      <tr key={prod._id || prod.id}>
                        <td>
                          <div className="product-meta">
                            <img src={prod.images?.[0] || 'https://placehold.co/100'} alt="" className="product-thumb" />
                            <div className="product-meta-text">
                              <b>{prod.name}</b>
                              <small>{prod.brand || 'Appsica'}</small>
                            </div>
                          </div>
                        </td>
                        <td>{prod.category?.name || 'General'}</td>
                        <td>{formatPrice(prod.price)}</td>
                        <td>
                          <span className={`stock-badge ${prod.stock === 0 ? 'out-stock' : 'low-stock'}`}>
                            {prod.stock === 0 ? 'Out of Stock' : `${prod.stock} units left`}
                          </span>
                        </td>
                        <td>
                          <button className="table-btn" onClick={() => handleOpenProductModal('edit', prod)}>Restock</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* TAB 2: ORDERS MANAGEMENT */}
      {activeTab === 'orders' && (
        <>
          {/* 7 Required Summary Metrics Cards */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
              gap: '1rem',
              marginBottom: '2rem',
            }}
          >
            <div
              className={`admin-stat-card ${orderFilter === 'all' ? 'active-filter' : ''}`}
              style={{ cursor: 'pointer', padding: '1rem' }}
              onClick={() => setOrderFilter('all')}
            >
              <span className="admin-stat-label">Total Orders</span>
              <strong style={{ fontSize: '1.6rem' }}>{orderStats.total}</strong>
            </div>

            <div
              className={`admin-stat-card ${orderFilter === 'pending' ? 'active-filter' : ''}`}
              style={{ cursor: 'pointer', padding: '1rem', borderColor: 'rgba(245, 158, 11, 0.4)' }}
              onClick={() => setOrderFilter('pending')}
            >
              <span className="admin-stat-label" style={{ color: '#fbbf24' }}>Pending</span>
              <strong style={{ fontSize: '1.6rem', color: '#fbbf24' }}>{orderStats.pending}</strong>
            </div>

            <div
              className={`admin-stat-card ${orderFilter === 'processing' ? 'active-filter' : ''}`}
              style={{ cursor: 'pointer', padding: '1rem', borderColor: 'rgba(99, 102, 241, 0.4)' }}
              onClick={() => setOrderFilter('Processing')}
            >
              <span className="admin-stat-label" style={{ color: '#818cf8' }}>Processing</span>
              <strong style={{ fontSize: '1.6rem', color: '#818cf8' }}>{orderStats.processing}</strong>
            </div>

            <div
              className={`admin-stat-card ${orderFilter === 'Ready to Ship' ? 'active-filter' : ''}`}
              style={{ cursor: 'pointer', padding: '1rem', borderColor: 'rgba(56, 189, 248, 0.4)' }}
              onClick={() => setOrderFilter('Ready to Ship')}
            >
              <span className="admin-stat-label" style={{ color: '#38bdf8' }}>Ready to Ship</span>
              <strong style={{ fontSize: '1.6rem', color: '#38bdf8' }}>{orderStats.readyToShip}</strong>
            </div>

            <div
              className={`admin-stat-card ${orderFilter === 'Shipped' ? 'active-filter' : ''}`}
              style={{ cursor: 'pointer', padding: '1rem', borderColor: 'rgba(168, 85, 247, 0.4)' }}
              onClick={() => setOrderFilter('Shipped')}
            >
              <span className="admin-stat-label" style={{ color: '#c084fc' }}>Shipped</span>
              <strong style={{ fontSize: '1.6rem', color: '#c084fc' }}>{orderStats.shipped}</strong>
            </div>

            <div
              className={`admin-stat-card ${orderFilter === 'Delivered' ? 'active-filter' : ''}`}
              style={{ cursor: 'pointer', padding: '1rem', borderColor: 'rgba(16, 185, 129, 0.4)' }}
              onClick={() => setOrderFilter('Delivered')}
            >
              <span className="admin-stat-label" style={{ color: '#34d399' }}>Delivered</span>
              <strong style={{ fontSize: '1.6rem', color: '#34d399' }}>{orderStats.delivered}</strong>
            </div>

            <div
              className={`admin-stat-card ${orderFilter === 'Cancelled' ? 'active-filter' : ''}`}
              style={{ cursor: 'pointer', padding: '1rem', borderColor: 'rgba(239, 68, 68, 0.4)' }}
              onClick={() => setOrderFilter('Cancelled')}
            >
              <span className="admin-stat-label" style={{ color: '#f87171' }}>Cancelled</span>
              <strong style={{ fontSize: '1.6rem', color: '#f87171' }}>{orderStats.cancelled}</strong>
            </div>
          </div>

          <div className="admin-card">
            <div className="admin-card-header">
              <h2>Orders Directory ({filteredOrders.length})</h2>
              <div className="admin-actions-bar">
                <input
                  type="text"
                  className="admin-search-input"
                  placeholder="Search by Order ID, Name, Phone..."
                  value={orderSearch}
                  onChange={(e) => setOrderSearch(e.target.value)}
                />
                <select className="admin-select" value={orderFilter} onChange={(e) => setOrderFilter(e.target.value)}>
                  <option value="all">All Statuses</option>
                  <option value="pending">Pending Orders</option>
                  <option value="Confirmed">Confirmed</option>
                  <option value="Processing">Processing</option>
                  <option value="Ready to Ship">Ready to Ship</option>
                  <option value="Shipped">Shipped</option>
                  <option value="Out for Delivery">Out for Delivery</option>
                  <option value="Delivered">Delivered</option>
                  <option value="Cancelled">Cancelled</option>
                  <option value="Returned">Returned</option>
                </select>
              </div>
            </div>

            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Order & Tracking</th>
                    <th>Customer Info</th>
                    <th>Total</th>
                    <th>Payment</th>
                    <th>Status Workflow</th>
                    <th>Management Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.map((ord) => {
                    const id = ord.orderId || ord._id;
                    const isPendingPayment = ord.paymentStatus === 'Pending';
                    const isPaid = ord.paymentStatus === 'Paid';

                    return (
                      <tr key={id}>
                        <td>
                          <b>#{ord.orderId}</b>
                          <div style={{ fontSize: '0.78rem', color: '#818cf8', marginTop: 2 }}>
                            {ord.courierName}: {ord.trackingNumber || 'No AWB yet'}
                          </div>
                          <small style={{ color: '#64748b' }}>
                            {new Date(ord.createdAt).toLocaleDateString()}
                          </small>
                        </td>

                        <td>
                          <div><b>{ord.shippingAddress?.fullName || ord.user?.name || 'Customer'}</b></div>
                          <small style={{ color: '#94a3b8' }}>
                            {ord.shippingAddress?.city}, {ord.shippingAddress?.state} ({ord.shippingAddress?.phone})
                          </small>
                        </td>

                        <td>
                          <b>{formatPrice(ord.total)}</b>
                          <small style={{ color: '#94a3b8', display: 'block' }}>{ord.items?.length || 1} item(s)</small>
                        </td>

                        <td>
                          <span
                            className="status-badge"
                            style={{
                              background: isPaid ? 'rgba(16,185,129,0.15)' : isPendingPayment ? 'rgba(245,158,11,0.15)' : 'rgba(239,68,68,0.15)',
                              color: isPaid ? '#34d399' : isPendingPayment ? '#fbbf24' : '#ef4444',
                            }}
                          >
                            {ord.paymentMethod?.toUpperCase()} · {ord.paymentStatus}
                          </span>
                          {isPendingPayment && (
                            <button
                              className="table-btn"
                              style={{ marginTop: 4, display: 'block', fontSize: '0.75rem', color: '#10b981', borderColor: 'rgba(16,185,129,0.3)' }}
                              onClick={() => handleVerifyPayment(ord.orderId || ord._id)}
                              title="Verify payment and mark as Paid"
                            >
                              Verify Payment
                            </button>
                          )}
                        </td>

                        <td>
                          <select
                            className="admin-select"
                            value={ord.orderStatus || 'Confirmed'}
                            onChange={(e) => handleStatusChange(ord.orderId || ord._id, e.target.value)}
                            style={{ fontSize: '0.85rem', padding: '0.35rem 0.6rem' }}
                          >
                            <option value="Order Placed">Order Placed</option>
                            <option value="Confirmed">Confirmed</option>
                            <option value="Processing">Processing</option>
                            <option value="Ready to Ship">Ready to Ship</option>
                            <option value="Shipped">Shipped</option>
                            <option value="Out for Delivery">Out for Delivery</option>
                            <option value="Delivered">Delivered</option>
                            <option value="Cancelled">Cancelled</option>
                            <option value="Returned">Returned</option>
                          </select>
                        </td>

                        <td>
                          <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                            {/* View Order Details */}
                            <button
                              className="table-btn"
                              onClick={() => setSelectedOrder(ord)}
                              title="Inspect full details, customer information, and live product stock"
                            >
                              <Eye size={13} /> Details
                            </button>

                            {/* Add / Edit Courier Tracking */}
                            <button
                              className="table-btn"
                              onClick={() => handleOpenTrackingModal(ord)}
                              title="Add or update courier name, tracking AWB number, and delivery date"
                            >
                              <Truck size={13} /> Courier
                            </button>

                            {/* Invoice Modal */}
                            <button
                              className="table-btn"
                              onClick={() => setInvoiceModal({ open: true, order: ord })}
                              title="Generate printable tax invoice"
                            >
                              <FileText size={13} /> Invoice
                            </button>

                            {/* Shipping Label Modal */}
                            <button
                              className="table-btn"
                              onClick={() => setShippingLabelModal({ open: true, order: ord })}
                              title="Create courier shipping label with barcode"
                            >
                              <Printer size={13} /> Label
                            </button>

                            {/* Customer Live Tracking Link */}
                            <a
                              href={`/track-order/${ord.orderId}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="table-btn"
                              title="Open live customer tracking view in new tab"
                              style={{ color: '#38bdf8', borderColor: 'rgba(56,189,248,0.3)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                            >
                              <ExternalLink size={13} /> Track
                            </a>

                            {/* Cancel Order */}
                            {ord.orderStatus !== 'Cancelled' && (
                              <button
                                className="table-btn delete"
                                onClick={() => handleCancelOrder(ord.orderId || ord._id)}
                                title="Cancel order and restore inventory stock"
                              >
                                Cancel
                              </button>
                            )}

                            {/* Refund Button */}
                            {ord.paymentStatus === 'Paid' && (
                              <button
                                className="table-btn delete"
                                style={{ color: '#f59e0b', borderColor: 'rgba(245,158,11,0.3)' }}
                                onClick={() => handleRefundOrder(ord.orderId || ord._id)}
                                title="Process refund to customer"
                              >
                                Refund
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredOrders.length === 0 && (
                    <tr>
                      <td colSpan="6" style={{ textAlign: 'center', padding: '2.5rem', color: '#94a3b8' }}>
                        No matching orders found in database.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* TAB 3: PRODUCTS & INVENTORY */}
      {activeTab === 'products' && (
        <div className="admin-card">
          <div className="admin-card-header">
            <h2>Product Catalog & Inventory ({filteredProducts.length})</h2>
            <div className="admin-actions-bar">
              <input
                type="text"
                className="admin-search-input"
                placeholder="Search products..."
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
              />
              <button className="btn btn-primary btn-sm" onClick={() => handleOpenProductModal('create')}>
                <Plus size={16} /> Add Product
              </button>
            </div>
          </div>

          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Category</th>
                  <th>Price</th>
                  <th>Stock Level</th>
                  <th>Rating</th>
                  <th>Featured</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((prod) => (
                  <tr key={prod._id || prod.id}>
                    <td>
                      <div className="product-meta">
                        <img src={prod.images?.[0] || 'https://placehold.co/100'} alt="" className="product-thumb" />
                        <div className="product-meta-text">
                          <b>{prod.name}</b>
                          <small>{prod.brand || 'Appsica'}</small>
                        </div>
                      </div>
                    </td>
                    <td>{prod.category?.name || 'General'}</td>
                    <td>
                      <b>{formatPrice(prod.price)}</b>
                      {prod.originalPrice > prod.price && (
                        <small style={{ color: '#94a3b8', textDecoration: 'line-through', marginLeft: 6 }}>
                          {formatPrice(prod.originalPrice)}
                        </small>
                      )}
                    </td>
                    <td>
                      <span className={`stock-badge ${prod.stock === 0 ? 'out-stock' : prod.stock <= 5 ? 'low-stock' : 'in-stock'}`}>
                        {prod.stock === 0 ? 'Out of Stock' : `${prod.stock} in stock`}
                      </span>
                    </td>
                    <td>★ {prod.rating || '5.0'}</td>
                    <td>{prod.isFeatured ? '★ Featured' : '—'}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button className="table-btn" onClick={() => handleOpenProductModal('edit', prod)}>
                          <Edit size={14} /> Edit
                        </button>
                        <button className="table-btn delete" onClick={() => handleDeleteProduct(prod._id || prod.id, prod.name)}>
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: CATEGORIES */}
      {activeTab === 'categories' && (
        <div className="admin-card">
          <div className="admin-card-header">
            <h2>Store Categories ({categories.length})</h2>
            <button className="btn btn-primary btn-sm" onClick={() => setCategoryModal({ open: true })}>
              <Plus size={16} /> Add Category
            </button>
          </div>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Category</th>
                  <th>Slug Key</th>
                  <th>Description</th>
                </tr>
              </thead>
              <tbody>
                {categories.map((c) => (
                  <tr key={c._id || c.slug}>
                    <td><b>{c.name}</b></td>
                    <td><code>{c.slug}</code></td>
                    <td>{c.description || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 5: CUSTOMERS */}
      {activeTab === 'customers' && (
        <div className="admin-card">
          <div className="admin-card-header">
            <h2>Customer Directory ({customers.length})</h2>
          </div>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Customer Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Account Role</th>
                  <th>Registration Date</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((c) => (
                  <tr key={c._id || c.email}>
                    <td><b>{c.name}</b></td>
                    <td>{c.email}</td>
                    <td>{c.phone || '—'}</td>
                    <td>
                      <span className={`status-badge ${c.role === 'admin' ? 'delivered' : 'processing'}`}>
                        {c.role || 'user'}
                      </span>
                    </td>
                    <td>{c.createdAt ? new Date(c.createdAt).toLocaleDateString() : 'Active'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 6: PAYMENTS */}
      {activeTab === 'payments' && (
        <div className="admin-card">
          <div className="admin-card-header">
            <h2>Gateway Payment Transactions ({payments.length})</h2>
          </div>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Transaction ID</th>
                  <th>Order Reference</th>
                  <th>Amount</th>
                  <th>Method</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => (
                  <tr key={p._id || p.transactionId}>
                    <td><b>{p.transactionId}</b></td>
                    <td>#{p.order?.orderId || p.order?._id || 'Direct'}</td>
                    <td><b>{formatPrice(p.amount)}</b></td>
                    <td>{p.paymentMethod?.toUpperCase()}</td>
                    <td>
                      <span className={`status-badge ${p.status === 'success' ? 'delivered' : p.status === 'refunded' ? 'cancelled' : 'processing'}`}>
                        {p.status}
                      </span>
                    </td>
                    <td>{p.createdAt ? new Date(p.createdAt).toLocaleString() : '—'}</td>
                    <td>
                      {p.status === 'success' && (
                        <button className="table-btn delete" onClick={() => handleRefundPayment(p._id)}>
                          Refund
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                {payments.length === 0 && (
                  <tr>
                    <td colSpan="7" style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>
                      No payment transactions recorded yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL 1: VIEW ORDER DETAILS (Includes Product Stock Check) */}
      {selectedOrder && (
        <div className="admin-modal-overlay" onClick={() => setSelectedOrder(null)}>
          <div className="admin-modal" style={{ maxWidth: 680 }} onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h3>Order Details: #{selectedOrder.orderId}</h3>
              <button className="modal-close-btn" onClick={() => setSelectedOrder(null)}>×</button>
            </div>
            <div>
              <div style={{ marginBottom: '1.25rem', padding: '1rem', background: 'rgba(255,255,255,0.03)', borderRadius: 8 }}>
                <p><b>Customer:</b> {selectedOrder.shippingAddress?.fullName || selectedOrder.user?.name} ({selectedOrder.user?.email || 'Guest'})</p>
                <p><b>Phone:</b> {selectedOrder.shippingAddress?.phone || 'N/A'}</p>
                <p><b>Shipping Address:</b> {selectedOrder.shippingAddress?.addressLine}, {selectedOrder.shippingAddress?.city}, {selectedOrder.shippingAddress?.state} - {selectedOrder.shippingAddress?.pincode}</p>
                <p><b>Payment Status:</b> <span style={{ color: selectedOrder.paymentStatus === 'Paid' ? '#34d399' : '#fbbf24', fontWeight: 'bold' }}>{selectedOrder.paymentStatus}</span> ({selectedOrder.paymentMethod?.toUpperCase()})</p>
                <p><b>Transaction Ref:</b> <code>{selectedOrder.transactionId || 'N/A'}</code></p>
                <p><b>Courier & Tracking:</b> {selectedOrder.courierName || 'BlueDart'} · <code>{selectedOrder.trackingNumber || 'Pending'}</code></p>
              </div>

              <h4 style={{ color: '#f8fafc', marginBottom: '0.75rem' }}>Purchased Items & Live Inventory Status</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.25rem' }}>
                {selectedOrder.items?.map((item, idx) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', background: 'rgba(255,255,255,0.02)', borderRadius: 6 }}>
                    <div>
                      <b style={{ color: '#f8fafc' }}>{item.name}</b>
                      <div style={{ color: '#94a3b8', fontSize: '0.85rem' }}>
                        Qty: {item.quantity} × {formatPrice(item.price)}
                        {/* Real-time Product Stock Level Check */}
                        {item.product?.stock !== undefined && (
                          <span style={{ marginLeft: 10, color: item.product.stock > 0 ? '#10b981' : '#ef4444' }}>
                            (Current Stock in Store: {item.product.stock} units)
                          </span>
                        )}
                      </div>
                    </div>
                    <b>{formatPrice(item.price * item.quantity)}</b>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '1rem' }}>
                <span style={{ fontSize: '1.1rem', fontWeight: 600 }}>Total Order Amount</span>
                <span style={{ fontSize: '1.3rem', fontWeight: 700, color: '#818cf8' }}>{formatPrice(selectedOrder.total)}</span>
              </div>
            </div>
            <div className="admin-modal-actions">
              <button className="btn btn-secondary" onClick={() => setSelectedOrder(null)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: ADD / EDIT COURIER TRACKING */}
      {trackingModal.open && (
        <div className="admin-modal-overlay" onClick={() => setTrackingModal({ ...trackingModal, open: false })}>
          <div className="admin-modal" style={{ maxWidth: 480 }} onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h3>Shipment Logistics: #{trackingModal.order?.orderId}</h3>
              <button className="modal-close-btn" onClick={() => setTrackingModal({ ...trackingModal, open: false })}>×</button>
            </div>
            <form onSubmit={handleSaveTracking}>
              <div className="admin-form-group">
                <label>Courier Service Partner *</label>
                <select
                  className="admin-select"
                  style={{ width: '100%', marginBottom: '1rem' }}
                  value={trackingModal.courierName}
                  onChange={(e) => setTrackingModal({ ...trackingModal, courierName: e.target.value })}
                >
                  <option value="BlueDart Express">BlueDart Express</option>
                  <option value="Delhivery Logistics">Delhivery Logistics</option>
                  <option value="DTDC Courier">DTDC Courier</option>
                  <option value="FedEx India">FedEx India</option>
                  <option value="India Post EMS">India Post EMS</option>
                  <option value="Shadowfax">Shadowfax</option>
                </select>
              </div>

              <div className="admin-form-group">
                <label>Tracking Number / Waybill (AWB) *</label>
                <input
                  required
                  type="text"
                  value={trackingModal.trackingNumber}
                  onChange={(e) => setTrackingModal({ ...trackingModal, trackingNumber: e.target.value })}
                  placeholder="e.g. TRK-BD-89342981"
                />
              </div>

              <div className="admin-form-group">
                <label>Estimated Delivery Date *</label>
                <input
                  required
                  type="date"
                  value={trackingModal.estimatedDeliveryDate}
                  onChange={(e) => setTrackingModal({ ...trackingModal, estimatedDeliveryDate: e.target.value })}
                />
              </div>

              <div className="admin-modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setTrackingModal({ ...trackingModal, open: false })}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Update Logistics & Dispatch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: INVOICE GENERATOR */}
      {invoiceModal.open && invoiceModal.order && (
        <div className="admin-modal-overlay" onClick={() => setInvoiceModal({ open: false, order: null })}>
          <div className="admin-modal" style={{ maxWidth: 680, padding: 0 }} onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header" style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
              <h2>Tax Invoice #{invoiceModal.order.invoiceNumber || invoiceModal.order.orderId}</h2>
              <button className="admin-modal-close" onClick={() => setInvoiceModal({ open: false, order: null })}>✕</button>
            </div>
            <div style={{ padding: '1.75rem', maxHeight: '70vh', overflowY: 'auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '1rem' }}>
                <div>
                  <h3 style={{ margin: 0, color: '#818cf8', fontSize: '1.4rem' }}>APPSICA STORE</h3>
                  <small style={{ color: '#94a3b8' }}>Tax Invoice / Bill of Supply</small>
                  <p style={{ margin: '0.5rem 0 0', color: '#94a3b8', fontSize: '0.85rem' }}>
                    GSTIN: 07AABCA1234F1Z5<br />
                    Bangalore, Karnataka, India
                  </p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <b style={{ color: '#f8fafc' }}>Invoice: {invoiceModal.order.invoiceNumber || `INV-${invoiceModal.order.orderId}`}</b>
                  <p style={{ margin: '0.25rem 0 0', color: '#94a3b8', fontSize: '0.85rem' }}>
                    Order ID: #{invoiceModal.order.orderId}<br />
                    Date: {new Date(invoiceModal.order.createdAt).toLocaleDateString()}<br />
                    Payment: <strong style={{ color: invoiceModal.order.paymentStatus === 'Paid' ? '#34d399' : '#fbbf24' }}>{invoiceModal.order.paymentStatus}</strong>
                  </p>
                </div>
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <span style={{ fontSize: '0.8rem', color: '#94a3b8', textTransform: 'uppercase' }}>Billed & Shipped To:</span>
                <p style={{ margin: '0.25rem 0 0', color: '#f1f5f9', fontSize: '0.9rem' }}>
                  <strong>{invoiceModal.order.shippingAddress?.fullName}</strong><br />
                  {invoiceModal.order.shippingAddress?.addressLine}<br />
                  {invoiceModal.order.shippingAddress?.city}, {invoiceModal.order.shippingAddress?.state} - {invoiceModal.order.shippingAddress?.pincode}<br />
                  Phone: {invoiceModal.order.shippingAddress?.phone}
                </p>
              </div>

              <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
                <thead>
                  <tr style={{ background: 'rgba(255,255,255,0.04)', color: '#94a3b8', textAlign: 'left' }}>
                    <th style={{ padding: '0.65rem 0.75rem' }}>Item</th>
                    <th style={{ padding: '0.65rem 0.75rem', textAlign: 'center' }}>Qty</th>
                    <th style={{ padding: '0.65rem 0.75rem', textAlign: 'right' }}>Rate</th>
                    <th style={{ padding: '0.65rem 0.75rem', textAlign: 'right' }}>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {invoiceModal.order.items?.map((it, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                      <td style={{ padding: '0.65rem 0.75rem', color: '#f8fafc' }}>{it.name}</td>
                      <td style={{ padding: '0.65rem 0.75rem', textAlign: 'center', color: '#cbd5e1' }}>{it.quantity}</td>
                      <td style={{ padding: '0.65rem 0.75rem', textAlign: 'right', color: '#cbd5e1' }}>{formatPrice(it.price)}</td>
                      <td style={{ padding: '0.65rem 0.75rem', textAlign: 'right', color: '#f8fafc', fontWeight: 600 }}>
                        {formatPrice(it.price * it.quantity)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div style={{ width: 260, marginLeft: 'auto', fontSize: '0.9rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.35rem 0', color: '#94a3b8' }}>
                  <span>Subtotal:</span>
                  <span>{formatPrice(invoiceModal.order.subtotal)}</span>
                </div>
                {invoiceModal.order.discount > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.35rem 0', color: '#34d399' }}>
                    <span>Discount:</span>
                    <span>-{formatPrice(invoiceModal.order.discount)}</span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.35rem 0', color: '#94a3b8' }}>
                  <span>Delivery Charges:</span>
                  <span>{invoiceModal.order.delivery === 0 ? 'Free' : formatPrice(invoiceModal.order.delivery)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem 0 0', borderTop: '1px solid rgba(255,255,255,0.1)', color: '#f8fafc', fontWeight: 'bold', fontSize: '1.1rem' }}>
                  <span>Grand Total:</span>
                  <span style={{ color: '#818cf8' }}>{formatPrice(invoiceModal.order.total)}</span>
                </div>
              </div>
            </div>

            <div style={{ padding: '1rem 1.5rem', background: 'rgba(255,255,255,0.02)', borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
              <button className="btn btn-primary" onClick={() => window.print()} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <Printer size={16} /> Print Tax Invoice
              </button>
              <button className="btn btn-secondary" onClick={() => setInvoiceModal({ open: false, order: null })}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: SHIPPING LABEL GENERATOR */}
      {shippingLabelModal.open && shippingLabelModal.order && (
        <div className="admin-modal-overlay" onClick={() => setShippingLabelModal({ open: false, order: null })}>
          <div className="admin-modal" style={{ maxWidth: 540, padding: 0 }} onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header" style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
              <h2>Courier Shipping Label</h2>
              <button className="admin-modal-close" onClick={() => setShippingLabelModal({ open: false, order: null })}>✕</button>
            </div>

            <div style={{ padding: '2rem' }}>
              <div style={{ border: '2px solid #fff', padding: '1.5rem', borderRadius: 8, background: '#fff', color: '#000' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #000', paddingBottom: '0.75rem' }}>
                  <div>
                    <h2 style={{ margin: 0, fontSize: '1.3rem', color: '#000' }}>{shippingLabelModal.order.courierName || 'BlueDart Express'}</h2>
                    <small style={{ fontWeight: 'bold' }}>PREMIUM SURFACE AIR EXPEDITE</small>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#000' }}>
                      {shippingLabelModal.order.paymentMethod === 'cod' ? 'C.O.D.' : 'PREPAID'}
                    </h3>
                    <small>Collect: {shippingLabelModal.order.paymentMethod === 'cod' ? formatPrice(shippingLabelModal.order.total) : '₹0'}</small>
                  </div>
                </div>

                {/* Barcode representation */}
                <div style={{ textAlign: 'center', margin: '1.25rem 0', padding: '0.5rem', background: '#f1f5f9' }}>
                  <div style={{ fontFamily: 'monospace', letterSpacing: 3, fontSize: '1.5rem', fontWeight: 900 }}>
                    ||| | ||||| |||| || |||||| | ||||
                  </div>
                  <small style={{ fontFamily: 'monospace', fontWeight: 'bold' }}>
                    AWB: {shippingLabelModal.order.trackingNumber || `TRK-${shippingLabelModal.order.orderId}`}
                  </small>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', borderTop: '1px solid #000', paddingTop: '0.75rem', fontSize: '0.85rem' }}>
                  <div>
                    <b>SHIP FROM:</b><br />
                    Appsica Fulfillment Center Hub #4<br />
                    Whitefield, Bangalore - 560066<br />
                    Karnataka, India
                  </div>
                  <div>
                    <b>DELIVER TO:</b><br />
                    <strong>{shippingLabelModal.order.shippingAddress?.fullName}</strong><br />
                    {shippingLabelModal.order.shippingAddress?.addressLine}<br />
                    {shippingLabelModal.order.shippingAddress?.city}, {shippingLabelModal.order.shippingAddress?.state}<br />
                    <b>PIN: {shippingLabelModal.order.shippingAddress?.pincode}</b><br />
                    Phone: {shippingLabelModal.order.shippingAddress?.phone}
                  </div>
                </div>

                <div style={{ marginTop: '1rem', borderTop: '1px dashed #000', paddingTop: '0.5rem', fontSize: '0.8rem', display: 'flex', justifyContent: 'space-between' }}>
                  <span>Order Ref: #{shippingLabelModal.order.orderId}</span>
                  <span>Items: {shippingLabelModal.order.items?.length || 1} | Wt: 0.85 kg</span>
                </div>
              </div>
            </div>

            <div style={{ padding: '1rem 1.5rem', background: 'rgba(255,255,255,0.02)', borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
              <button className="btn btn-primary" onClick={() => window.print()} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <Printer size={16} /> Print Shipping Label
              </button>
              <button className="btn btn-secondary" onClick={() => setShippingLabelModal({ open: false, order: null })}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 5: ADD / EDIT PRODUCT */}
      {productModal.open && (
        <div className="admin-modal-overlay" onClick={() => setProductModal({ open: false, mode: 'create', data: null })}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h3>{productModal.mode === 'edit' ? 'Edit Product' : 'Add New Product'}</h3>
              <button className="modal-close-btn" onClick={() => setProductModal({ open: false, mode: 'create', data: null })}>×</button>
            </div>
            <form onSubmit={handleSaveProduct}>
              <div className="admin-form-group">
                <label>Product Name *</label>
                <input
                  required
                  type="text"
                  value={productForm.name}
                  onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                  placeholder="e.g. Wireless ANC Headphones"
                />
              </div>

              <div className="admin-form-grid">
                <div className="admin-form-group">
                  <label>Category *</label>
                  <select
                    required
                    value={productForm.category}
                    onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
                  >
                    <option value="">Select Category</option>
                    {categories.map((c) => (
                      <option key={c._id || c.id} value={c._id || c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div className="admin-form-group">
                  <label>Brand</label>
                  <input
                    type="text"
                    value={productForm.brand}
                    onChange={(e) => setProductForm({ ...productForm, brand: e.target.value })}
                    placeholder="e.g. SoundCraft"
                  />
                </div>
              </div>

              <div className="admin-form-grid">
                <div className="admin-form-group">
                  <label>Sale Price (₹) *</label>
                  <input
                    required
                    type="number"
                    min="1"
                    value={productForm.price}
                    onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                    placeholder="2999"
                  />
                </div>
                <div className="admin-form-group">
                  <label>Original / MRP Price (₹)</label>
                  <input
                    type="number"
                    min="1"
                    value={productForm.originalPrice}
                    onChange={(e) => setProductForm({ ...productForm, originalPrice: e.target.value })}
                    placeholder="3999"
                  />
                </div>
              </div>

              <div className="admin-form-grid">
                <div className="admin-form-group">
                  <label>Inventory Stock *</label>
                  <input
                    required
                    type="number"
                    min="0"
                    value={productForm.stock}
                    onChange={(e) => setProductForm({ ...productForm, stock: e.target.value })}
                    placeholder="25"
                  />
                </div>
                <div className="admin-form-group">
                  <label>Featured in Storefront</label>
                  <select
                    value={productForm.isFeatured ? 'true' : 'false'}
                    onChange={(e) => setProductForm({ ...productForm, isFeatured: e.target.value === 'true' })}
                  >
                    <option value="false">No</option>
                    <option value="true">Yes (Show on Homepage)</option>
                  </select>
                </div>
              </div>

              <div className="admin-form-group">
                <label>Image URLs (comma-separated)</label>
                <input
                  type="text"
                  value={productForm.images}
                  onChange={(e) => setProductForm({ ...productForm, images: e.target.value })}
                  placeholder="https://images.unsplash.com/photo-..."
                />
              </div>

              <div className="admin-form-group">
                <label>Description</label>
                <textarea
                  rows="3"
                  value={productForm.description}
                  onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                  placeholder="Detailed product specifications..."
                />
              </div>

              <div className="admin-modal-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setProductModal({ open: false, mode: 'create', data: null })}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {productModal.mode === 'edit' ? 'Update Product' : 'Create Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 6: ADD CATEGORY */}
      {categoryModal.open && (
        <div className="admin-modal-overlay" onClick={() => setCategoryModal({ open: false })}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h3>Add New Category</h3>
              <button className="modal-close-btn" onClick={() => setCategoryModal({ open: false })}>×</button>
            </div>
            <form onSubmit={handleSaveCategory}>
              <div className="admin-form-group">
                <label>Category Name *</label>
                <input
                  required
                  type="text"
                  value={categoryForm.name}
                  onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                  placeholder="e.g. Footwear"
                />
              </div>
              <div className="admin-form-group">
                <label>Slug (URL key)</label>
                <input
                  type="text"
                  value={categoryForm.slug}
                  onChange={(e) => setCategoryForm({ ...categoryForm, slug: e.target.value })}
                  placeholder="e.g. footwear"
                />
              </div>
              <div className="admin-form-group">
                <label>Description</label>
                <textarea
                  rows="2"
                  value={categoryForm.description}
                  onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                  placeholder="Category description..."
                />
              </div>
              <div className="admin-form-group">
                <label>Image URL</label>
                <input
                  type="text"
                  value={categoryForm.image}
                  onChange={(e) => setCategoryForm({ ...categoryForm, image: e.target.value })}
                  placeholder="https://..."
                />
              </div>
              <div className="admin-modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setCategoryModal({ open: false })}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">Save Category</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}