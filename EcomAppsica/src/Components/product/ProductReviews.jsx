import React from 'react';
import { Star, ThumbsUp, User } from 'lucide-react';
import { formatCount } from '../../utils/formatPrice';
import './ProductReviews.css';

const ProductReviews = ({ reviews = [], averageRating = 0, totalReviews = 0 }) => {
  const ratingCounts = [5,4,3,2,1].map(r => ({
    star: r,
    count: reviews.filter(rv => Math.round(rv.rating) === r).length,
    pct: totalReviews ? Math.round((reviews.filter(rv => Math.round(rv.rating) === r).length / totalReviews) * 100) : 0
  }));

  return (
    <div className="product-reviews">
      <h3 className="reviews-title">Customer Reviews</h3>

      {/* Summary */}
      <div className="reviews-summary">
        <div className="reviews-average">
          <div className="avg-score">{averageRating.toFixed(1)}</div>
          <div className="stars">
            {[1,2,3,4,5].map(s => <Star key={s} size={18} fill={s <= Math.round(averageRating) ? '#f59e0b' : 'none'} stroke="#f59e0b" />)}
          </div>
          <p className="avg-count">{formatCount(totalReviews)} reviews</p>
        </div>
        <div className="rating-breakdown">
          {ratingCounts.map(({ star, count, pct }) => (
            <div key={star} className="rating-bar-row">
              <span className="rb-label">{star}★</span>
              <div className="rb-track"><div className="rb-fill" style={{ width: `${pct}%` }} /></div>
              <span className="rb-count">{count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Review List */}
      <div className="reviews-list">
        {reviews.length === 0 && <p className="no-reviews">No reviews yet. Be the first to review!</p>}
        {reviews.map((rv, i) => (
          <div key={i} className="review-item">
            <div className="review-header">
              <div className="review-user-avatar"><User size={18} /></div>
              <div>
                <p className="review-username">{rv.userName || 'Anonymous'}</p>
                <div className="stars">
                  {[1,2,3,4,5].map(s => <Star key={s} size={13} fill={s <= rv.rating ? '#f59e0b' : 'none'} stroke="#f59e0b" />)}
                </div>
              </div>
              <span className="review-date">{new Date(rv.createdAt).toLocaleDateString('en-IN')}</span>
            </div>
            {rv.title && <h4 className="review-title">{rv.title}</h4>}
            <p className="review-comment">{rv.comment}</p>
            <button className="review-helpful"><ThumbsUp size={14} /> Helpful ({rv.helpful || 0})</button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProductReviews;
