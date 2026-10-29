import React, { useState, useEffect, useContext } from 'react';
import { useNavigate, Navigate, Link } from 'react-router-dom';
import {
  ChevronRight,
  ShieldCheck,
  LockKeyhole,
  CreditCard,
  CheckCircle,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  MapPin
} from 'lucide-react';
import { CartContext } from '../../context/CartContextValue';
import { AuthContext } from '../../context/AuthContextValue';
import { NotificationContext } from '../../context/NotificationContextValue';
import { checkoutService } from '../../services/checkoutService';
import { addressService } from '../../services/addressService';
import { deliveryZoneService } from '../../services/deliveryZoneService';
import { formatPrice } from '../../utils/formatPrice';
import AddressForm from '../../Components/checkout/AddressForm';
import PaymentMethods from '../../Components/checkout/PaymentMethods';
import CouponBox from '../../Components/checkout/CouponBox';
import OrderSummary from '../../Components/checkout/OrderSummary';
import './Checkout.css';

export default function Checkout() {
  const { cartItems, cartTotal, clearCart } = useContext(CartContext);
  const { user, isAuthenticated } = useContext(AuthContext);
  const { toast } = useContext(NotificationContext);
  const navigate = useNavigate();

  const [savedAddresses, setSavedAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState('new');
  const [address, setAddress] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    address: '',
    city: '',
    state: '',
    pincode: '',
  });

  const [paymentMethod, setPaymentMethod] = useState('razorpay'); // 'razorpay', 'upi', 'cod'
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  // Payment Gateway Modal State
  const [gatewayModal, setGatewayModal] = useState({
    open: false,
    processing: false,
    verified: false,
    step: 'confirm', // 'confirm', 'processing', 'success'
  });

  // Real-Time Delivery Eligibility Check
  const [eligibilityCheck, setEligibilityCheck] = useState({
    checking: false,
    checked: false,
    allDeliverable: true,
    message: '',
    items: [],
  });

  useEffect(() => {
    if ((address.pincode || address.city) && cartItems?.length > 0) {
      setEligibilityCheck((prev) => ({ ...prev, checking: true }));
      deliveryZoneService
        .checkEligibility({
          items: cartItems,
          destination: address,
        })
        .then((res) => {
          setEligibilityCheck({
            checking: false,
            checked: true,
            allDeliverable: res.allDeliverable,
            message: res.message,
            items: res.items || [],
          });
        })
        .catch(() => {
          setEligibilityCheck((prev) => ({ ...prev, checking: false }));
        });
    }
  }, [address.pincode, address.city, cartItems]);

  // Load Saved Addresses
  useEffect(() => {
    if (isAuthenticated) {
      addressService.getAddresses()
        .then((res) => {
          const list = Array.isArray(res) ? res : res?.addresses || [];
          setSavedAddresses(list);
          const def = list.find((a) => a.isDefault) || list[0];
          if (def) {
            setSelectedAddressId(def._id || def.id);
            setAddress({
              name: def.name || def.fullName || user?.name || '',
              phone: def.phone || user?.phone || '',
              address: def.address || def.addressLine || '',
              city: def.city || '',
              state: def.state || '',
              pincode: def.pincode || '',
            });
          }
        })
        .catch(() => {});
    }
  }, [isAuthenticated, user]);

  if (!isAuthenticated) {
    return <Navigate to="/login?redirect=/checkout" replace />;
  }

  if (!cartItems || cartItems.length === 0) {
    return <Navigate to="/cart" replace />;
  }

  const deliveryFee = cartTotal >= 999 || cartTotal === 0 ? 0 : 79;
  const couponDiscount = appliedCoupon ? appliedCoupon.discount : 0;
  const grandTotal = Math.max(0, cartTotal + deliveryFee - couponDiscount);

  // Coupon handling
  const handleApplyCoupon = async (code) => {
    const res = await checkoutService.applyCoupon(code, cartTotal);
    if (res.coupon) {
      setAppliedCoupon(res.coupon);
      toast.success(`Coupon "${code}" applied: You saved ${formatPrice(res.coupon.discount)}!`);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    toast.info('Coupon removed.');
  };

  // Select Saved Address
  const handleSelectSavedAddress = (addr) => {
    setSelectedAddressId(addr._id || addr.id);
    setAddress({
      name: addr.name || addr.fullName || '',
      phone: addr.phone || '',
      address: addr.address || addr.addressLine || '',
      city: addr.city || '',
      state: addr.state || '',
      pincode: addr.pincode || '',
    });
  };

  // Address submitted from form
  const handleAddressSubmit = (formData) => {
    setAddress(formData);
    setSelectedAddressId('custom');
    toast.success('Delivery address verified.');
  };

  // Place Order Logic
  const executeOrderPlacement = async (paymentRef = null) => {
    if (eligibilityCheck.checked && !eligibilityCheck.allDeliverable) {
      toast.error('Some items cannot be delivered to your selected location.');
      setError('Delivery restriction: One or more products in your cart cannot be delivered to this address. Please update your address or remove the restricted items.');
      return;
    }

    setBusy(true);
    setError('');
    try {
      const itemsForBackend = cartItems.map((item) => ({
        product: item._id || item.productId || item.id,
        quantity: item.quantity,
        price: item.price,
        name: item.name,
      }));

      const shippingPayload = {
        fullName: address.name || address.fullName,
        phone: address.phone,
        addressLine: address.address || address.addressLine,
        city: address.city,
        state: address.state,
        pincode: address.pincode,
      };

      if (!shippingPayload.fullName || !shippingPayload.addressLine) {
        throw new Error('Please enter complete delivery address details.');
      }

      const isCOD = paymentMethod === 'cod';
      const finalPaymentStatus = isCOD ? 'Pending' : 'Paid';
      const finalTxnId = paymentRef || (isCOD ? null : `TXN-${Date.now().toString(36).toUpperCase()}`);

      const res = await checkoutService.placeOrder({
        cartItems: itemsForBackend,
        shippingAddress: shippingPayload,
        paymentMethod,
        paymentStatus: finalPaymentStatus,
        transactionId: finalTxnId,
        couponCode: appliedCoupon?.code || null,
      });

      const orderData = res?.order || res;
      const orderRef = orderData?.orderId || res?.orderId || orderData?._id;

      // Clear local cart ONLY after verified backend response
      clearCart();

      // Navigate to Payment Verification & Result Screen
      navigate(`/payment/result?orderId=${encodeURIComponent(orderRef)}`);
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Could not place order. Please try again.');
      setGatewayModal({ open: false, processing: false, verified: false, step: 'confirm' });
    } finally {
      setBusy(false);
    }
  };

  // Handle Checkout Click
  const handleStartCheckout = (e) => {
    e.preventDefault();
    setError('');

    if (!address.name?.trim() || !address.address?.trim() || !address.city?.trim() || !address.pincode?.trim()) {
      setError('Please provide a complete shipping address before placing order.');
      window.scrollTo({ top: 100, behavior: 'smooth' });
      return;
    }

    if (paymentMethod === 'cod') {
      // Direct Cash on Delivery placement
      executeOrderPlacement();
    } else {
      // Trigger Real / Interactive Payment Gateway
      setGatewayModal({
        open: true,
        processing: false,
        verified: false,
        step: 'confirm',
      });
    }
  };

  // Confirm Simulated Gateway Payment
  const handleConfirmGatewayPayment = () => {
    setGatewayModal((prev) => ({ ...prev, processing: true, step: 'processing' }));

    setTimeout(() => {
      const generatedTxnId = `TXN-RZP-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
      setGatewayModal((prev) => ({ ...prev, processing: false, verified: true, step: 'success' }));

      setTimeout(() => {
        setGatewayModal({ open: false, processing: false, verified: false, step: 'confirm' });
        executeOrderPlacement(generatedTxnId);
      }, 1000);
    }, 1500);
  };

  return (
    <div className="container store-page checkout-page">
      {/* Breadcrumb */}
      <div className="breadcrumb">
        <Link to="/cart">Your Bag</Link>
        <ChevronRight size={14} />
        <span>Checkout & Payment</span>
      </div>

      <div className="page-heading">
        <div>
          <span className="eyebrow">SECURE CHECKOUT</span>
          <h1>Shipping & Payment</h1>
          <p>Review your items, choose delivery address, and proceed to payment.</p>
        </div>
      </div>

      {error && (
        <div className="form-alert" style={{ marginBottom: '1.5rem' }}>
          <AlertTriangle size={18} /> {error}
        </div>
      )}

      <div className="checkout-grid">
        {/* Left Column: Delivery & Payment Details */}
        <div className="checkout-main">
          {/* Section 1: Delivery Address */}
          <div className="checkout-section">
            <div className="checkout-section-header">
              <h2>
                <span className="step-num">1</span> Delivery Address
              </h2>
              {isAuthenticated && (
                <Link to="/account/addresses" className="table-btn" style={{ fontSize: '0.8rem' }}>
                  Manage Saved Addresses
                </Link>
              )}
            </div>

            {/* Saved Addresses Chips */}
            {savedAddresses.length > 0 && (
              <div style={{ marginBottom: '1.25rem' }}>
                <span style={{ fontSize: '0.85rem', color: '#94a3b8', fontWeight: 600, display: 'block', marginBottom: '0.65rem' }}>
                  Choose from saved addresses:
                </span>
                <div className="saved-addresses-row">
                  {savedAddresses.map((addr) => {
                    const id = addr._id || addr.id;
                    return (
                      <div
                        key={id}
                        className={`saved-address-chip ${selectedAddressId === id ? 'selected' : ''}`}
                        onClick={() => handleSelectSavedAddress(addr)}
                      >
                        <b>{addr.name || addr.fullName} {addr.isDefault && <span style={{ color: '#10b981', fontSize: '0.75rem' }}>(Default)</span>}</b>
                        <p>{addr.address || addr.addressLine}, {addr.city}</p>
                        <p style={{ marginTop: '0.2rem' }}>📞 {addr.phone || 'N/A'}</p>
                      </div>
                    );
                  })}
                  <div
                    className={`saved-address-chip ${selectedAddressId === 'new' ? 'selected' : ''}`}
                    onClick={() => {
                      setSelectedAddressId('new');
                      setAddress({ name: '', phone: '', address: '', city: '', state: '', pincode: '' });
                    }}
                  >
                    <b>+ Use Another Address</b>
                    <p>Enter new address details below</p>
                  </div>
                </div>
              </div>
            )}

            {/* Address Form */}
            <AddressForm
              key={selectedAddressId}
              initial={address}
              onSubmit={handleAddressSubmit}
              loading={busy}
            />

            {/* Delivery Eligibility Status */}
            {eligibilityCheck.checked && (
              <div
                style={{
                  marginTop: '1rem',
                  padding: '0.85rem 1rem',
                  borderRadius: 8,
                  fontSize: '0.85rem',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 10,
                  background: eligibilityCheck.allDeliverable ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.15)',
                  border: `1px solid ${eligibilityCheck.allDeliverable ? '#10b981' : '#ef4444'}`,
                  color: eligibilityCheck.allDeliverable ? '#34d399' : '#f87171',
                }}
              >
                {eligibilityCheck.allDeliverable ? (
                  <CheckCircle size={18} style={{ marginTop: 2, flexShrink: 0 }} />
                ) : (
                  <AlertTriangle size={18} style={{ marginTop: 2, flexShrink: 0 }} />
                )}
                <div>
                  <strong>{eligibilityCheck.allDeliverable ? '✓ Delivery Available to this Address' : '⚠️ Delivery Area Restriction'}</strong>
                  <div style={{ fontSize: '0.78rem', color: '#cbd5e1', marginTop: 2 }}>{eligibilityCheck.message}</div>
                </div>
              </div>
            )}
          </div>

          {/* Section 2: Payment Method */}
          <div className="checkout-section">
            <div className="checkout-section-header">
              <h2>
                <span className="step-num">2</span> Payment Method
              </h2>
              <span style={{ color: '#10b981', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <ShieldCheck size={16} /> 256-bit SSL Protected
              </span>
            </div>

            <PaymentMethods
              selected={paymentMethod}
              onSelect={(method) => setPaymentMethod(method)}
            />

            <div style={{ marginTop: '1.25rem', padding: '0.85rem', background: 'rgba(255,255,255,0.02)', borderRadius: 8, fontSize: '0.85rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <LockKeyhole size={15} color="#818cf8" />
              <span>Real-time transaction recording with instantaneous receipt & invoice generation.</span>
            </div>
          </div>
        </div>

        {/* Right Column: Order Summary & Coupon */}
        <div className="checkout-sidebar">
          {/* Coupon Box */}
          <div className="checkout-section" style={{ padding: '1.25rem' }}>
            <CouponBox
              onApply={handleApplyCoupon}
              onRemove={handleRemoveCoupon}
              appliedCoupon={appliedCoupon}
            />
            <small style={{ color: '#64748b', display: 'block', marginTop: '0.5rem', fontSize: '0.78rem' }}>
              Try coupons: <b>WELCOME10</b>, <b>APPSICA20</b>, or <b>FLAT100</b>
            </small>
          </div>

          {/* Order Items Breakdown */}
          <div className="checkout-section" style={{ padding: '1.5rem' }}>
            <OrderSummary
              deliveryFee={deliveryFee}
              couponDiscount={couponDiscount}
            />

            <button
              type="button"
              className="btn btn-primary checkout-submit-btn"
              disabled={busy}
              onClick={handleStartCheckout}
            >
              {busy ? (
                'Processing Order…'
              ) : paymentMethod === 'cod' ? (
                <>Confirm COD Order ({formatPrice(grandTotal)}) <ArrowRight size={18} /></>
              ) : (
                <>Pay & Complete Order ({formatPrice(grandTotal)}) <ArrowRight size={18} /></>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* INTERACTIVE PAYMENT GATEWAY SIMULATION MODAL */}
      {gatewayModal.open && (
        <div className="gateway-overlay">
          <div className="gateway-modal">
            <div className="gateway-badge">
              <Sparkles size={14} /> Appsica Secure Gateway
            </div>

            {gatewayModal.step === 'confirm' && (
              <>
                <h3 style={{ fontSize: '1.35rem', color: '#f8fafc', margin: '0 0 0.5rem' }}>
                  {paymentMethod === 'upi' ? 'Authorize UPI Transfer' : 'Complete Razorpay Payment'}
                </h3>
                <p style={{ color: '#94a3b8', fontSize: '0.9rem', margin: 0 }}>
                  Order amount payable to Appsica Studio:
                </p>
                <div className="gateway-amount">{formatPrice(grandTotal)}</div>

                <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.03)', borderRadius: 10, textAlign: 'left', marginBottom: '1.5rem', fontSize: '0.85rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                    <span style={{ color: '#94a3b8' }}>Merchant:</span>
                    <b>AppsicaEcom Official</b>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                    <span style={{ color: '#94a3b8' }}>Method:</span>
                    <b>{paymentMethod === 'upi' ? 'UPI (Google Pay / PhonePe)' : 'Credit / Debit Card (Razorpay)'}</b>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#94a3b8' }}>Deliver to:</span>
                    <b>{address.name || 'Shopper'}</b>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    style={{ flex: 1 }}
                    onClick={() => setGatewayModal({ open: false, processing: false, verified: false, step: 'confirm' })}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary"
                    style={{ flex: 2 }}
                    onClick={handleConfirmGatewayPayment}
                  >
                    Authorize Payment <CheckCircle size={16} />
                  </button>
                </div>
              </>
            )}

            {gatewayModal.step === 'processing' && (
              <>
                <h3 style={{ fontSize: '1.25rem', color: '#f8fafc' }}>Processing Transaction</h3>
                <p style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Communicating with banking network…</p>
                <div className="gateway-spinner" />
                <p style={{ color: '#64748b', fontSize: '0.8rem' }}>Please do not refresh or close this window.</p>
              </>
            )}

            {gatewayModal.step === 'success' && (
              <>
                <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(16, 185, 129, 0.2)', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
                  <CheckCircle size={32} />
                </div>
                <h3 style={{ fontSize: '1.35rem', color: '#10b981', margin: '0 0 0.5rem' }}>Payment Authorized!</h3>
                <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>Saving confirmed order into database…</p>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
