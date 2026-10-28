import React, { useState, useEffect } from 'react';
import {
  ShoppingBag,
  Search,
  CheckCircle,
  AlertTriangle,
  Eye,
  Truck,
  RotateCcw,
  Check,
  FileText,
  Printer,
  Calendar,
  DollarSign,
  MapPin,
  Clock,
  ArrowRight,
  X,
  RefreshCw,
  Bike,
} from 'lucide-react';
import { orderService } from '../../../services/orderService';
import { adminService } from '../../../services/adminService';
import { formatPrice } from '../../../utils/formatPrice';

export default function OrderList() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Filters
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');

  // Modals
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [trackingModal, setTrackingModal] = useState({
    open: false,
    order: null,
    courierName: 'BlueDart Express',
    trackingNumber: '',
    estimatedDeliveryDate: '',
  });
  const [invoiceModal, setInvoiceModal] = useState({ open: false, order: null });
  const [labelModal, setLabelModal] = useState({ open: false, order: null });
  const [deliveryPartners, setDeliveryPartners] = useState([]);
  const [assignModal, setAssignModal] = useState({ open: false, order: null, deliveryPartnerId: '', deliveryFee: 50 });
  const [assigning, setAssigning] = useState(false);

  const loadOrders = async (silent = false) => {
    if (!silent) setLoading(true);
    setError('');
    try {
      const [orderRes, partnerRes] = await Promise.all([
        orderService.getAllOrders(),
        adminService.getDeliveryPartners().catch(() => ({ partners: [] })),
      ]);
      setOrders(orderRes?.orders || (Array.isArray(orderRes) ? orderRes : []));
      setDeliveryPartners(partnerRes?.partners || []);
    } catch (err) {
      if (!silent) setError(err?.response?.data?.message || err?.message || 'Failed to load order lifecycle');
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
    const interval = setInterval(() => {
      loadOrders(true);
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  const handleAssignDeliverySubmit = async (e) => {
    e.preventDefault();
    if (!assignModal.order) return;
    setAssigning(true);

    try {
      const res = await adminService.assignOrderDelivery(
        assignModal.order.orderId || assignModal.order._id,
        assignModal.deliveryPartnerId,
        assignModal.deliveryFee
      );
      if (res?.success) {
        setSuccess(`Delivery for Order #${assignModal.order.orderId} assigned!`);
        setOrders((prev) =>
          prev.map((o) => (o._id === assignModal.order._id ? { ...o, ...res.order } : o))
        );
        setAssignModal({ open: false, order: null, deliveryPartnerId: '', deliveryFee: 50 });
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to assign delivery');
    } finally {
      setAssigning(false);
    }
  };

  // Update Status
  const handleStatusChange = async (orderId, newStatus) => {
    try {
      const res = await orderService.updateStatus(orderId, newStatus);
      const updated = res?.order || res;
      setOrders((prev) =>
        prev.map((o) => (o._id === orderId || o.orderId === orderId ? { ...o, ...updated, orderStatus: newStatus } : o))
      );
      if (selectedOrder && (selectedOrder._id === orderId || selectedOrder.orderId === orderId)) {
        setSelectedOrder((prev) => ({ ...prev, ...updated, orderStatus: newStatus }));
      }
      setSuccess(`Order status updated to "${newStatus}"!`);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Status update failed');
      setTimeout(() => setError(''), 4000);
    }
  };

  // Verify Payment
  const handleVerifyPayment = async (orderId) => {
    try {
      const res = await orderService.verifyPayment(orderId);
      const updated = res?.order || res;
      setOrders((prev) =>
        prev.map((o) => (o._id === orderId || o.orderId === orderId ? { ...o, ...updated, paymentStatus: 'Paid' } : o))
      );
      setSuccess('Payment verified and verified in audit records!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Payment verification failed');
    }
  };

  // Open Tracking Modal
  const handleOpenTracking = (order) => {
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

  // Save Tracking
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
        prev.map((o) =>
          o._id === trackingModal.order._id || o.orderId === trackingModal.order.orderId
            ? { ...o, ...updated, courierName: trackingModal.courierName, trackingNumber: trackingModal.trackingNumber, orderStatus: 'Shipped' }
            : o
        )
      );

      setSuccess('Courier tracking number recorded and dispatch notification triggered!');
      setTrackingModal({ open: false, order: null, courierName: '', trackingNumber: '', estimatedDeliveryDate: '' });
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Failed to update tracking');
    }
  };

  // Cancel order & restore stock
  const handleCancel = async (orderId) => {
    const reason = window.prompt('Specify cancellation reason:', 'Cancelled by administrator due to stock anomaly or customer request');
    if (reason === null) return;

    try {
      await orderService.cancelOrder(orderId, reason);
      setOrders((prev) =>
        prev.map((o) => (o._id === orderId || o.orderId === orderId ? { ...o, orderStatus: 'Cancelled' } : o))
      );
      setSuccess('Order cancelled and inventory units restored to live stock!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Cancellation failed');
    }
  };

  // Process Refund
  const handleRefund = async (orderId) => {
    const reason = window.prompt('Specify refund transaction justification:', 'Full refund issued via admin portal');
    if (reason === null) return;

    try {
      await orderService.processRefund(orderId, reason);
      setOrders((prev) =>
        prev.map((o) =>
          o._id === orderId || o.orderId === orderId
            ? { ...o, paymentStatus: 'Refunded', orderStatus: 'Cancelled' }
            : o
        )
      );
      setSuccess('Refund issued and payment marked as Refunded.');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Refund processing failed');
    }
  };

  // Stats calculation
  const orderStats = {
    total: orders.length,
    pending: orders.filter((o) => o.paymentStatus === 'Pending' || o.orderStatus === 'Order Placed').length,
    processing: orders.filter((o) => o.orderStatus === 'Processing' || o.orderStatus === 'Confirmed').length,
    shipped: orders.filter((o) => o.orderStatus === 'Shipped').length,
    delivered: orders.filter((o) => o.orderStatus === 'Delivered').length,
    cancelled: orders.filter((o) => o.orderStatus === 'Cancelled').length,
  };

  // Filter
  const filtered = orders.filter((ord) => {
    const q = search.toLowerCase();
    const matchesSearch =
      !search ||
      ord.orderId?.toLowerCase().includes(q) ||
      ord.shippingAddress?.fullName?.toLowerCase().includes(q) ||
      ord.shippingAddress?.phone?.includes(q) ||
      ord.transactionId?.toLowerCase().includes(q);

    const matchesStatus =
      statusFilter === 'all'
        ? true
        : statusFilter === 'pending'
        ? ord.paymentStatus === 'Pending' || ord.orderStatus === 'Order Placed'
        : (ord.orderStatus || '').toLowerCase() === statusFilter.toLowerCase();

    return matchesSearch && matchesStatus;
  });

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0, color: '#f8fafc' }}>
            Order Lifecycle & Dispatch Fulfillment ({orders.length})
          </h2>
          <p style={{ margin: '0.2rem 0 0', fontSize: '0.85rem', color: '#94a3b8' }}>
            Full state machine transitions, waybill tracking integration, gateway payment verifications, and invoices.
          </p>
        </div>
        <button className="admin-btn admin-btn-secondary" onClick={loadOrders}>
          <RefreshCw size={15} className={loading ? 'spin-icon' : ''} /> Refresh
        </button>
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

      {/* QUICK STATUS PILLS */}
      <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.5rem', marginBottom: '1.25rem' }}>
        {[
          { key: 'all', label: 'All Orders', count: orderStats.total },
          { key: 'pending', label: 'Pending Payment', count: orderStats.pending },
          { key: 'processing', label: 'Processing', count: orderStats.processing },
          { key: 'shipped', label: 'Shipped', count: orderStats.shipped },
          { key: 'delivered', label: 'Delivered', count: orderStats.delivered },
          { key: 'cancelled', label: 'Cancelled', count: orderStats.cancelled },
        ].map((pill) => (
          <button
            key={pill.key}
            onClick={() => setStatusFilter(pill.key)}
            style={{
              background: statusFilter === pill.key ? '#6366f1' : 'rgba(255,255,255,0.04)',
              color: statusFilter === pill.key ? '#fff' : '#cbd5e1',
              border: '1px solid ' + (statusFilter === pill.key ? '#6366f1' : 'var(--ap-border)'),
              padding: '0.45rem 0.85rem',
              borderRadius: '20px',
              fontSize: '0.8rem',
              fontWeight: 600,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
            }}
          >
            <span>{pill.label}</span>
            <span style={{ background: 'rgba(0,0,0,0.3)', padding: '0.1rem 0.45rem', borderRadius: '10px', fontSize: '0.72rem' }}>
              {pill.count}
            </span>
          </button>
        ))}
      </div>

      {/* Search Bar */}
      <div className="admin-filter-bar" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div className="admin-search-box">
          <Search size={16} className="admin-search-icon" />
          <input
            type="text"
            className="admin-search-input"
            placeholder="Search by Order ID (ORD-...), customer name, phone, or txn..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.74rem',
              color: '#34d399',
              background: 'rgba(16, 185, 129, 0.1)',
              padding: '0.25rem 0.65rem',
              borderRadius: '999px',
              border: '1px solid rgba(16, 185, 129, 0.25)',
              fontWeight: 600,
            }}
          >
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: '#10b981',
                display: 'inline-block',
                boxShadow: '0 0 6px #10b981',
              }}
            />
            Live Feed (8s)
          </span>
        </div>
      </div>

      {/* Orders Table */}
      <div className="admin-table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Order ID</th>
              <th>Customer</th>
              <th>Items & Multi-Vendor</th>
              <th>Total Amount</th>
              <th>Payment</th>
              <th>Order Status</th>
              <th>Logistics Courier</th>
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
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan="8" style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
                  No orders match your filter criteria.
                </td>
              </tr>
            ) : (
              filtered.map((ord) => {
                const totalItems = (ord.items || []).reduce((acc, i) => acc + (i.quantity || 1), 0);
                const vendorNames = [
                  ...new Set(
                    (ord.items || [])
                      .map((i) => i.vendor?.storeName || i.vendor?.name)
                      .filter(Boolean)
                  ),
                ];
                return (
                  <tr key={ord._id}>
                    <td>
                      <div style={{ fontWeight: 700, color: '#818cf8', fontFamily: 'monospace' }}>
                        {ord.orderId}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: '#64748b' }}>
                        {new Date(ord.createdAt).toLocaleDateString()}
                      </div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{ord.shippingAddress?.fullName || 'Guest Customer'}</div>
                      <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>{ord.shippingAddress?.phone}</div>
                    </td>
                    <td>
                      <span className="admin-badge neutral" style={{ fontWeight: 600 }}>
                        {totalItems} item{totalItems > 1 ? 's' : ''}
                      </span>
                      {vendorNames.length > 0 && (
                        <div style={{ fontSize: '0.7rem', color: '#818cf8', marginTop: '3px' }}>
                          🏪 {vendorNames.join(', ')}
                        </div>
                      )}
                    </td>
                    <td>
                      <div style={{ fontWeight: 800 }}>{formatPrice(ord.total)}</div>
                      <div style={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase' }}>
                        {ord.paymentMethod}
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                        <span className={`admin-badge ${ord.paymentStatus === 'Paid' ? 'success' : ord.paymentStatus === 'Refunded' ? 'danger' : 'warning'}`}>
                          {ord.paymentStatus}
                        </span>
                        {ord.paymentStatus !== 'Paid' && ord.orderStatus !== 'Cancelled' && (
                          <button
                            onClick={() => handleVerifyPayment(ord.orderId || ord._id)}
                            style={{ background: 'none', border: 'none', color: '#818cf8', fontSize: '0.7rem', cursor: 'pointer', textAlign: 'left', textDecoration: 'underline' }}
                          >
                            Verify Paid
                          </button>
                        )}
                      </div>
                    </td>
                    <td>
                      <select
                        className="admin-select"
                        style={{ padding: '0.25rem 0.5rem', fontSize: '0.78rem' }}
                        value={ord.orderStatus}
                        onChange={(e) => handleStatusChange(ord.orderId || ord._id, e.target.value)}
                      >
                        <option value="Confirmed">Confirmed</option>
                        <option value="Processing">Processing</option>
                        <option value="Ready to Ship">Ready to Ship</option>
                        <option value="Shipped">Shipped</option>
                        <option value="Delivered">Delivered</option>
                        <option value="Cancelled">Cancelled</option>
                      </select>
                    </td>
                    <td>
                      {ord.trackingNumber ? (
                        <div style={{ fontSize: '0.78rem' }}>
                          <div style={{ fontWeight: 600, color: '#38bdf8' }}>{ord.courierName || 'BlueDart'}</div>
                          <div style={{ color: '#94a3b8', fontFamily: 'monospace' }}>{ord.trackingNumber}</div>
                        </div>
                      ) : (
                        <button
                          className="admin-btn admin-btn-secondary admin-btn-sm"
                          onClick={() => handleOpenTracking(ord)}
                          style={{ fontSize: '0.72rem' }}
                        >
                          <Truck size={12} /> Assign Courier
                        </button>
                      )}

                      {/* Fleet Delivery Partner status / assign button */}
                      {ord.deliveryPartner ? (
                        <div style={{ marginTop: 4, display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.72rem', color: '#34d399', fontWeight: 600 }}>
                          <Bike size={12} />
                          <span>{ord.deliveryPartner?.name || 'Assigned Rider'}</span>
                        </div>
                      ) : (
                        <button
                          className="admin-btn admin-btn-secondary admin-btn-sm"
                          onClick={() => setAssignModal({ open: true, order: ord, deliveryPartnerId: '', deliveryFee: ord.deliveryFee || 50 })}
                          style={{ fontSize: '0.7rem', marginTop: 4, color: '#34d399', borderColor: 'rgba(16,185,129,0.3)', width: '100%', justifyContent: 'center' }}
                          title="Assign to Delivery Fleet Rider"
                        >
                          <Bike size={11} /> Assign Rider
                        </button>
                      )}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '0.35rem' }}>
                        <button
                          className="admin-btn admin-btn-secondary admin-btn-sm"
                          onClick={() => setAssignModal({ open: true, order: ord, deliveryPartnerId: ord.deliveryPartner?._id || '', deliveryFee: ord.deliveryFee || 50 })}
                          title="Dispatch / Reassign Fleet Rider"
                        >
                          <Bike size={13} color="#34d399" />
                        </button>
                        <button
                          className="admin-btn admin-btn-secondary admin-btn-sm"
                          onClick={() => setSelectedOrder(ord)}
                          title="View Order Details"
                        >
                          <Eye size={13} />
                        </button>
                        <button
                          className="admin-btn admin-btn-secondary admin-btn-sm"
                          onClick={() => setInvoiceModal({ open: true, order: ord })}
                          title="Print Official Tax Invoice"
                        >
                          <FileText size={13} />
                        </button>
                        <button
                          className="admin-btn admin-btn-secondary admin-btn-sm"
                          onClick={() => setLabelModal({ open: true, order: ord })}
                          title="Print Waybill Shipping Label"
                        >
                          <Printer size={13} />
                        </button>
                        {ord.orderStatus !== 'Cancelled' && (
                          <button
                            className="admin-btn admin-btn-danger admin-btn-sm"
                            onClick={() => handleCancel(ord.orderId || ord._id)}
                            title="Cancel Order & Restock Inventory"
                          >
                            <X size={13} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* ORDER DETAILS MODAL */}
      {selectedOrder && (
        <div className="admin-modal-backdrop" onClick={() => setSelectedOrder(null)}>
          <div className="admin-modal admin-modal-lg" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <ShoppingBag size={22} color="#6366f1" />
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#f8fafc' }}>
                    Order Details: {selectedOrder.orderId}
                  </h3>
                  <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                    Placed on {new Date(selectedOrder.createdAt).toLocaleString()}
                  </span>
                </div>
              </div>
              <button onClick={() => setSelectedOrder(null)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <div className="admin-modal-body">
              {/* Delivery Address & Customer */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '10px', border: '1px solid var(--ap-border)' }}>
                  <h4 style={{ margin: '0 0 0.5rem', fontSize: '0.85rem', color: '#818cf8', textTransform: 'uppercase' }}>
                    <MapPin size={14} style={{ display: 'inline', marginRight: '4px' }} /> Shipping Destination
                  </h4>
                  <div style={{ fontWeight: 600 }}>{selectedOrder.shippingAddress?.fullName}</div>
                  <div style={{ fontSize: '0.82rem', color: '#cbd5e1' }}>{selectedOrder.shippingAddress?.streetAddress}</div>
                  <div style={{ fontSize: '0.82rem', color: '#cbd5e1' }}>
                    {selectedOrder.shippingAddress?.city}, {selectedOrder.shippingAddress?.state} - {selectedOrder.shippingAddress?.postalCode}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '4px' }}>Phone: {selectedOrder.shippingAddress?.phone}</div>
                </div>

                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '10px', border: '1px solid var(--ap-border)' }}>
                  <h4 style={{ margin: '0 0 0.5rem', fontSize: '0.85rem', color: '#818cf8', textTransform: 'uppercase' }}>
                    <DollarSign size={14} style={{ display: 'inline', marginRight: '4px' }} /> Payment & Gateway Info
                  </h4>
                  <div style={{ fontSize: '0.85rem' }}>Method: <strong>{selectedOrder.paymentMethod}</strong></div>
                  <div style={{ fontSize: '0.85rem', marginTop: '2px' }}>
                    Status: <strong style={{ color: selectedOrder.paymentStatus === 'Paid' ? '#34d399' : '#f59e0b' }}>{selectedOrder.paymentStatus}</strong>
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: '2px', fontFamily: 'monospace' }}>
                    Txn ID: {selectedOrder.transactionId || 'N/A'}
                  </div>
                  {selectedOrder.courierName && (
                    <div style={{ fontSize: '0.8rem', marginTop: '4px', color: '#38bdf8' }}>
                      Carrier: {selectedOrder.courierName} ({selectedOrder.trackingNumber})
                    </div>
                  )}
                </div>
              </div>

              {/* Items Table */}
              <h4 style={{ margin: '0 0 0.5rem', fontSize: '0.9rem', color: '#cbd5e1' }}>Purchased Items</h4>
              <div className="admin-table-container" style={{ marginBottom: '1.25rem' }}>
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>Quantity</th>
                      <th>Unit Price</th>
                      <th style={{ textAlign: 'right' }}>Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(selectedOrder.items || []).map((item, idx) => (
                      <tr key={idx}>
                        <td>
                          <div style={{ fontWeight: 600 }}>{item.product?.name || item.name}</div>
                          {item.vendor && (
                            <div style={{ fontSize: '0.72rem', color: '#818cf8' }}>
                              Seller: {item.vendor.storeName || item.vendor.name || 'Vendor'}
                            </div>
                          )}
                        </td>
                        <td>{item.quantity}</td>
                        <td>{formatPrice(item.price)}</td>
                        <td style={{ textAlign: 'right', fontWeight: 700 }}>
                          {formatPrice(item.price * item.quantity)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Financial Totals */}
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <div style={{ width: '260px', background: 'rgba(255,255,255,0.02)', padding: '0.85rem', borderRadius: '8px', border: '1px solid var(--ap-border)', fontSize: '0.85rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span>Subtotal:</span>
                    <span>{formatPrice(selectedOrder.subtotal || selectedOrder.total)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span>Shipping Fee:</span>
                    <span>{selectedOrder.delivery ? formatPrice(selectedOrder.delivery) : 'FREE'}</span>
                  </div>
                  {selectedOrder.discount > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', color: '#34d399' }}>
                      <span>Discount:</span>
                      <span>-{formatPrice(selectedOrder.discount)}</span>
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '6px', borderTop: '1px solid var(--ap-border)', fontWeight: 800, fontSize: '1.05rem', color: '#f8fafc' }}>
                    <span>Grand Total:</span>
                    <span>{formatPrice(selectedOrder.total)}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="admin-modal-footer">
              <button className="admin-btn admin-btn-secondary" onClick={() => setSelectedOrder(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TRACKING ASSIGNMENT MODAL */}
      {trackingModal.open && (
        <div className="admin-modal-backdrop" onClick={() => setTrackingModal({ ...trackingModal, open: false })}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <form onSubmit={handleSaveTracking}>
              <div className="admin-modal-header">
                <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#f8fafc' }}>
                  Assign Courier Tracking & Dispatch Order
                </h3>
                <button
                  type="button"
                  onClick={() => setTrackingModal({ ...trackingModal, open: false })}
                  style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
                >
                  <X size={20} />
                </button>
              </div>

              <div className="admin-modal-body">
                <p style={{ margin: '0 0 1rem', fontSize: '0.85rem', color: '#cbd5e1' }}>
                  Saving courier tracking details will automatically set order status to <strong>Shipped</strong> and record shipment metadata.
                </p>

                <div className="admin-form-group">
                  <label className="admin-form-label">Courier Logistic Partner *</label>
                  <select
                    className="admin-form-input"
                    value={trackingModal.courierName}
                    onChange={(e) => setTrackingModal({ ...trackingModal, courierName: e.target.value })}
                  >
                    <option value="BlueDart Express">BlueDart Express</option>
                    <option value="Delhivery Logistics">Delhivery Logistics</option>
                    <option value="DTDC India">DTDC India</option>
                    <option value="Ekart Logistics">Ekart Logistics</option>
                    <option value="FedEx Express">FedEx Express</option>
                    <option value="India Post SpeedPost">India Post SpeedPost</option>
                  </select>
                </div>

                <div className="admin-form-group">
                  <label className="admin-form-label">Waybill / Tracking Airway Number *</label>
                  <input
                    type="text"
                    className="admin-form-input"
                    required
                    placeholder="e.g. TRK-BD-890214"
                    value={trackingModal.trackingNumber}
                    onChange={(e) => setTrackingModal({ ...trackingModal, trackingNumber: e.target.value })}
                  />
                </div>

                <div className="admin-form-group">
                  <label className="admin-form-label">Estimated Delivery Date</label>
                  <input
                    type="date"
                    className="admin-form-input"
                    value={trackingModal.estimatedDeliveryDate}
                    onChange={(e) => setTrackingModal({ ...trackingModal, estimatedDeliveryDate: e.target.value })}
                  />
                </div>
              </div>

              <div className="admin-modal-footer">
                <button
                  type="button"
                  className="admin-btn admin-btn-secondary"
                  onClick={() => setTrackingModal({ ...trackingModal, open: false })}
                >
                  Cancel
                </button>
                <button type="submit" className="admin-btn admin-btn-primary">
                  Save Waybill & Mark Shipped
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PRINTABLE TAX INVOICE MODAL */}
      {invoiceModal.open && invoiceModal.order && (
        <div className="admin-modal-backdrop" onClick={() => setInvoiceModal({ open: false, order: null })}>
          <div className="admin-modal admin-modal-lg" onClick={(e) => e.stopPropagation()} style={{ background: '#ffffff', color: '#111827' }}>
            <div style={{ padding: '2rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #e5e7eb', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
                <div>
                  <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800, color: '#4f46e5' }}>APPSICA COMMERCE</h2>
                  <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>Official Multi-Vendor Tax Invoice</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 700, fontSize: '1rem' }}>INVOICE #{invoiceModal.order.invoiceNumber || invoiceModal.order.orderId}</div>
                  <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>Date: {new Date(invoiceModal.order.createdAt).toLocaleDateString()}</div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem', fontSize: '0.85rem' }}>
                <div>
                  <div style={{ fontWeight: 700, color: '#374151', marginBottom: '4px' }}>Billed To:</div>
                  <div>{invoiceModal.order.shippingAddress?.fullName}</div>
                  <div>{invoiceModal.order.shippingAddress?.streetAddress}</div>
                  <div>{invoiceModal.order.shippingAddress?.city}, {invoiceModal.order.shippingAddress?.state} - {invoiceModal.order.shippingAddress?.postalCode}</div>
                  <div>Phone: {invoiceModal.order.shippingAddress?.phone}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 700, color: '#374151', marginBottom: '4px' }}>Payment Summary:</div>
                  <div>Payment Method: {invoiceModal.order.paymentMethod?.toUpperCase()}</div>
                  <div>Status: {invoiceModal.order.paymentStatus}</div>
                  <div>Txn ID: {invoiceModal.order.transactionId || 'VERIFIED'}</div>
                </div>
              </div>

              <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '1.5rem', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ background: '#f3f4f6', borderBottom: '1px solid #d1d5db' }}>
                    <th style={{ padding: '0.5rem', textAlign: 'left' }}>Item Description</th>
                    <th style={{ padding: '0.5rem', textAlign: 'center' }}>Qty</th>
                    <th style={{ padding: '0.5rem', textAlign: 'right' }}>Rate</th>
                    <th style={{ padding: '0.5rem', textAlign: 'right' }}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {(invoiceModal.order.items || []).map((item, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid #e5e7eb' }}>
                      <td style={{ padding: '0.5rem' }}>{item.product?.name || item.name}</td>
                      <td style={{ padding: '0.5rem', textAlign: 'center' }}>{item.quantity}</td>
                      <td style={{ padding: '0.5rem', textAlign: 'right' }}>{formatPrice(item.price)}</td>
                      <td style={{ padding: '0.5rem', textAlign: 'right', fontWeight: 600 }}>{formatPrice(item.price * item.quantity)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div style={{ display: 'flex', justifyContent: 'flex-end', fontSize: '0.9rem' }}>
                <div style={{ width: '220px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span>Subtotal:</span>
                    <span>{formatPrice(invoiceModal.order.subtotal || invoiceModal.order.total)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span>Shipping:</span>
                    <span>{invoiceModal.order.delivery ? formatPrice(invoiceModal.order.delivery) : 'FREE'}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: '1.1rem', borderTop: '2px solid #111827', paddingTop: '6px' }}>
                    <span>Grand Total:</span>
                    <span>{formatPrice(invoiceModal.order.total)}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="admin-modal-footer" style={{ background: '#f9fafb', borderTop: '1px solid #e5e7eb' }}>
              <button className="admin-btn admin-btn-secondary" onClick={() => setInvoiceModal({ open: false, order: null })}>
                Close
              </button>
              <button className="admin-btn admin-btn-primary" onClick={() => window.print()}>
                <Printer size={15} /> Print Invoice
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PRINTABLE WAYBILL SHIPPING LABEL MODAL */}
      {labelModal.open && labelModal.order && (
        <div className="admin-modal-backdrop" onClick={() => setLabelModal({ open: false, order: null })}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()} style={{ background: '#fff', color: '#000', maxWidth: '500px' }}>
            <div style={{ padding: '1.5rem', border: '2px dashed #000', margin: '1rem', borderRadius: '4px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #000', paddingBottom: '0.5rem', marginBottom: '1rem' }}>
                <span style={{ fontSize: '1.2rem', fontWeight: 900 }}>APPSICA EXPRESS</span>
                <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>{labelModal.order.courierName || 'BlueDart Express'}</span>
              </div>

              <div style={{ textAlign: 'center', margin: '1rem 0' }}>
                <div style={{ fontFamily: 'monospace', fontSize: '1.2rem', fontWeight: 900, letterSpacing: '2px' }}>
                  *{labelModal.order.trackingNumber || labelModal.order.orderId}*
                </div>
                <div style={{ fontSize: '0.75rem', marginTop: '2px' }}>TRACKING WAYBILL NUMBER</div>
              </div>

              <div style={{ borderTop: '1px solid #000', paddingTop: '0.75rem', fontSize: '0.85rem' }}>
                <div style={{ fontWeight: 800 }}>SHIP TO:</div>
                <div style={{ fontWeight: 700 }}>{labelModal.order.shippingAddress?.fullName}</div>
                <div>{labelModal.order.shippingAddress?.streetAddress}</div>
                <div>{labelModal.order.shippingAddress?.city}, {labelModal.order.shippingAddress?.state} - {labelModal.order.shippingAddress?.postalCode}</div>
                <div>TEL: {labelModal.order.shippingAddress?.phone}</div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #000', marginTop: '1rem', paddingTop: '0.5rem', fontSize: '0.8rem', fontWeight: 700 }}>
                <span>ORDER: {labelModal.order.orderId}</span>
                <span>ITEMS: {(labelModal.order.items || []).reduce((a, b) => a + (b.quantity || 1), 0)}</span>
                <span>{labelModal.order.paymentMethod === 'cod' ? 'COD' : 'PREPAID'}</span>
              </div>
            </div>

            <div className="admin-modal-footer" style={{ background: '#f3f4f6' }}>
              <button className="admin-btn admin-btn-secondary" onClick={() => setLabelModal({ open: false, order: null })}>
                Close
              </button>
              <button className="admin-btn admin-btn-primary" onClick={() => window.print()}>
                <Printer size={15} /> Print Waybill Label
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ASSIGN DELIVERY PARTNER MODAL */}
      {assignModal.open && (
        <div className="admin-modal-overlay" onClick={() => setAssignModal({ open: false, order: null, deliveryPartnerId: '', deliveryFee: 50 })}>
          <div className="admin-modal" style={{ maxWidth: 460 }} onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.1rem' }}>
                <Bike size={20} color="#10b981" />
                <span>Assign Delivery Partner</span>
              </h3>
              <button className="admin-modal-close" onClick={() => setAssignModal({ open: false, order: null, deliveryPartnerId: '', deliveryFee: 50 })}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAssignDeliverySubmit}>
              <div className="admin-modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ background: 'rgba(255, 255, 255, 0.04)', padding: '0.75rem', borderRadius: 8, fontSize: '0.85rem' }}>
                  <div>Order ID: <strong style={{ color: '#f8fafc' }}>#{assignModal.order?.orderId}</strong></div>
                  <div style={{ color: '#94a3b8', marginTop: 2 }}>
                    Destination: {assignModal.order?.shippingAddress?.fullName} ({assignModal.order?.shippingAddress?.city})
                  </div>
                </div>

                <div>
                  <label className="admin-label" style={{ marginBottom: 6 }}>
                    Select Delivery Partner / Rider
                  </label>
                  <select
                    className="admin-select"
                    required
                    value={assignModal.deliveryPartnerId}
                    onChange={(e) => setAssignModal({ ...assignModal, deliveryPartnerId: e.target.value })}
                  >
                    <option value="">-- Choose active delivery partner --</option>
                    {deliveryPartners
                      .filter((p) => p.deliveryStatus === 'approved')
                      .map((p) => (
                        <option key={p._id} value={p._id}>
                          {p.name} ({p.vehicleNumber || p.vehicleType}) {p.isOnline ? '🟢 Online' : '⚪ Offline'}
                        </option>
                      ))}
                  </select>
                  {deliveryPartners.filter((p) => p.deliveryStatus === 'approved').length === 0 && (
                    <div style={{ fontSize: '0.75rem', color: '#fbbf24', marginTop: 4 }}>
                      No approved riders available. Please approve a rider in Delivery Fleet first.
                    </div>
                  )}
                </div>

                <div>
                  <label className="admin-label" style={{ marginBottom: 6 }}>
                    Rider Delivery Payout Fee (₹)
                  </label>
                  <input
                    type="number"
                    min={10}
                    max={500}
                    value={assignModal.deliveryFee}
                    onChange={(e) => setAssignModal({ ...assignModal, deliveryFee: Number(e.target.value) })}
                    className="admin-input"
                  />
                  <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: 4 }}>
                    Standard trip rate is ₹50-60. Credited to driver upon OTP delivery verification.
                  </div>
                </div>
              </div>

              <div className="admin-modal-footer">
                <button
                  type="button"
                  className="admin-btn admin-btn-secondary"
                  onClick={() => setAssignModal({ open: false, order: null, deliveryPartnerId: '', deliveryFee: 50 })}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={assigning || !assignModal.deliveryPartnerId}
                  className="admin-btn admin-btn-success"
                >
                  {assigning ? 'Assigning…' : 'Confirm Assignment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
