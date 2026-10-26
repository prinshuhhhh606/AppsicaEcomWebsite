import React, { useContext } from 'react';
import { X, ShoppingCart, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { CartContext } from '../../context/CartContextValue';
import { formatPrice } from '../../utils/formatPrice';
import './AddToCartPopup.css';

const AddToCartPopup = () => {
  const { cartItems, cartTotal, cartCount, isCartOpen, setIsCartOpen } = useContext(CartContext);
  const lastItem = cartItems[cartItems.length - 1];

  if (!isCartOpen || !lastItem) return null;

  return (
    <div className="acp-overlay" onClick={() => setIsCartOpen(false)}>
      <div className="acp-popup animate-scaleIn" onClick={e => e.stopPropagation()}>
        <div className="acp-header">
          <div className="acp-check">✓</div>
          <span>Added to Cart!</span>
          <button className="acp-close" onClick={() => setIsCartOpen(false)}><X size={18} /></button>
        </div>
        <div className="acp-item">
          {lastItem.images?.[0] && <img src={lastItem.images[0]} alt={lastItem.name} className="acp-img" />}
          <div>
            <p className="acp-name">{lastItem.name}</p>
            <p className="acp-price">{formatPrice(lastItem.price)}</p>
          </div>
        </div>
        <div className="acp-totals">
          <span>{cartCount} items in cart</span>
          <span className="acp-total">{formatPrice(cartTotal)}</span>
        </div>
        <div className="acp-actions">
          <button className="btn btn-secondary btn-sm" onClick={() => setIsCartOpen(false)}>Continue Shopping</button>
          <Link to="/cart" className="btn btn-primary btn-sm" onClick={() => setIsCartOpen(false)}>
            <ShoppingCart size={16} /> View Cart <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AddToCartPopup;
