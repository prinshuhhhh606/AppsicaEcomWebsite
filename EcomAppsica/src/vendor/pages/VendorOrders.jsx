import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  ShoppingBag,
  Search,
  Truck,
  CheckCircle,
  Clock,
  AlertTriangle,
  AlertCircle,
  User,
  MapPin,
  Calendar,
  Phone,
  Mail,
  X,
  CreditCard,
  RefreshCw,
  FileText,
  Bike
} from 'lucide-react';
import { vendorService } from '../../services/vendorService';
import { formatPrice } from '../../utils/formatPrice';
import { getSocket } from '../../services/socket';

const STATUS_TABS = [
  { key: 'all', label: 'All Orders' },
  { key: 'Confirmed', label: 'Confirmed (New)' },
  { key: 'Processing', label: 'Processing' },
  { key: 'Packed', label: 'Packed / Ready for Pickup' },
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

  // Available Delivery Partners (for Seller to assign)
  const [deliveryPartners, setDeliveryPartners] = useState([]);
  const [assignPartnerId, setAssignPartnerId] = useState('');
  const [assignFee, setAssignFee] = useState(50);
  const [assigningDriver, setAssigningDriver] = useState(false);

  // Manage Order Modal
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [statusForm, setStatusForm] = useState({
    status: 'Pending',
    courierName: 'BlueDart Express',
    trackingNumber: '',
    note: '',
  });

  const loadDeliveryPartners = async () => {
    try {
      const res = await vendorService.getDeliveryPartners();
      if (res?.success) {
        setDeliveryPartners(res.partners || []);
      }
    } catch (err) {
      console.warn('Notice loading delivery partners for vendor:', err.message);
    }
  };

  const loadOrders = async (silent = false) => {
    if (!silent) setLoading(true);
    setError('');
    try {
      const res = await vendorService.getOrders({
        status: activeTab === 'all' ? undefined : activeTab,
        search: searchTerm,
      });
      setOrders(res?.orders || []);

      // If initialOrderId passed in query parameter, auto-open modal
      if (initialOrderId && res?.orders?.length > 0 && !silent) {
        const found = res.orders.find((o) => o.orderId === initialOrderId);
        if (found) {
          openManageModal(found);
        }
      }
    } catch (err) {
      if (!silent) setError(err?.message || 'Failed to load vendor orders');
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
    loadDeliveryPartners();
    const interval = setInterval(() => {
      loadOrders(true);
    }, 8000);
    return () => clearInterval(interval);
  }, [activeTab]);

  // Real-time Socket.IO synchronization for verified delivery partners
  useEffect(() => {
    let socket;
    try {
      socket = getSocket();
    } catch (e) {
      console.warn('Socket connection error:', e);
      return;
    }

    const handleDriverApproved = (newDriver) => {
      if (!newDriver || !newDriver._id) return;
      setDeliveryPartners((prev) => {
        const exists = prev.some((d) => String(d._id) === String(newDriver._id));
        if (exists) {
          return prev.map((d) =>
            String(d._id) === String(newDriver._id) ? { ...d, ...newDriver } : d
          );
        }
        return [newDriver, ...prev];
      });
    };

    const handleDriverRemoved = ({ driverId }) => {
      if (!driverId) return;
      setDeliveryPartners((prev) => prev.filter((d) => String(d._id) !== String(driverId)));
      setAssignPartnerId((curr) => (String(curr) === String(driverId) ? '' : curr));
    };

    const handleDriverAvailability = ({ driverId, isOnline }) => {
      if (!driverId) return;
      setDeliveryPartners((prev) =>
        prev.map((d) =>
          String(d._id) === String(driverId) ? { ...d, isOnline } : d
        )
      );
    };

    const handleDriverWorkload = ({ driverId, activeOrdersCount }) => {
      if (!driverId) return;
      setDeliveryPartners((prev) =>
        prev.map((d) =>
          String(d._id) === String(driverId) ? { ...d, activeOrdersCount } : d
        )
      );
    };

    const handleFullRefresh = () => {
      loadDeliveryPartners();
    };

    socket.on('driver:approved', handleDriverApproved);
    socket.on('driver:removed', handleDriverRemoved);
    socket.on('driver:availability_changed', handleDriverAvailability);
    socket.on('driver:workload_updated', handleDriverWorkload);
    socket.on('delivery-partners:updated', handleFullRefresh);
    socket.on('connect', handleFullRefresh);

    const handleOrderLifecycleUpdate = () => {
      loadOrders();
    };

    socket.on('order:status_updated', handleOrderLifecycleUpdate);
    socket.on('order:assigned', handleOrderLifecycleUpdate);
    socket.on('order:offer_sent', handleOrderLifecycleUpdate);
    socket.on('order:offer_accepted', handleOrderLifecycleUpdate);
    socket.on('order:pending_assignment', handleOrderLifecycleUpdate);
    socket.on('order:offer_declined', handleOrderLifecycleUpdate);
    socket.on('order:offer_expired', handleOrderLifecycleUpdate);

    return () => {
      socket.off('driver:approved', handleDriverApproved);
      socket.off('driver:removed', handleDriverRemoved);
      socket.off('driver:availability_changed', handleDriverAvailability);
      socket.off('driver:workload_updated', handleDriverWorkload);
      socket.off('delivery-partners:updated', handleFullRefresh);
      socket.off('connect', handleFullRefresh);

      socket.off('order:status_updated', handleOrderLifecycleUpdate);
      socket.off('order:assigned', handleOrderLifecycleUpdate);
      socket.off('order:offer_sent', handleOrderLifecycleUpdate);
      socket.off('order:offer_accepted', handleOrderLifecycleUpdate);
      socket.off('order:pending_assignment', handleOrderLifecycleUpdate);
      socket.off('order:offer_declined', handleOrderLifecycleUpdate);
      socket.off('order:offer_expired', handleOrderLifecycleUpdate);
    };
  }, []);

  const openManageModal = (order) => {
    setSelectedOrder(order);
    setStatusForm({
      status: order.orderStatus || 'Pending',
      courierName: order.courierName || 'Appsica Fleet',
      trackingNumber: order.trackingNumber || `TRK-PK-${Date.now().toString().slice(-6)}`,
      note: '',
    });
    const currentPartnerId = order.deliveryPartner?._id || (typeof order.deliveryPartner === 'string' ? order.deliveryPartner : '');
    setAssignPartnerId(currentPartnerId);
    setAssignFee(order.deliveryFee || 50);
    loadDeliveryPartners();
  };

  const handleUpdateStatus = async (e) => {
    e.preventDefault();
    if (!selectedOrder) return;

    try {
      const orderIdentifier = selectedOrder.orderId || selectedOrder._id;
      const currentPartnerId = selectedOrder.deliveryPartner?._id || (typeof selectedOrder.deliveryPartner === 'string' ? selectedOrder.deliveryPartner : '');

      // If a driver is chosen and different from existing, assign the driver as well
      if (assignPartnerId && assignPartnerId !== currentPartnerId) {
        await vendorService.assignDeliveryPartner(orderIdentifier, assignPartnerId, assignFee);
      }

      const payload = {
        ...statusForm,
        deliveryPartnerId: assignPartnerId || undefined,
        deliveryFee: assignFee || 50,
      };

      await vendorService.updateOrderStatus(orderIdentifier, payload);
      setSuccessMsg(`Order #${selectedOrder.orderId} updated successfully!`);
      setSelectedOrder(null);
      loadOrders();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      alert(err?.response?.data?.message || err?.message || 'Failed to update order status');
    }
  };

  const handleAssignDeliveryPartner = async (orderId) => {
    if (!assignPartnerId) {
      alert('Please select an active delivery partner from the dropdown');
      return;
    }

    setAssigningDriver(true);
    try {
      const res = await vendorService.assignDeliveryPartner(orderId, assignPartnerId, assignFee);
      if (res?.success) {
        setSuccessMsg(res.message || 'Delivery partner successfully assigned to order!');
        loadOrders();
        if (selectedOrder && (selectedOrder.orderId === orderId || selectedOrder._id === orderId)) {
          setSelectedOrder({
            ...selectedOrder,
            deliveryPartner: res.assignedPartner || res.order?.deliveryPartner,
            deliveryStatus: 'Assigned',
            orderStatus: res.order?.orderStatus || 'Ready for Pickup',
          });
        }
        setTimeout(() => setSuccessMsg(''), 4000);
      }
    } catch (err) {
      alert(err?.response?.data?.message || err?.message || 'Failed to assign delivery partner');
    } finally {
      setAssigningDriver(false);
    }
  };

  const handleQuickUpdate = async (order, targetStatus) => {
    try {
      const res = await vendorService.updateOrderStatus(order.orderId || order._id, {
        status: targetStatus,
        courierName: order.courierName || 'Appsica Fleet',
        trackingNumber: order.trackingNumber || `TRK-PK-${Date.now().toString().slice(-6)}`,
        note: `Parcel status marked as ${targetStatus} by seller`,
      });
      setSuccessMsg(
        res?.dispatchInitiated
          ? `Order #${order.orderId} marked as "${targetStatus}"! Automatic driver dispatch initiated.`
          : `Order #${order.orderId} marked as "${targetStatus}".`
      );
      loadOrders();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      alert(err?.response?.data?.message || err?.message || 'Failed to update order status');
    }
  };

  const handleTriggerDispatch = async (order) => {
    try {
      const res = await vendorService.triggerDispatch(order.orderId || order._id);
      setSuccessMsg(res?.message || 'Driver dispatch triggered!');
      loadOrders();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      alert(err?.response?.data?.message || err?.message || 'Failed to trigger driver dispatch');
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

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
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
          <span style={{ fontSize: '0.84rem', color: '#94a3b8' }}>
            Showing <strong>{orders.length}</strong> orders
          </span>
        </div>
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
                  <th>Net Earnings</th>
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
                      : ord.orderStatus === 'Packed' || ord.orderStatus === 'Ready for Pickup' || ord.orderStatus === 'Ready to Ship'
                      ? 'vp-badge-packed'
                      : ord.orderStatus === 'Processing'
                      ? 'vp-badge-processing'
                      : ord.orderStatus === 'Confirmed'
                      ? 'vp-badge-confirmed'
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

                      {/* Net Earnings */}
                      <td>
                        <div style={{ fontWeight: 800, color: '#34d399', fontSize: '0.95rem' }}>
                          {formatPrice(ord.vendorEarnings != null ? ord.vendorEarnings : ord.vendorSubtotal)}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 500, marginTop: '2px' }}>
                          Gross: {formatPrice(ord.vendorSubtotal)}
                          {ord.platformFee > 0 && ` (-${ord.commissionRate || 10}%)`}
                        </div>
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

                        {/* Real-time Dispatch Status Banner */}
                        {ord.deliveryStatus === 'Offer Sent' && (
                          <div style={{ marginTop: '0.35rem', fontSize: '0.72rem', color: '#f59e0b', display: 'flex', alignItems: 'center', gap: 4, fontWeight: 600 }}>
                            <Clock size={12} className="animate-spin" />
                            <span>Dispatch: Offer Sent (Awaiting Driver Response)</span>
                          </div>
                        )}
                        {ord.deliveryStatus === 'Pending Assignment' && (
                          <div style={{ marginTop: '0.35rem', fontSize: '0.72rem', color: '#ef4444', display: 'flex', alignItems: 'center', gap: 4, fontWeight: 600 }}>
                            <AlertCircle size={12} />
                            <span>Searching for Driver (Attempt #{ord.assignmentAttempts || 1})</span>
                          </div>
                        )}
                        {ord.deliveryPartner && ord.deliveryStatus !== 'Offer Sent' && (
                          <div style={{ marginTop: '0.35rem', fontSize: '0.72rem', color: '#38bdf8', display: 'flex', alignItems: 'center', gap: 4 }}>
                            <Truck size={12} />
                            <span>Rider: {ord.deliveryPartner.name} ({ord.deliveryStatus})</span>
                          </div>
                        )}
                        {ord.pickupOtp && ['Assigned', 'accepted', 'Accepted', 'Arrived at Pickup', 'Reached Pickup'].includes(ord.deliveryStatus) && (
                          <div style={{ marginTop: '0.35rem', fontSize: '0.74rem', color: '#f59e0b', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
                            <span>🔑 Pickup OTP:</span>
                            <span style={{ background: 'rgba(245, 158, 11, 0.2)', padding: '1px 6px', borderRadius: 4, letterSpacing: '1px' }}>{ord.pickupOtp}</span>
                          </div>
                        )}
                      </td>

                      {/* Action */}
                      <td>
                        <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center', flexWrap: 'wrap' }}>
                          {['Confirmed', 'Processing'].includes(ord.orderStatus) && (
                            <button
                              type="button"
                              className="vp-btn vp-btn-sm"
                              onClick={() => handleQuickUpdate(ord, 'Ready for Pickup')}
                              title="Mark parcel packed and trigger automatic driver dispatch"
                              style={{ padding: '4px 8px', fontSize: '0.74rem', background: '#059669', color: '#fff', fontWeight: 600 }}
                            >
                              Packed / Ready for Driver Pickup
                            </button>
                          )}
                          {['Packed', 'Ready for Pickup'].includes(ord.orderStatus) && ord.deliveryStatus === 'Pending Assignment' && (
                            <button
                              type="button"
                              className="vp-btn vp-btn-sm"
                              onClick={() => handleTriggerDispatch(ord)}
                              title="Retry automatic driver dispatch"
                              style={{ padding: '4px 8px', fontSize: '0.74rem', background: '#f59e0b', color: '#0f172a', fontWeight: 700 }}
                            >
                              Retry Dispatch
                            </button>
                          )}
                          {(!ord.deliveryPartner || ord.deliveryStatus === 'Unassigned' || ord.deliveryStatus === 'Pending Assignment') && ['Packed', 'Ready for Pickup'].includes(ord.orderStatus) && (
                            <button
                              type="button"
                              className="vp-btn vp-btn-primary vp-btn-sm"
                              onClick={() => openManageModal(ord)}
                              title="Assign an active Delivery Boy manually"
                              style={{ padding: '4px 8px', fontSize: '0.74rem', background: '#0284c7', color: '#fff', display: 'inline-flex', alignItems: 'center', gap: 3 }}
                            >
                              <Bike size={12} /> Assign Driver
                            </button>
                          )}
                          <button
                            type="button"
                            className="vp-btn vp-btn-primary vp-btn-sm"
                            onClick={() => openManageModal(ord)}
                            style={{ padding: '4px 8px', fontSize: '0.74rem' }}
                          >
                            Manage
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
                        borderTop: '1px solid rgba(148, 163, 184, 0.1)',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', color: '#cbd5e1', fontSize: '0.85rem', marginBottom: '0.25rem' }}>
                        <span>Store Items Total:</span>
                        <span>{formatPrice(selectedOrder.vendorSubtotal)}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8', fontSize: '0.82rem', marginBottom: '0.35rem' }}>
                        <span>Platform Commission ({selectedOrder.commissionRate || 10}%):</span>
                        <span style={{ color: '#f87171' }}>- {formatPrice(selectedOrder.platformFee || 0)}</span>
                      </div>
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          fontWeight: 800,
                          color: '#34d399',
                          fontSize: '1rem',
                          borderTop: '1px solid rgba(148, 163, 184, 0.1)',
                          paddingTop: '0.4rem',
                        }}
                      >
                        <span>Your Net Payout:</span>
                        <span>{formatPrice(selectedOrder.vendorEarnings != null ? selectedOrder.vendorEarnings : selectedOrder.vendorSubtotal)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* SELLER DELIVERY PARTNER ASSIGNMENT (Requirement 2 & Important Rule) */}
                <div
                  style={{
                    background: 'rgba(56, 189, 248, 0.08)',
                    border: '1px solid rgba(56, 189, 248, 0.25)',
                    borderRadius: '12px',
                    padding: '1.15rem',
                    marginBottom: '1.25rem',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem', flexWrap: 'wrap', gap: 6 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700, color: '#38bdf8', fontSize: '0.9rem' }}>
                      <Bike size={18} />
                      <span>Delivery Partner Assignment (Dispatched by Seller)</span>
                    </div>
                    {selectedOrder.deliveryStatus && (
                      <span className="vp-badge" style={{ background: 'rgba(56, 189, 248, 0.2)', color: '#38bdf8', fontSize: '0.75rem' }}>
                        Delivery: {selectedOrder.deliveryStatus}
                      </span>
                    )}
                  </div>

                  {selectedOrder.deliveryPartner ? (
                    <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '0.85rem', borderRadius: 8, marginBottom: '0.75rem' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.5rem', fontSize: '0.82rem', color: '#cbd5e1' }}>
                        <div><strong>Driver:</strong> {selectedOrder.deliveryPartner.name}</div>
                        <div><strong>Phone:</strong> {selectedOrder.deliveryPartner.phone || 'N/A'}</div>
                        <div><strong>Vehicle:</strong> {selectedOrder.deliveryPartner.vehicleType || 'Motorcycle'} ({selectedOrder.deliveryPartner.vehicleNumber || 'Standard'})</div>
                        {selectedOrder.pickupLocation?.address && (
                          <div style={{ gridColumn: 'span 2' }}>
                            <strong>Pickup Location:</strong> {selectedOrder.pickupLocation.storeName ? `${selectedOrder.pickupLocation.storeName} - ` : ''}{selectedOrder.pickupLocation.address}
                          </div>
                        )}
                      </div>
                      <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: '#38bdf8' }}>
                        ✓ Assigned driver has received pickup assignment notification with your store address.
                      </div>
                      {selectedOrder.pickupOtp && (
                        <div style={{ marginTop: '0.75rem', padding: '0.65rem 0.85rem', background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.3)', borderRadius: 8 }}>
                          <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#f59e0b', textTransform: 'uppercase' }}>Store Handover OTP</div>
                          <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fef08a', letterSpacing: '2px', marginTop: 2 }}>{selectedOrder.pickupOtp}</div>
                          <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: 2 }}>Provide this 4-digit code to the delivery rider when handing over the parcel.</div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p style={{ margin: '0 0 0.75rem 0', fontSize: '0.82rem', color: '#94a3b8' }}>
                      Once your products are packed and marked <strong>Ready for Pickup</strong>, select an active delivery boy to collect the parcel from your store.
                    </p>
                  )}

                  {/* Driver Dropdown & Assign Button */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'flex-end' }}>
                    <div style={{ flex: 1, minWidth: 220 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                        <label className="vp-form-label" style={{ fontSize: '0.78rem', marginBottom: 0 }}>
                          {selectedOrder.deliveryPartner ? 'Reassign Delivery Partner' : 'Select Active Delivery Boy *'}
                        </label>
                        <span
                          style={{
                            fontSize: '0.72rem',
                            color: '#10b981',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 5,
                            background: 'rgba(16, 185, 129, 0.1)',
                            padding: '2px 8px',
                            borderRadius: 6,
                            border: '1px solid rgba(16, 185, 129, 0.25)',
                          }}
                        >
                          <span
                            style={{
                              width: 6,
                              height: 6,
                              borderRadius: '50%',
                              background: '#10b981',
                              boxShadow: '0 0 6px #10b981',
                            }}
                          />
                          Live Fleet ({deliveryPartners.length})
                        </span>
                      </div>
                      <select
                        className="vp-select"
                        value={assignPartnerId}
                        onChange={(e) => setAssignPartnerId(e.target.value)}
                        style={{ fontSize: '0.82rem' }}
                      >
                        <option value="">-- Choose verified driver --</option>
                        {deliveryPartners.map((dp) => (
                          <option key={dp._id} value={dp._id}>
                            {dp.name} ({dp.phone || 'No phone'}) • {dp.vehicleType} [{dp.isOnline ? 'Online' : 'Offline'}] • {dp.activeOrdersCount || 0} active orders
                          </option>
                        ))}
                      </select>
                    </div>

                    <div style={{ width: 100 }}>
                      <label className="vp-form-label" style={{ fontSize: '0.78rem' }}>Driver Fee (₹)</label>
                      <input
                        type="number"
                        min={0}
                        className="vp-input"
                        value={assignFee}
                        onChange={(e) => setAssignFee(e.target.value)}
                        style={{ fontSize: '0.82rem' }}
                      />
                    </div>

                    <button
                      type="button"
                      className="vp-btn vp-btn-primary"
                      disabled={assigningDriver || !assignPartnerId}
                      onClick={() => handleAssignDeliveryPartner(selectedOrder.orderId || selectedOrder._id)}
                      style={{ minHeight: 38, fontSize: '0.82rem', display: 'inline-flex', alignItems: 'center', gap: 6 }}
                    >
                      {assigningDriver ? (
                        <>
                          <RefreshCw size={14} className="animate-spin" /> Assigning...
                        </>
                      ) : (
                        <>
                          <Bike size={14} /> {selectedOrder.deliveryPartner ? 'Reassign Driver' : 'Assign Delivery Boy'}
                        </>
                      )}
                    </button>
                  </div>
                </div>

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
                        <option value="Confirmed">Confirmed (New Order)</option>
                        <option value="Processing">Processing (Preparing & Packaging)</option>
                        <option value="Packed">Packed (Ready for Driver Pickup)</option>
                        <option value="Ready for Pickup">Ready for Pickup</option>
                        <option value="Shipped">Shipped (Handed to Driver / Courier)</option>
                        <option value="Delivered">Delivered (Completed)</option>
                        <option value="Cancelled">Cancelled</option>
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
