import React, { useContext } from 'react';
import { CartContext } from '../../context/CartContextValue';
import { formatPrice } from '../../utils/formatPrice';
import './OrderSummary.css';

const OrderSummary = ({ deliveryFee = 0, couponDiscount = 0 }) => {
  const { cartItems, cartTotal } = useContext(CartContext);
  const total = cartTotal - couponDiscount + deliveryFee;

  return (
    <div className="order-summary-panel">
      <h3 className="os-title">Your Items ({cartItems.length})</h3>
      <div className="os-items">
        {cartItems.map(item => (
          <div key={item._id} className="os-item">
            <div className="os-item-img">
              {item.images?.[0] ? <img src={item.images[0]} alt={item.name} /> : <div className="os-img-ph">📦</div>}
              <span className="os-qty-badge">{item.quantity}</span>
            </div>
            <div className="os-item-info">
              <p className="os-item-name">{item.name}</p>
              <p className="os-item-price">{formatPrice(item.price)}</p>
            </div>
            <p className="os-item-total">{formatPrice(item.price * item.quantity)}</p>
          </div>
        ))}
      </div>
      <div className="os-breakdown">
        <div className="os-row"><span>Subtotal</span><span>{formatPrice(cartTotal)}</span></div>
        {couponDiscount > 0 && <div className="os-row green"><span>Discount</span><span>-{formatPrice(couponDiscount)}</span></div>}
        <div className="os-row"><span>Delivery</span><span>{deliveryFee === 0 ? <span style={{color:'#10b981'}}>FREE</span> : formatPrice(deliveryFee)}</span></div>
        <div className="os-row os-total-row"><span>Total</span><span>{formatPrice(total)}</span></div>
      </div>
    </div>
  );
};

export default OrderSummary;
