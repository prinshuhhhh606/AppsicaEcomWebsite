import React from 'react';
import ProductCard from './ProductCard';
import Loader from '../common/Loader';
import ErrorMessage from '../common/ErrorMessage';
import './ProductGrid.css';

const ProductGrid = ({ products = [], loading = false, error = null, emptyMessage = 'No products found' }) => {
  if (loading) return (
    <div className="product-grid">
      {[...Array(8)].map((_, i) => <div key={i} className="product-skeleton" />)}
    </div>
  );
  if (error) return <ErrorMessage message={error} />;
  if (!products.length) return (
    <div className="product-grid-empty">
      <p>🛍️</p>
      <h3>{emptyMessage}</h3>
      <p>Try different filters or search terms</p>
    </div>
  );

  return (
    <div className="product-grid">
      {products.map(p => <ProductCard key={p._id} product={p} />)}
    </div>
  );
};

export default ProductGrid;
