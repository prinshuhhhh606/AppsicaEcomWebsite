import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  ShoppingBag,
  Search,
  Truck,
  CheckCircle,
  Clock,
  AlertTriangle,
  User,
  MapPin,
  Calendar,
  Phone,
  Mail,
  X,
  CreditCard,
  RefreshCw,
  FileText
} from 'lucide-react';
import { vendorService } from '../../services/vendorService';
import { formatPrice } from '../../utils/formatPrice';

const STATUS_TABS = [
  { key: 'all', label: 'All Orders' },
  { key: 'Pending', label: 'Pending' },
  { key: 'Processing', label: 'Processing' },
  { key: 'Shipped', label: 'Shipped' },
  { key: 'Delivered', label: 'Delivered' },
  { key: 'Cancelled', label: 'Cancelled' },
];

export default function VendorOrders() {
  const [searchParams] = useSearchParams();
  const initialOrderId = searchParams.get('id');

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Filters
  const [activeTab, setActiveTab] = useState('all');
  const [searchTerm, setSearchTerm] = useState(initialOrderId || '');

  // Manage Order Modal
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [statusForm, setStatusForm] = useState({
    status: 'Pending',
    courierName: 'BlueDart Express',
    trackingNumber: '',
    note: '',
  });

  const loadOrders = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await vendorService.getOrders({
        status: activeTab === 'all' ? undefined : activeTab,
        search: searchTerm,
      });
      setOrders(res?.orders || []);

      // If initialOrderId passed in query parameter, auto-open modal
      if (initialOrderId && res?.orders?.length > 0) {
        const found = res.orders.find((o) => o.orderId === initialOrderId);
        if (found) {
          openManageModal(found);
        }
      }
    } catch (err) {
      setError(err?.message || 'Failed to load vendor orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, [activeTab]);

  const openManageModal = (order) => {
    setSelectedOrder(order);
    setStatusForm({
      status: order.orderStatus || 'Pending',
      courierName: order.courierName || 'BlueDart Express',
      trackingNumber: order.trackingNumber || `TRK-BD-${Date.now().toString().slice(-6)}`,
      note: '',
    });
  };

  const handleUpdateStatus = async (e) => {
    e.preventDefault();
    if (!selectedOrder) return;

    try {
      await vendorService.updateOrderStatus(selectedOrder.orderId || selectedOrder._id, statusForm);
      setSuccessMsg(`Order ${selectedOrder.orderId} status updated to "${statusForm.status}" successfully!`);
      setSelectedOrder(null);
      loadOrders();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      alert(err?.message || 'Failed to update order status');
    }
  };

  return (
    <div>
      {/* Header */}
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
            Customer Orders & Shipments
          </h2>
          <p style={{ color: '#94a3b8', margin: 0, fontSize: '0.9rem' }}>
            Fulfill and track customer orders containing products from your store.
          </p>
        </div>

        <button className="vp-btn vp-btn-secondary" onClick={loadOrders} disabled={loading}>
          <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          <span>Refresh Orders</span>
        </button>
      </div>

      {/* Success alert */}
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

      {/* Status Filter Tabs */}
      <div
        style={{
          display: 'flex',
          gap: '0.5rem',
          marginBottom: '1.25rem',
          overflowX: 'auto',
          paddingBottom: '0.25rem',
        }}
      >
        {STATUS_TABS.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                padding: '0.55rem 1rem',
                borderRadius: '10px',
                border: '1px solid',
                borderColor: isActive ? 'rgba(99, 102, 241, 0.4)' : 'rgba(148, 163, 184, 0.15)',
                background: isActive ? 'rgba(99, 102, 241, 0.2)' : 'rgba(15, 23, 42, 0.7)',
                color: isActive ? '#fff' : '#94a3b8',
                fontWeight: isActive ? 600 : 500,
                fontSize: '0.86rem',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.2s',
              }}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Search Toolbar */}
      <div className="vendor-toolbar">
        <form
          className="vendor-search-box"
          onSubmit={(e) => {
            e.preventDefault();
            loadOrders();
          }}
          style={{ maxWidth: '450px' }}
        >
          <Search size={18} />
          <input
            type="text"
            placeholder="Search by Order ID, customer name, phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </form>

        <span style={{ fontSize: '0.84rem', color: '#94a3b8' }}>
          Showing <strong>{orders.length}</strong> orders
        </span>
      </div>

      {/* Orders Table */}
      <div className="vendor-card" style={{ padding: 0 }}>
        {orders.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem 1.5rem', color: '#94a3b8' }}>
            <ShoppingBag size={48} style={{ margin: '0 auto 1rem', color: '#475569' }} />
            <h3 style={{ color: '#fff', fontSize: '1.15rem', marginBottom: '0.5rem' }}>
              No Orders Found
            </h3>
            <p style={{ margin: 0, fontSize: '0.9rem' }}>
              No orders matched the current filter. When customers purchase your items, they will appear here.
            </p>
          </div>
        ) : (
          <div className="vendor-table-container" style={{ border: 'none' }}>
            <table className="vendor-table">
              <thead>
                <tr>
                  <th>Order Info</th>
                  <th>Customer & Shipping</th>
                  <th>Your Store Items</th>
                  <th>Vendor Subtotal</th>
                  <th>Payment</th>
                  <th>Order Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((ord) => {
                  const statusClass =
                    ord.orderStatus === 'Delivered'
                      ? 'vp-badge-delivered'
                      : ord.orderStatus === 'Shipped'
                      ? 'vp-badge-shipped'
                      : ord.orderStatus === 'Processing'
                      ? 'vp-badge-processing'
                      : ord.orderStatus === 'Cancelled'
                      ? 'vp-badge-cancelled'
                      : 'vp-badge-pending';

                  return (
                    <tr key={ord._id}>
                      {/* Order info */}
                      <td>
                        <span style={{ fontWeight: 700, color: '#fff', display: 'block' }}>
                          {ord.orderId}
                        </span>
                        <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                          {new Date(ord.createdAt).toLocaleDateString()} at{' '}
                          {new Date(ord.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </td>

                      {/* Customer */}
                      <td>
                        <span style={{ fontWeight: 600, color: '#cbd5e1', display: 'block' }}>
                          {ord.customer?.name}
                        </span>
                        <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                          {ord.shippingAddress?.city}, {ord.shippingAddress?.state} ({ord.shippingAddress?.pincode})
                        </span>
                      </td>

                      {/* Store items list */}
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                          {ord.vendorItems?.map((it, i) => (
                            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <img
                                src={
                                  it.image ||
                                  'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=60&q=80'
                                }
                                alt={it.name}
                                style={{ width: '28px', height: '28px', borderRadius: '6px', objectFit: 'cover' }}
                              />
                              <span style={{ fontSize: '0.82rem', color: '#e2e8f0' }}>
                                {it.name} <strong>× {it.quantity}</strong>
                              </span>
                            </div>
                          ))}
                        </div>
                      </td>

                      {/* Vendor Subtotal */}
                      <td style={{ fontWeight: 800, color: '#34d399', fontSize: '0.95rem' }}>
                        {formatPrice(ord.vendorSubtotal)}
                      </td>

                      {/* Payment */}
                      <td>
                        <span
                          style={{
                            fontSize: '0.78rem',
                            fontWeight: 600,
                            color: ord.paymentStatus === 'Paid' ? '#34d399' : '#fbbf24',
                          }}
                        >
                          ● {ord.paymentStatus}
                        </span>
                        <span style={{ display: 'block', fontSize: '0.72rem', color: '#64748b' }}>
                          Method: {ord.paymentMethod?.toUpperCase()}
                        </span>
                      </td>

                      {/* Order status */}
                      <td>
                        <span className={`vp-badge ${statusClass}`}>{ord.orderStatus}</span>
                        {ord.trackingNumber && (
                          <span style={{ display: 'block', fontSize: '0.7rem', color: '#818cf8', marginTop: 2 }}>
                            {ord.courierName}: {ord.trackingNumber}
                          </span>
                        )}
                        {ord.deliveryPartner && (
                          <div style={{ marginTop: '0.35rem', fontSize: '0.72rem', color: '#38bdf8', display: 'flex', alignItems: 'center', gap: 4 }}>
                            <Truck size={12} />
                            <span>Rider: {ord.deliveryPartner.name} ({ord.deliveryStatus})</span>
                          </div>
                        )}
                      </td>

                      {/* Action */}
                      <td>
                        <button
                          className="vp-btn vp-btn-primary vp-btn-sm"
                          onClick={() => openManageModal(ord)}
                        >
                          Manage Order
                        </button>
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
          MANAGE ORDER & STATUS UPDATE MODAL (Requirements 6 & 7)
          ========================================================= */}
      {selectedOrder && (
        <div className="vp-modal-backdrop" onClick={() => setSelectedOrder(null)}>
          <div className="vp-modal vp-modal-lg" onClick={(e) => e.stopPropagation()}>
            <div className="vp-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'rgba(99, 102, 241, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#818cf8' }}>
                  <ShoppingBag size={20} />
                </div>
                <div>
                  <h3 style={{ margin: 0 }}>Order {selectedOrder.orderId}</h3>
                  <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                    Placed on {new Date(selectedOrder.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
              <button className="vp-modal-close" onClick={() => setSelectedOrder(null)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleUpdateStatus}>
              <div className="vp-modal-body">
                {/* 2-col order info */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '1.5rem' }}>
                  {/* Customer Information */}
                  <div
                    style={{
                      background: 'rgba(10, 15, 29, 0.8)',
                      padding: '1rem',
                      borderRadius: '12px',
                      border: '1px solid rgba(148, 163, 184, 0.12)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700, color: '#fff', fontSize: '0.85rem', marginBottom: '0.65rem' }}>
                      <User size={15} style={{ color: '#818cf8' }} /> Customer & Contact
                    </div>
                    <div style={{ fontSize: '0.86rem', color: '#cbd5e1', lineHeight: '1.5' }}>
                      <strong>{selectedOrder.customer?.name}</strong>
                      <br />
                      Phone: {selectedOrder.shippingAddress?.phone || selectedOrder.customer?.phone || 'N/A'}
                      <br />
                      Email: {selectedOrder.customer?.email || 'N/A'}
                    </div>
                  </div>

                  {/* Delivery Address */}
                  <div
                    style={{
                      background: 'rgba(10, 15, 29, 0.8)',
                      padding: '1rem',
                      borderRadius: '12px',
                      border: '1px solid rgba(148, 163, 184, 0.12)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700, color: '#fff', fontSize: '0.85rem', marginBottom: '0.65rem' }}>
                      <MapPin size={15} style={{ color: '#10b981' }} /> Shipping Destination
                    </div>
                    <div style={{ fontSize: '0.84rem', color: '#94a3b8', lineHeight: '1.4' }}>
                      {selectedOrder.shippingAddress?.addressLine}
                      <br />
                      {selectedOrder.shippingAddress?.city}, {selectedOrder.shippingAddress?.state} -{' '}
                      <strong>{selectedOrder.shippingAddress?.pincode}</strong>
                    </div>
                  </div>
                </div>

                {/* Vendor Items in this Order */}
                <div style={{ marginBottom: '1.5rem' }}>
                  <div style={{ fontWeight: 700, color: '#fff', fontSize: '0.9rem', marginBottom: '0.75rem' }}>
                    Items to Dispatch from Your Inventory
                  </div>
                  <div style={{ background: '#0a0f1d', borderRadius: '12px', border: '1px solid rgba(148, 163, 184, 0.1)', overflow: 'hidden' }}>
                    {selectedOrder.vendorItems?.map((it, idx) => (
                      <div
                        key={idx}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '0.85rem 1rem',
                          borderBottom: idx !== selectedOrder.vendorItems.length - 1 ? '1px solid rgba(148, 163, 184, 0.08)' : 'none',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                          <img
                            src={
                              it.image ||
                              'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=100&q=80'
                            }
                            alt={it.name}
                            style={{ width: '42px', height: '42px', borderRadius: '8px', objectFit: 'cover' }}
                          />
                          <div>
                            <div style={{ fontWeight: 600, color: '#fff', fontSize: '0.88rem' }}>{it.name}</div>
                            <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                              Quantity: {it.quantity} unit{it.quantity > 1 ? 's' : ''} @ {formatPrice(it.price)} each
                            </div>
                          </div>
                        </div>
                        <div style={{ fontWeight: 700, color: '#34d399', fontSize: '0.95rem' }}>
                          {formatPrice(it.price * it.quantity)}
                        </div>
                      </div>
                    ))}
                    <div
                      style={{
                        padding: '0.85rem 1rem',
                        background: 'rgba(30, 41, 59, 0.5)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        fontWeight: 700,
                        color: '#fff',
                        fontSize: '0.95rem',
                      }}
                    >
                      <span>Your Store Total:</span>
                      <span style={{ color: '#34d399' }}>{formatPrice(selectedOrder.vendorSubtotal)}</span>
                    </div>
                  </div>
                </div>

                {/* Delivery Partner & Logistics Card */}
                {selectedOrder.deliveryPartner ? (
                  <div
                    style={{
                      background: 'rgba(56, 189, 248, 0.08)',
                      border: '1px solid rgba(56, 189, 248, 0.25)',
                      borderRadius: '12px',
                      padding: '1rem',
                      marginBottom: '1.25rem',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700, color: '#38bdf8', fontSize: '0.88rem' }}>
                        <Truck size={16} /> Assigned Delivery Partner
                      </div>
                      <span className="vp-badge" style={{ background: 'rgba(56, 189, 248, 0.2)', color: '#38bdf8', fontSize: '0.75rem' }}>
                        {selectedOrder.deliveryStatus}
                      </span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.5rem', fontSize: '0.82rem', color: '#cbd5e1' }}>
                      <div><strong>Driver:</strong> {selectedOrder.deliveryPartner.name}</div>
                      <div><strong>Phone:</strong> {selectedOrder.deliveryPartner.phone || 'N/A'}</div>
                      <div><strong>Vehicle:</strong> {selectedOrder.deliveryPartner.vehicleType || 'Motorcycle'} ({selectedOrder.deliveryPartner.vehicleNumber || 'Standard'})</div>
                    </div>
                    {selectedOrder.pickupExceptionReported && (
                      <div style={{ marginTop: '0.5rem', padding: '0.5rem', background: 'rgba(239, 68, 68, 0.15)', borderRadius: '6px', color: '#fca5a5', fontSize: '0.78rem' }}>
                        <strong>⚠️ Pickup Issue Reported:</strong> {selectedOrder.pickupNotes || 'Parcel delay reported by delivery partner'}
                      </div>
                    )}
                  </div>
                ) : (
                  <div
                    style={{
                      background: 'rgba(148, 163, 184, 0.05)',
                      border: '1px dashed rgba(148, 163, 184, 0.2)',
                      borderRadius: '10px',
                      padding: '0.75rem 1rem',
                      marginBottom: '1.25rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      fontSize: '0.82rem',
                      color: '#94a3b8',
                    }}
                  >
                    <Clock size={16} />
                    <span>Delivery Partner: Awaiting admin fleet assignment. You can prepare and pack the parcel in the meantime.</span>
                  </div>
                )}

                {/* STATUS & SHIPMENT UPDATE (Requirement 7) */}
                <div
                  style={{
                    background: 'rgba(99, 102, 241, 0.06)',
                    border: '1px solid rgba(99, 102, 241, 0.25)',
                    borderRadius: '12px',
                    padding: '1.25rem',
                  }}
                >
                  <div style={{ fontWeight: 700, color: '#fff', fontSize: '0.92rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Truck size={18} style={{ color: '#818cf8' }} /> Update Shipment Status & Logistics
                  </div>

                  <div className="vp-form-row">
                    <div className="vp-form-group">
                      <label className="vp-form-label">Order Fulfillment Status *</label>
                      <select
                        className="vp-select"
                        value={statusForm.status}
                        onChange={(e) => setStatusForm({ ...statusForm, status: e.target.value })}
                      >
                        <option value="Pending">Pending (Awaiting Pickup)</option>
                        <option value="Processing">Processing (Packaging Order)</option>
                        <option value="Shipped">Shipped (Handed to Courier)</option>
                        <option value="Delivered">Delivered (Successfully Received)</option>
                        <option value="Cancelled">Cancelled (Order Voided)</option>
                      </select>
                    </div>

                    <div className="vp-form-group">
                      <label className="vp-form-label">Courier Partner Name</label>
                      <input
                        type="text"
                        className="vp-input"
                        placeholder="e.g. BlueDart, Delhivery, DTDC, FedEx"
                        value={statusForm.courierName}
                        onChange={(e) => setStatusForm({ ...statusForm, courierName: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="vp-form-row">
                    <div className="vp-form-group">
                      <label className="vp-form-label">Tracking / AWB Number</label>
                      <input
                        type="text"
                        className="vp-input"
                        placeholder="e.g. TRK-BD-890214"
                        value={statusForm.trackingNumber}
                        onChange={(e) => setStatusForm({ ...statusForm, trackingNumber: e.target.value })}
                      />
                    </div>

                    <div className="vp-form-group">
                      <label className="vp-form-label">Fulfillment Note (Optional)</label>
                      <input
                        type="text"
                        className="vp-input"
                        placeholder="Package dispatched via priority express..."
                        value={statusForm.note}
                        onChange={(e) => setStatusForm({ ...statusForm, note: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="vp-modal-footer">
                <button type="button" className="vp-btn vp-btn-secondary" onClick={() => setSelectedOrder(null)}>
                  Close
                </button>
                <button type="submit" className="vp-btn vp-btn-primary">
                  Save & Update Status
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
