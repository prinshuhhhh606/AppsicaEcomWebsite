import React, { useContext, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  CircleAlert,
  ShoppingBag,
  ShoppingCart,
  Heart,
  Truck,
  RotateCcw,
  ChevronRight,
  MapPin,
  CheckCircle2,
  Compass,
} from 'lucide-react';
import { CartContext } from '../../context/CartContextValue';
import { WishlistContext } from '../../context/WishlistContextValue';
import { NotificationContext } from '../../context/NotificationContextValue';
import { AuthContext } from '../../context/AuthContextValue';
import { productService } from '../../services/productService';
import { deliveryZoneService } from '../../services/deliveryZoneService';
import { formatPrice, getDiscountPercent } from '../../utils/formatPrice';

function getProduct(payload) {
  return payload?.product || payload?.data?.product || payload?.data || payload;
}

function readableError(error, fallback) {
  return error?.response?.data?.message || error?.message || fallback;
}

export default function ProductDetails() {
  const { id } = useParams();
  const { addToCart } = useContext(CartContext);
  const { addToWishlist, removeFromWishlist, isWishlisted } = useContext(WishlistContext);
  const { toast } = useContext(NotificationContext);
  const { isAuthenticated } = useContext(AuthContext);

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reviews, setReviews] = useState([]);
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '', title: '' });
  const [reviewBusy, setReviewBusy] = useState(false);

  // Delivery Availability Checker State
  const [checkPincode, setCheckPincode] = useState('');
  const [checkingEligibility, setCheckingEligibility] = useState(false);
  const [eligibilityResult, setEligibilityResult] = useState(null);

  const handleCheckEligibility = async (e) => {
    e?.preventDefault();
    if (!checkPincode.trim()) {
      toast.info('Please enter your delivery pincode or area');
      return;
    }
    setCheckingEligibility(true);
    try {
      const res = await deliveryZoneService.checkEligibility({
        productId: product?._id,
        destination: { pincode: checkPincode.trim(), city: checkPincode.trim() },
      });
      setEligibilityResult({
        checked: true,
        eligible: res.eligible,
        status: res.status,
        message: res.message || (res.eligible ? 'Available for delivery' : 'Not available in your area'),
        distanceKm: res.distanceKm,
        estimatedDeliveryMinutes: res.estimatedDeliveryMinutes,
        estimatedDeliveryDays: res.estimatedDeliveryDays,
        deliveryMode: res.deliveryMode,
        zoneName: res.zoneName,
      });
    } catch (err) {
      setEligibilityResult({
        checked: true,
        eligible: false,
        message: err?.response?.data?.message || 'Delivery availability needs to be checked',
      });
    } finally {
      setCheckingEligibility(false);
    }
  };

  useEffect(() => {
    let active = true;
    productService
      .getById(id)
      .then((result) => {
        if (active) {
          const item = getProduct(result);
          setProduct(item);
          if (item?.reviews) setReviews(item.reviews);
        }
      })
      .catch((requestError) => {
        if (active) setError(readableError(requestError, 'This product could not be loaded.'));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [id]);

  if (loading) {
    return (
      <div className="container store-page">
        <div className="product-detail-skeleton skeleton" />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="container store-page">
        <div className="notice-card">
          <CircleAlert />
          <h2>We couldn’t find that product</h2>
          <p>{error || 'This product may have been removed.'}</p>
          <Link className="btn btn-primary" to="/products">
            Back to shop
          </Link>
        </div>
      </div>
    );
  }

  const image = product.images?.[0] || product.image;
  const productId = product._id || product.id;
  const wishlisted = isWishlisted(productId);

  async function handleAddReview(e) {
    e.preventDefault();
    if (!reviewForm.comment.trim()) return;
    setReviewBusy(true);
    try {
      const res = await productService.addReview(productId, reviewForm);
      if (res?.review) {
        setReviews([res.review, ...reviews]);
        toast.success('Your review was posted successfully!');
        setReviewForm({ rating: 5, comment: '', title: '' });
      }
    } catch (err) {
      toast.error(readableError(err, 'Failed to post review.'));
    } finally {
      setReviewBusy(false);
    }
  }

  return (
    <div className="container store-page product-detail">
      <div className="breadcrumb">
        <Link to="/">Home</Link>
        <ChevronRight size={14} />
        <Link to="/products">Shop</Link>
        <ChevronRight size={14} />
        <span>{product.name}</span>
      </div>

      <div className="detail-layout">
        <div className="detail-image-wrap">
          {image ? (
            <img src={image} alt={product.name} />
          ) : (
            <div className="detail-image-fallback">
              <ShoppingBag size={74} />
            </div>
          )}
          {getDiscountPercent(product.originalPrice, product.price) > 0 && (
            <span className="detail-sale">
              -{getDiscountPercent(product.originalPrice, product.price)}% OFF
            </span>
          )}
        </div>

        <div className="detail-copy">
          <span className="eyebrow">{product.category?.name || 'APPSICA SELECT'}</span>
          <h1>{product.name}</h1>

          <div className="detail-rating">
            <span style={{ color: '#fbbf24' }}>★ ★ ★ ★ ★</span> {product.rating || '5.0'}
            {reviews.length ? ` · ${reviews.length} reviews` : ''}
          </div>

          <div className="detail-price">
            {formatPrice(product.price)}{' '}
            {product.originalPrice > product.price && <del>{formatPrice(product.originalPrice)}</del>}
          </div>

          <p>{product.description || 'A thoughtful addition to your everyday. Add it to your cart and make it yours.'}</p>

          <div className="detail-stock">
            {product.stock === 0 ? (
              <span style={{ color: '#ef4444' }}>Out of stock</span>
            ) : product.stock <= 5 ? (
              <span style={{ color: '#f59e0b' }}>Only {product.stock} left in stock · Order soon</span>
            ) : (
              <span style={{ color: '#10b981' }}>In stock ({product.stock} available) · Ready to ship</span>
            )}
          </div>

          {product.vendor && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.65rem',
                margin: '1rem 0',
                padding: '0.65rem 0.85rem',
                background: 'rgba(99, 102, 241, 0.08)',
                borderRadius: '8px',
                border: '1px solid rgba(99, 102, 241, 0.2)',
              }}
            >
              <span style={{ fontSize: '0.84rem', color: '#94a3b8' }}>Sold & Fulfilled by:</span>
              <strong style={{ color: '#818cf8', fontSize: '0.9rem' }}>
                {product.vendor.storeName || product.vendor.name}
              </strong>
              <span style={{ marginLeft: 'auto', fontSize: '0.75rem', color: '#34d399', fontWeight: 600 }}>
                ✓ Verified Merchant
              </span>
            </div>
          )}

          {(product.isDeactivated || product.isActive === false) && (
            <div
              style={{
                background: 'rgba(245, 158, 11, 0.12)',
                border: '1px solid rgba(245, 158, 11, 0.35)',
                color: '#fbbf24',
                padding: '0.75rem 1rem',
                borderRadius: '8px',
                fontSize: '0.88rem',
                marginBottom: '1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <CircleAlert size={18} />
              <span>This product has been temporarily paused by the seller and is currently unavailable for purchase.</span>
            </div>
          )}

          <div className="detail-actions">
            <button
              className="btn btn-primary btn-lg"
              disabled={product.stock === 0 || product.isDeactivated || product.isActive === false}
              onClick={() => {
                addToCart(product);
                toast.success('Added to your bag.');
              }}
            >
              <ShoppingCart size={18} />
              {product.isDeactivated || product.isActive === false
                ? 'Currently Unavailable'
                : product.stock === 0
                ? 'Out of Stock'
                : 'Add to bag'}
            </button>

            <button
              className={`detail-wishlist ${wishlisted ? 'active' : ''}`}
              aria-label="Toggle wishlist"
              onClick={() => {
                if (wishlisted) {
                  removeFromWishlist(productId);
                  toast.info('Removed from wishlist.');
                } else {
                  addToWishlist(product);
                  toast.success('Saved to your wishlist.');
                }
              }}
            >
              <Heart size={19} fill={wishlisted ? 'currentColor' : 'none'} />
            </button>
          </div>

          <div className="detail-perks">
            <span>
              <Truck size={17} /> Free delivery over ₹999
            </span>
            <span>
              <RotateCcw size={17} /> 7-day easy returns
            </span>
          </div>

          {/* Delivery Availability Checker */}
          <div
            style={{
              marginTop: '1.25rem',
              padding: '1rem',
              background: 'rgba(99, 102, 241, 0.05)',
              border: '1px solid rgba(99, 102, 241, 0.2)',
              borderRadius: 12,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.85rem', fontWeight: 600, color: '#f8fafc', marginBottom: '0.65rem' }}>
              <Compass size={16} style={{ color: '#818cf8' }} /> Check Delivery Eligibility
            </div>
            <form onSubmit={handleCheckEligibility} style={{ display: 'flex', gap: '0.5rem' }}>
              <input
                type="text"
                placeholder="Enter Pincode or City (e.g. 400050)"
                value={checkPincode}
                onChange={(e) => setCheckPincode(e.target.value)}
                style={{
                  flex: 1,
                  background: 'rgba(15, 23, 42, 0.7)',
                  border: '1px solid #334155',
                  color: '#fff',
                  borderRadius: 8,
                  padding: '0.5rem 0.75rem',
                  fontSize: '0.82rem',
                }}
              />
              <button
                type="submit"
                disabled={checkingEligibility}
                style={{
                  background: '#6366f1',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 8,
                  padding: '0.5rem 1rem',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                }}
              >
                {checkingEligibility ? 'Checking...' : 'Check'}
              </button>
            </form>

            {eligibilityResult && (
              <div
                style={{
                  marginTop: '0.75rem',
                  padding: '0.65rem 0.85rem',
                  borderRadius: 8,
                  fontSize: '0.8rem',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 8,
                  background: eligibilityResult.eligible ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                  border: `1px solid ${eligibilityResult.eligible ? '#10b981' : '#ef4444'}`,
                  color: eligibilityResult.eligible ? '#34d399' : '#f87171',
                }}
              >
                {eligibilityResult.eligible ? <CheckCircle2 size={16} style={{ marginTop: 2, flexShrink: 0 }} /> : <CircleAlert size={16} style={{ marginTop: 2, flexShrink: 0 }} />}
                <div>
                  <strong>{eligibilityResult.eligible ? 'Available for delivery' : 'Not available in your area'}</strong>
                  <div style={{ fontSize: '0.75rem', color: '#cbd5e1', marginTop: 2 }}>{eligibilityResult.message}</div>
                  {eligibilityResult.deliveryMode === 'local' && eligibilityResult.estimatedDeliveryMinutes ? (
                    <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: 2 }}>
                      Estimated Arrival: ~{eligibilityResult.estimatedDeliveryMinutes} mins (Express Local)
                    </div>
                  ) : eligibilityResult.estimatedDeliveryDays ? (
                    <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: 2 }}>
                      Estimated Arrival: {eligibilityResult.estimatedDeliveryDays} (Courier)
                    </div>
                  ) : null}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Customer Reviews Section */}
      <section className="section-block" style={{ marginTop: '3.5rem' }}>
        <div className="section-topline">
          <div>
            <span className="eyebrow">VERIFIED FEEDBACK</span>
            <h2>Customer Reviews ({reviews.length})</h2>
          </div>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(300px, 1fr) 2fr',
            gap: '2rem',
            marginTop: '1.5rem',
            flexWrap: 'wrap',
          }}
        >
          {/* Add Review Form */}
          <div
            style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 12,
              padding: '1.5rem',
            }}
          >
            <h3 style={{ fontSize: '1.15rem', marginBottom: '1rem', color: '#f8fafc' }}>
              Write a Review
            </h3>
            {isAuthenticated ? (
              <form onSubmit={handleAddReview} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label className="form-label">Rating (Stars)</label>
                  <select
                    className="form-input"
                    value={reviewForm.rating}
                    onChange={(e) => setReviewForm({ ...reviewForm, rating: Number(e.target.value) })}
                  >
                    <option value="5">★★★★★ 5 Stars - Excellent</option>
                    <option value="4">★★★★☆ 4 Stars - Very Good</option>
                    <option value="3">★★★☆☆ 3 Stars - Average</option>
                    <option value="2">★★☆☆☆ 2 Stars - Fair</option>
                    <option value="1">★☆☆☆☆ 1 Star - Poor</option>
                  </select>
                </div>
                <div>
                  <label className="form-label">Review Headline</label>
                  <input
                    className="form-input"
                    type="text"
                    placeholder="Summary of your experience..."
                    value={reviewForm.title}
                    onChange={(e) => setReviewForm({ ...reviewForm, title: e.target.value })}
                  />
                </div>
                <div>
                  <label className="form-label">Detailed Review *</label>
                  <textarea
                    className="form-input"
                    rows="3"
                    required
                    placeholder="Share details about the quality, fit, or performance..."
                    value={reviewForm.comment}
                    onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
                  />
                </div>
                <button type="submit" className="btn btn-primary" disabled={reviewBusy}>
                  {reviewBusy ? 'Submitting…' : 'Submit Review'}
                </button>
              </form>
            ) : (
              <div style={{ textAlign: 'center', padding: '1.5rem 0' }}>
                <p style={{ color: '#94a3b8', marginBottom: '1rem' }}>
                  Please log in to share your verified review for this product.
                </p>
                <Link to="/login" className="btn btn-secondary btn-sm">
                  Log in to Review
                </Link>
              </div>
            )}
          </div>

          {/* Reviews List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {reviews.map((rev, idx) => (
              <div
                key={rev._id || idx}
                style={{
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid rgba(255,255,255,0.06)',
                  borderRadius: 10,
                  padding: '1.25rem',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                  <b>{rev.userName || 'Verified Buyer'}</b>
                  <span style={{ color: '#fbbf24' }}>
                    {'★'.repeat(rev.rating || 5)}
                    {'☆'.repeat(5 - (rev.rating || 5))}
                  </span>
                </div>
                {rev.title && (
                  <h4 style={{ fontSize: '0.95rem', color: '#f1f5f9', marginBottom: '0.35rem' }}>
                    {rev.title}
                  </h4>
                )}
                <p style={{ color: '#cbd5e1', fontSize: '0.9rem', margin: 0 }}>{rev.comment}</p>
                {rev.vendorReply && rev.vendorReply.text && (
                  <div
                    style={{
                      marginTop: '0.75rem',
                      marginLeft: '1rem',
                      padding: '0.65rem 0.85rem',
                      background: 'rgba(99, 102, 241, 0.08)',
                      borderLeft: '3px solid #6366f1',
                      borderRadius: '0 8px 8px 0',
                    }}
                  >
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#818cf8', display: 'block', marginBottom: '0.2rem' }}>
                      Official Seller Response:
                    </span>
                    <p style={{ margin: 0, fontSize: '0.84rem', color: '#e2e8f0' }}>{rev.vendorReply.text}</p>
                  </div>
                )}
                <small style={{ color: '#64748b', display: 'block', marginTop: '0.5rem' }}>
                  {rev.createdAt ? new Date(rev.createdAt).toLocaleDateString() : 'Verified purchase'}
                </small>
              </div>
            ))}
            {reviews.length === 0 && (
              <div
                style={{
                  padding: '2rem',
                  textAlign: 'center',
                  color: '#94a3b8',
                  background: 'rgba(255,255,255,0.02)',
                  borderRadius: 10,
                }}
              >
                No reviews yet for this product. Be the first to share your thoughts!
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
