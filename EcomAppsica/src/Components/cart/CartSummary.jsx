import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, ArrowRight, Tag } from 'lucide-react';
import { CartContext } from '../../context/CartContextValue';
import { AuthContext } from '../../context/AuthContextValue';
import { formatPrice } from '../../utils/formatPrice';
import './CartSummary.css';

const CartSummary = ({ couponDiscount = 0, deliveryFee = 0, showCheckout = true }) => {
  const { cartTotal } = useContext(CartContext);
  const { isAuthenticated } = useContext(AuthContext);
  const subtotal = cartTotal;
  const discount = couponDiscount;
  const total = subtotal - discount + (subtotal > 0 ? deliveryFee : 0);

  return (
    <div className="cart-summary">
      <h3 className="sum-title">Order Summary</h3>

      <div className="sum-rows">
        <div className="sum-row"><span>Subtotal</span><span>{formatPrice(subtotal)}</span></div>
        {discount > 0 && <div className="sum-row discount"><span><Tag size={14} /> Coupon Discount</span><span>-{formatPrice(discount)}</span></div>}
        <div className="sum-row"><span>Delivery</span><span>{deliveryFee === 0 ? <span className="free-text">FREE</span> : formatPrice(deliveryFee)}</span></div>
      </div>

      <div className="sum-divider" />

      <div className="sum-row total">
        <span>Total</span>
        <span>{formatPrice(total)}</span>
      </div>

      {subtotal > 500 && deliveryFee === 0 && (
        <p className="sum-free-note">🎉 You get free delivery!</p>
      )}

      {showCheckout && (
        <Link
          to={isAuthenticated ? '/checkout' : '/login?redirect=/checkout'}
          className="btn btn-primary btn-full btn-lg"
          style={{ marginTop: 20 }}
        >
          Proceed to Checkout <ArrowRight size={18} />
        </Link>
      )}

      <Link to="/products" className="btn btn-secondary btn-full" style={{ marginTop: 10 }}>
        <ShoppingBag size={16} /> Continue Shopping
      </Link>
    </div>
  );
};

export default CartSummary;
