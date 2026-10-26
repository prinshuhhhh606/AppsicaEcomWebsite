import React, { useContext, useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, ShoppingCart, Star, Eye } from 'lucide-react';
import { CartContext } from '../../context/CartContextValue';
import { WishlistContext } from '../../context/WishlistContextValue';
import { NotificationContext } from '../../context/NotificationContextValue';
import { formatPrice, getDiscountPercent } from '../../utils/formatPrice';
import './ProductCard.css';

const ProductCard = ({ product }) => {
  const { addToCart } = useContext(CartContext);
  const { addToWishlist, removeFromWishlist, isWishlisted } = useContext(WishlistContext);
  const { toast } = useContext(NotificationContext);
  const [adding, setAdding] = useState(false);
  const wishlisted = isWishlisted(product._id);
  const discount = getDiscountPercent(product.originalPrice, product.price);

  const handleAddToCart = async (e) => {
    e.preventDefault();
    setAdding(true);
    addToCart(product, 1);
    toast.success(`${product.name} added to cart!`);
    setTimeout(() => setAdding(false), 600);
  };

  const handleWishlist = (e) => {
    e.preventDefault();
    if (wishlisted) { removeFromWishlist(product._id); toast.info('Removed from wishlist'); }
    else { addToWishlist(product); toast.success('Added to wishlist!'); }
  };

  return (
    <Link to={`/product/${product._id}`} className="product-card">
      <div className="product-image-wrap">
        {product.images?.[0]
          ? <img src={product.images[0]} alt={product.name} className="product-img" loading="lazy" />
          : <div className="product-img-placeholder"><ShoppingCart size={40} /></div>
        }
        {discount > 0 && <span className="product-discount-badge">-{discount}%</span>}
        {product.stock === 0 && <div className="product-out-stock">Out of Stock</div>}

        <div className="product-card-overlay">
          <button className={`overlay-btn wishlist-btn ${wishlisted ? 'active' : ''}`} onClick={handleWishlist} title="Wishlist">
            <Heart size={18} fill={wishlisted ? 'currentColor' : 'none'} />
          </button>
          <button className="overlay-btn view-btn" title="Quick View">
            <Eye size={18} />
          </button>
        </div>
      </div>

      <div className="product-card-body">
        <p className="product-category">{product.category?.name || 'Category'}</p>
        <h3 className="product-name">{product.name}</h3>

        <div className="product-rating">
          <div className="stars">
            {[1,2,3,4,5].map(s => <Star key={s} size={13} fill={s <= Math.round(product.rating || 0) ? '#f59e0b' : 'none'} stroke="#f59e0b" />)}
          </div>
          <span className="rating-count">({product.reviewCount || 0})</span>
        </div>

        <div className="product-price-row">
          <span className="product-price">{formatPrice(product.price)}</span>
          {product.originalPrice > product.price && (
            <span className="product-original-price">{formatPrice(product.originalPrice)}</span>
          )}
        </div>

        <button
          className={`btn btn-primary btn-full product-add-btn ${adding ? 'adding' : ''}`}
          onClick={handleAddToCart}
          disabled={product.stock === 0 || adding}
        >
          <ShoppingCart size={16} />
          {adding ? 'Adding...' : product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
        </button>
      </div>
    </Link>
  );
};

export default ProductCard;
