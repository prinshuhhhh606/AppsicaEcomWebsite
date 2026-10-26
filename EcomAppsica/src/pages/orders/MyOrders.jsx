import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import {
  PackageCheck,
  CircleAlert,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Clock,
  Truck,
  CheckCircle2,
  XCircle,
  ShoppingBag,
  FileText,
  RotateCcw,
  Printer
} from 'lucide-react';
import { AuthContext } from '../../context/AuthContextValue';
import { NotificationContext } from '../../context/NotificationContextValue';
import { orderService } from '../../services/orderService';
import { formatPrice } from '../../utils/formatPrice';

export default function MyOrders() {
  const { isAuthenticated } = useContext(AuthContext);
  const { toast } = useContext(NotificationContext);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedId, setExpandedId] = useState(null);

  // Invoice Modal
  const [invoiceOrder, setInvoiceOrder] = useState(null);

  const fetchOrders = () => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }
    setLoading(true);
    orderService
      .getMyOrders()
      .then((res) => {
        const list = res?.orders || res?.data?.orders || (Array.isArray(res) ? res : []);
        setOrders(list);
      })
      .catch((err) => {
        setError(err?.response?.data?.message || err?.message || 'Unable to load your orders right now.');
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchOrders();
  }, [isAuthenticated]);

  const handleCancelOrder = async (orderId) => {
    const reason = window.prompt('Please enter a cancellation reason:');
    if (reason === null) return;
    if (!reason.trim()) {
      toast.error('Please specify a cancellation reason.');
      return;
    }

    try {
      await orderService.cancelOrder(orderId, reason);
      toast.success('Order cancelled successfully. Inventory restored.');
      fetchOrders();
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.message || 'Could not cancel this order.');
    }
  };

  const handleRequestReturn = async (orderId) => {
    const reason = window.prompt('Please specify the return reason (e.g. Size issue, Defective item):');
    if (reason === null) return;
    if (!reason.trim()) {
      toast.error('Please specify a reason for return.');
      return;
    }

    try {
      await orderService.requestReturn(orderId, reason);
      toast.success('Return requested. Our team will schedule a pickup.');
      fetchOrders();
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.message || 'Could not place return request.');
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="container store-page">
        <div className="page-heading">
          <div>
            <span className="eyebrow">YOUR APPSICA ACCOUNT</span>
            <h1>Your orders</h1>
            <p>Track and review your purchases.</p>
          </div>
        </div>
        <div className="empty-state">
          <div className="empty-state-icon">
            <PackageCheck size={32} />
          </div>
          <h2>Sign in to view your orders</h2>
          <p>Please sign in to view your real-time order history.</p>
          <Link to="/login" className="btn btn-primary">
            Sign in to your account <ArrowRight size={17} />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container store-page">
      <div className="page-heading">
        <div>
          <span className="eyebrow">YOUR APPSICA ACCOUNT</span>
          <h1>My Orders</h1>
          <p>View your order history, track live shipments, and download tax invoices.</p>
        </div>
      </div>

      {error && (
        <div className="form-alert" style={{ marginBottom: '1.5rem' }}>
          <CircleAlert size={17} /> {error}
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem 0' }}>
          <div
            style={{
              width: 40,
              height: 40,
              border: '3px solid rgba(99,102,241,0.2)',
              borderTopColor: '#6366f1',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 1rem',
            }}
          />
          <p style={{ color: '#94a3b8' }}>Fetching your live order history from database…</p>
        </div>
      ) : orders.length ? (
        <div className="orders-list" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {orders.map((order) => {
            const id = order.orderId || order._id;
            const status = order.orderStatus || 'Confirmed';
            const paymentStatus = order.paymentStatus || 'Pending';
            const dateStr = order.createdAt ? new Date(order.createdAt).toLocaleDateString('en-IN', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            }) : 'Recent';
            const isExpanded = expandedId === (order._id || id);

            const isCancellable = ['Order Placed', 'Confirmed', 'Processing'].includes(status);
            const isDelivered = status === 'Delivered';

            return (
              <article
                key={id}
                style={{
                  background: 'rgba(18, 20, 29, 0.85)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: 14,
                  padding: '1.5rem',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
                }}
              >
                {/* Header row */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '1rem',
                    cursor: 'pointer',
                  }}
                  onClick={() => setExpandedId(isExpanded ? null : (order._id || id))}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                    <div
                      style={{
                        width: 42,
                        height: 42,
                        borderRadius: 10,
                        background: 'rgba(99, 102, 241, 0.15)',
                        color: '#818cf8',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <PackageCheck size={22} />
                    </div>
                    <div>
                      <b style={{ fontSize: '1.05rem', color: '#f8fafc' }}>Order #{order.orderId}</b>
                      <div style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
                        Placed on {dateStr} · {order.items?.length || 1} item(s) · {order.paymentMethod?.toUpperCase()}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                    {/* Payment Status Badge */}
                    <span
                      style={{
                        padding: '0.25rem 0.65rem',
                        borderRadius: 6,
                        fontSize: '0.78rem',
                        fontWeight: 600,
                        background:
                          paymentStatus === 'Paid'
                            ? 'rgba(16, 185, 129, 0.15)'
                            : paymentStatus === 'Pending'
                            ? 'rgba(245, 158, 11, 0.15)'
                            : 'rgba(239, 68, 68, 0.15)',
                        color:
                          paymentStatus === 'Paid'
                            ? '#34d399'
                            : paymentStatus === 'Pending'
                            ? '#fbbf24'
                            : '#ef4444',
                      }}
                    >
                      Payment: {paymentStatus}
                    </span>

                    {/* Order Status Badge */}
                    <span
                      style={{
                        padding: '0.25rem 0.65rem',
                        borderRadius: 6,
                        fontSize: '0.78rem',
                        fontWeight: 600,
                        background:
                          status === 'Delivered'
                            ? 'rgba(16, 185, 129, 0.15)'
                            : status === 'Cancelled'
                            ? 'rgba(239, 68, 68, 0.15)'
                            : status === 'Shipped' || status === 'Out for Delivery'
                            ? 'rgba(168, 85, 247, 0.15)'
                            : 'rgba(99, 102, 241, 0.15)',
                        color:
                          status === 'Delivered'
                            ? '#34d399'
                            : status === 'Cancelled'
                            ? '#f87171'
                            : status === 'Shipped' || status === 'Out for Delivery'
                            ? '#c084fc'
                            : '#818cf8',
                      }}
                    >
                      {status}
                    </span>

                    <strong style={{ fontSize: '1.15rem', color: '#f8fafc', marginLeft: '0.5rem' }}>
                      {formatPrice(order.total)}
                    </strong>

                    {isExpanded ? <ChevronUp size={18} color="#94a3b8" /> : <ChevronDown size={18} color="#94a3b8" />}
                  </div>
                </div>

                {/* Quick Action Buttons */}
                <div
                  style={{
                    display: 'flex',
                    gap: '0.75rem',
                    alignItems: 'center',
                    marginTop: '1.25rem',
                    paddingTop: '1rem',
                    borderTop: '1px solid rgba(255, 255, 255, 0.05)',
                    flexWrap: 'wrap',
                  }}
                >
                  <Link
                    to={`/track-order/${order.orderId}`}
                    className="btn btn-primary btn-sm"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
                  >
                    <Truck size={15} /> Track Order Progress
                  </Link>

                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => setInvoiceOrder(order)}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
                  >
                    <FileText size={15} /> View Invoice
                  </button>

                  {isCancellable && (
                    <button
                      className="btn btn-danger btn-sm"
                      style={{ background: 'rgba(239, 68, 68, 0.12)', color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.25)', marginLeft: 'auto' }}
                      onClick={() => handleCancelOrder(order.orderId || id)}
                    >
                      Cancel Order
                    </button>
                  )}

                  {isDelivered && (
                    <button
                      className="btn btn-secondary btn-sm"
                      style={{ marginLeft: 'auto', display: 'inline-flex', alignItems: 'center', gap: 6 }}
                      onClick={() => handleRequestReturn(order.orderId || id)}
                    >
                      <RotateCcw size={14} /> Request Return
                    </button>
                  )}
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div
                    style={{
                      borderTop: '1px solid rgba(255,255,255,0.08)',
                      marginTop: '1.25rem',
                      paddingTop: '1.25rem',
                    }}
                  >
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                        gap: '1.5rem',
                        marginBottom: '1.25rem',
                      }}
                    >
                      {/* Shipping Info */}
                      <div>
                        <h4 style={{ fontSize: '0.85rem', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                          Delivery Address
                        </h4>
                        <p style={{ margin: 0, color: '#f1f5f9', fontSize: '0.9rem', lineHeight: 1.5 }}>
                          <b>{order.shippingAddress?.fullName || 'Customer'}</b><br />
                          {order.shippingAddress?.addressLine}<br />
                          {order.shippingAddress?.city}, {order.shippingAddress?.state} - {order.shippingAddress?.pincode}<br />
                          Phone: {order.shippingAddress?.phone || 'N/A'}
                        </p>
                      </div>

                      {/* Payment & Logistics Info */}
                      <div>
                        <h4 style={{ fontSize: '0.85rem', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                          Logistics & Waybill
                        </h4>
                        <p style={{ margin: 0, color: '#f1f5f9', fontSize: '0.9rem', lineHeight: 1.5 }}>
                          Courier: <b>{order.courierName || 'BlueDart Express'}</b><br />
                          Tracking No: <code style={{ color: '#818cf8' }}>{order.trackingNumber || 'Pending Dispatch'}</code><br />
                          Transaction Ref: <code>{order.transactionId || `TXN-${id}`}</code>
                        </p>
                      </div>
                    </div>

                    {/* Items List */}
                    <h4 style={{ fontSize: '0.85rem', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '0.75rem' }}>
                      Purchased Items ({order.items?.length || 0})
                    </h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      {order.items?.map((it, idx) => (
                        <div
                          key={idx}
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '0.65rem 0.85rem',
                            background: 'rgba(255,255,255,0.02)',
                            borderRadius: 8,
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            {it.image && (
                              <img
                                src={it.image}
                                alt={it.name}
                                style={{ width: 38, height: 38, objectFit: 'cover', borderRadius: 4 }}
                              />
                            )}
                            <div>
                              <span style={{ color: '#f1f5f9', fontWeight: 500 }}>{it.name || it.product?.name}</span>
                              <small style={{ color: '#94a3b8', display: 'block' }}>Qty: {it.quantity} × {formatPrice(it.price)}</small>
                            </div>
                          </div>
                          <b style={{ color: '#f8fafc' }}>{formatPrice(it.price * it.quantity)}</b>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      ) : (
        <div className="empty-state">
          <div className="empty-state-icon">
            <ShoppingBag size={32} />
          </div>
          <h2>No orders yet</h2>
          <p>Your placed orders will show up here in real time.</p>
          <Link to="/products" className="btn btn-primary">
            Find something lovely <ArrowRight size={17} />
          </Link>
        </div>
      )}

      {/* Printable Invoice Modal */}
      {invoiceOrder && (
        <div className="admin-modal-overlay">
          <div className="admin-modal" style={{ maxWidth: 680, padding: 0 }}>
            <div className="admin-modal-header" style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
              <h2>Tax Invoice #{invoiceOrder.invoiceNumber || invoiceOrder.orderId}</h2>
              <button className="admin-modal-close" onClick={() => setInvoiceOrder(null)}>✕</button>
            </div>

            <div style={{ padding: '1.75rem', maxHeight: '70vh', overflowY: 'auto' }} id="printable-invoice">
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
                  <b style={{ color: '#f8fafc', fontSize: '1rem' }}>Invoice: {invoiceOrder.invoiceNumber || `INV-${invoiceOrder.orderId}`}</b>
                  <p style={{ margin: '0.25rem 0 0', color: '#94a3b8', fontSize: '0.85rem' }}>
                    Order ID: #{invoiceOrder.orderId}<br />
                    Date: {new Date(invoiceOrder.createdAt).toLocaleDateString()}<br />
                    Status: <strong style={{ color: invoiceOrder.paymentStatus === 'Paid' ? '#34d399' : '#fbbf24' }}>{invoiceOrder.paymentStatus}</strong>
                  </p>
                </div>
              </div>

              {/* Billed To */}
              <div style={{ marginBottom: '1.5rem' }}>
                <span style={{ fontSize: '0.8rem', color: '#94a3b8', textTransform: 'uppercase' }}>Billed & Shipped To:</span>
                <p style={{ margin: '0.25rem 0 0', color: '#f1f5f9', fontSize: '0.9rem' }}>
                  <strong>{invoiceOrder.shippingAddress?.fullName}</strong><br />
                  {invoiceOrder.shippingAddress?.addressLine}<br />
                  {invoiceOrder.shippingAddress?.city}, {invoiceOrder.shippingAddress?.state} - {invoiceOrder.shippingAddress?.pincode}<br />
                  Phone: {invoiceOrder.shippingAddress?.phone}
                </p>
              </div>

              {/* Items Table */}
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
                  {invoiceOrder.items?.map((it, idx) => (
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

              {/* Totals */}
              <div style={{ width: 260, marginLeft: 'auto', fontSize: '0.9rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.35rem 0', color: '#94a3b8' }}>
                  <span>Subtotal:</span>
                  <span>{formatPrice(invoiceOrder.subtotal)}</span>
                </div>
                {invoiceOrder.discount > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.35rem 0', color: '#34d399' }}>
                    <span>Discount:</span>
                    <span>-{formatPrice(invoiceOrder.discount)}</span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.35rem 0', color: '#94a3b8' }}>
                  <span>Delivery Charges:</span>
                  <span>{invoiceOrder.delivery === 0 ? 'Free' : formatPrice(invoiceOrder.delivery)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem 0 0', borderTop: '1px solid rgba(255,255,255,0.1)', color: '#f8fafc', fontWeight: 'bold', fontSize: '1.1rem' }}>
                  <span>Grand Total:</span>
                  <span style={{ color: '#818cf8' }}>{formatPrice(invoiceOrder.total)}</span>
                </div>
              </div>
            </div>

            <div style={{ padding: '1rem 1.5rem', background: 'rgba(255,255,255,0.02)', borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
              <button
                className="btn btn-primary"
                onClick={() => window.print()}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
              >
                <Printer size={16} /> Print Invoice
              </button>
              <button className="btn btn-secondary" onClick={() => setInvoiceOrder(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
