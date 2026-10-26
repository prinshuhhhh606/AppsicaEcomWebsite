import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, ArrowRight, LockKeyhole } from 'lucide-react';
import { CartContext } from '../../context/CartContextValue';
import { AuthContext } from '../../context/AuthContextValue';
import { formatPrice } from '../../utils/formatPrice';
import PageHeading from '../../Components/common/PageHeading';
import EmptyState from '../../Components/common/EmptyState';

export default function Cart() {
  const { cartItems, cartTotal, updateQuantity, removeFromCart } = useContext(CartContext);
  const { isAuthenticated } = useContext(AuthContext);
  const delivery = cartTotal >= 999 || cartTotal === 0 ? 0 : 79;

  return (
    <div className="container store-page">
      <PageHeading eyebrow="YOUR BAG" title="Shopping cart">
        {cartItems.length
          ? `${cartItems.length} item${cartItems.length === 1 ? '' : 's'} waiting for you.`
          : 'A good find is just around the corner.'}
      </PageHeading>

      {!cartItems.length ? (
        <EmptyState
          icon={<ShoppingBag size={30} />}
          title="Your bag is taking a little break"
          copy="Explore the collection and find something you love, or check on your previous orders."
          action={
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap', marginTop: '1rem' }}>
              <Link to="/products" className="btn btn-primary">
                Start shopping <ArrowRight size={17} />
              </Link>
              <Link to="/my-orders" className="btn btn-secondary">
                View Past Orders
              </Link>
            </div>
          }
        />
      ) : (
        <div className="cart-layout">
          <div className="cart-list">
            {cartItems.map((item) => {
              const itemId = item._id || item.id;
              return (
                <article className="cart-line" key={itemId}>
                  <Link className="cart-line-image" to={`/product/${itemId}`}>
                    {item.images?.[0] ? <img src={item.images[0]} alt={item.name} /> : <ShoppingBag size={28} />}
                  </Link>
                  <div className="cart-line-info">
                    <Link to={`/product/${itemId}`}>
                      <h3>{item.name}</h3>
                    </Link>
                    <span>{item.category?.name || 'Everyday favourite'}</span>
                    <button className="remove-link" onClick={() => removeFromCart(itemId)}>
                      Remove
                    </button>
                  </div>
                  <div className="quantity-control">
                    <button
                      aria-label="Decrease quantity"
                      onClick={() => updateQuantity(itemId, item.quantity - 1)}
                    >
                      −
                    </button>
                    <span>{item.quantity}</span>
                    <button
                      aria-label="Increase quantity"
                      onClick={() => updateQuantity(itemId, item.quantity + 1)}
                    >
                      +
                    </button>
                  </div>
                  <strong className="cart-line-price">{formatPrice(item.price * item.quantity)}</strong>
                </article>
              );
            })}
            <Link className="continue-shopping" to="/products">
              ← Continue shopping
            </Link>
          </div>

          <aside className="order-card">
            <span className="eyebrow">ORDER SUMMARY</span>
            <h2>A few details</h2>
            <div className="summary-row">
              <span>Subtotal</span>
              <b>{formatPrice(cartTotal)}</b>
            </div>
            <div className="summary-row">
              <span>Delivery</span>
              <b>{delivery ? formatPrice(delivery) : 'Free'}</b>
            </div>
            {delivery > 0 && (
              <p className="delivery-hint">Add {formatPrice(999 - cartTotal)} more for free delivery.</p>
            )}
            <div className="summary-divider" />
            <div className="summary-row total">
              <span>Total</span>
              <b>{formatPrice(cartTotal + delivery)}</b>
            </div>
            <Link
              to={isAuthenticated ? '/checkout' : '/login?redirect=/checkout'}
              className="btn btn-primary btn-full btn-lg"
            >
              Continue to checkout <ArrowRight size={17} />
            </Link>
            <div className="secure-note">
              <LockKeyhole size={15} /> Secure checkout · Easy returns
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
