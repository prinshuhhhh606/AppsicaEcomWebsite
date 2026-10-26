import React, { useContext } from 'react';
import { Trash2, Minus, Plus } from 'lucide-react';
import { CartContext } from '../../context/CartContextValue';
import { formatPrice } from '../../utils/formatPrice';
import './CartItem.css';

const CartItem = ({ item }) => {
  const { updateQuantity, removeFromCart } = useContext(CartContext);

  return (
    <div className="cart-item">
      <div className="cart-item-img">
        {item.images?.[0]
          ? <img src={item.images[0]} alt={item.name} />
          : <div className="cart-item-img-placeholder">📦</div>
        }
      </div>
      <div className="cart-item-info">
        <h4 className="cart-item-name">{item.name}</h4>
        <p className="cart-item-category">{item.category?.name}</p>
        <div className="cart-item-price">{formatPrice(item.price)}</div>
      </div>
      <div className="cart-item-controls">
        <div className="qty-control">
          <button className="qty-btn" onClick={() => updateQuantity(item._id, item.quantity - 1)}><Minus size={14} /></button>
          <span className="qty-val">{item.quantity}</span>
          <button className="qty-btn" onClick={() => updateQuantity(item._id, item.quantity + 1)}><Plus size={14} /></button>
        </div>
        <div className="cart-item-total">{formatPrice(item.price * item.quantity)}</div>
        <button className="cart-item-remove" onClick={() => removeFromCart(item._id)}><Trash2 size={18} /></button>
      </div>
    </div>
  );
};

export default CartItem;
