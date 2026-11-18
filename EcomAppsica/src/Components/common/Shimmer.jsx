import React from 'react';
import './Shimmer.css';

/**
 * Basic Shimmer Block with custom dimensions
 */
export const ShimmerBlock = ({
  width = '100%',
  height = '20px',
  borderRadius = '8px',
  className = '',
  style = {},
}) => {
  return (
    <div
      className={`shimmer-block shimmer-wave ${className}`}
      style={{
        width,
        height,
        borderRadius,
        ...style,
      }}
    />
  );
};

/**
 * Realistic Product Card Skeleton matching StunnerYsl ProductCard UI
 */
export const ProductCardSkeleton = () => {
  return (
    <div className="product-card-skeleton">
      <div className="sk-image-wrap shimmer-box">
        <div className="sk-badge shimmer-wave" />
        <div className="sk-wishlist shimmer-wave" />
      </div>
      <div className="sk-body">
        <div className="sk-category shimmer-line" />
        <div className="sk-title-1 shimmer-line" />
        <div className="sk-title-2 shimmer-line" />
        <div className="sk-rating-row">
          <div className="sk-stars shimmer-wave" />
          <div className="sk-reviews shimmer-wave" />
        </div>
        <div className="sk-price-row">
          <div className="sk-price shimmer-wave" />
          <div className="sk-original-price shimmer-wave" />
        </div>
        <div className="sk-button shimmer-btn" />
      </div>
    </div>
  );
};

/**
 * Product Grid Skeleton: renders `count` product card skeletons
 */
export const ProductGridSkeleton = ({ count = 8 }) => {
  return (
    <div className="product-grid">
      {Array.from({ length: count }).map((_, idx) => (
        <ProductCardSkeleton key={idx} />
      ))}
    </div>
  );
};

/**
 * Product Details Page Skeleton matching ProductDetails.jsx UI
 */
export const ProductDetailsSkeleton = () => {
  return (
    <div className="product-detail-skeleton-wrap">
      {/* Left Column: Gallery */}
      <div className="sk-gallery-col">
        <div className="sk-main-image shimmer-box" />
        <div className="sk-thumbs-row">
          <div className="sk-thumb shimmer-box" />
          <div className="sk-thumb shimmer-box" />
          <div className="sk-thumb shimmer-box" />
          <div className="sk-thumb shimmer-box" />
        </div>
      </div>

      {/* Right Column: Info & Actions */}
      <div className="sk-info-col">
        <div className="sk-tag shimmer-line" />
        <div className="sk-main-title shimmer-line" />
        <div className="sk-main-rating shimmer-line" />
        <div className="sk-price-card shimmer-wave" />

        <div className="sk-desc-lines">
          <div className="sk-desc-line shimmer-line" style={{ width: '100%' }} />
          <div className="sk-desc-line shimmer-line" style={{ width: '92%' }} />
          <div className="sk-desc-line shimmer-line" style={{ width: '78%' }} />
        </div>

        <div className="sk-actions-row">
          <div className="sk-qty-box shimmer-wave" />
          <div className="sk-cart-btn shimmer-btn" />
          <div className="sk-wish-btn shimmer-btn" />
        </div>

        <div className="sk-perks-row">
          <div className="sk-perk shimmer-wave" />
          <div className="sk-perk shimmer-wave" />
          <div className="sk-perk shimmer-wave" />
        </div>
      </div>
    </div>
  );
};

/**
 * Category Bar Skeleton (Circular Pills)
 */
export const CategoryBarSkeleton = ({ count = 8 }) => {
  return (
    <div className="category-skeleton-bar">
      {Array.from({ length: count }).map((_, idx) => (
        <div key={idx} className="category-skeleton-item">
          <div className="category-skeleton-circle shimmer-box" />
          <div className="category-skeleton-label shimmer-line" />
        </div>
      ))}
    </div>
  );
};

/**
 * Order Card Skeleton for MyOrders.jsx
 */
export const OrderCardSkeleton = ({ count = 3 }) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {Array.from({ length: count }).map((_, idx) => (
        <div key={idx} className="order-skeleton-card">
          <div className="order-skeleton-header">
            <div>
              <div className="shimmer-line" style={{ width: '120px', height: '14px' }} />
              <div className="shimmer-line" style={{ width: '80px', height: '11px', margin: 0 }} />
            </div>
            <div className="shimmer-line" style={{ width: '90px', height: '24px', borderRadius: '12px' }} />
          </div>

          <div className="order-skeleton-items">
            <div className="order-skeleton-thumb shimmer-box" />
            <div style={{ flex: 1 }}>
              <div className="shimmer-line" style={{ width: '70%', height: '15px' }} />
              <div className="shimmer-line" style={{ width: '35%', height: '12px', margin: 0 }} />
            </div>
            <div className="shimmer-line" style={{ width: '80px', height: '18px' }} />
          </div>
        </div>
      ))}
    </div>
  );
};

/**
 * Table Rows Skeleton for Admin & Vendor tables
 */
export const TableRowSkeleton = ({ rows = 5, cols = 6 }) => {
  const widths = ['75%', '50%', '60%', '40%', '80%', '55%'];
  return (
    <>
      {Array.from({ length: rows }).map((_, rIdx) => (
        <tr key={rIdx}>
          {Array.from({ length: cols }).map((_, cIdx) => (
            <td key={cIdx}>
              <div
                className="sk-table-cell shimmer-wave"
                style={{ width: widths[cIdx % widths.length] }}
              />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
};

export default ShimmerBlock;
