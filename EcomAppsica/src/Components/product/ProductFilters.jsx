import React, { useState } from 'react';
import { SlidersHorizontal, ChevronDown, ChevronUp, X } from 'lucide-react';
import { SORT_OPTIONS } from '../../utils/constants';
import './ProductFilters.css';

const ProductFilters = ({ filters, onChange, onClear }) => {
  const [priceOpen, setPriceOpen] = useState(true);
  const [ratingOpen, setRatingOpen] = useState(true);

  const handlePrice = (field, value) => onChange({ ...filters, [field]: Number(value) });
  const handleRating = (rating) => onChange({ ...filters, rating });
  const handleSort = (sort) => onChange({ ...filters, sort });

  return (
    <aside className="product-filters">
      <div className="filters-header">
        <div className="filters-title"><SlidersHorizontal size={18} /> Filters</div>
        <button className="filters-clear" onClick={onClear}><X size={14} /> Clear</button>
      </div>

      {/* Sort */}
      <div className="filter-section">
        <h4 className="filter-section-title">Sort By</h4>
        <div className="sort-options">
          {SORT_OPTIONS.map(opt => (
            <button key={opt.value} className={`sort-opt ${filters.sort === opt.value ? 'active' : ''}`}
              onClick={() => handleSort(opt.value)}>{opt.label}</button>
          ))}
        </div>
      </div>

      {/* Price */}
      <div className="filter-section">
        <button className="filter-section-title toggle" onClick={() => setPriceOpen(o => !o)}>
          Price Range {priceOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
        {priceOpen && (
          <div className="filter-price">
            <div className="price-inputs">
              <div className="form-group">
                <label className="form-label">Min (₹)</label>
                <input type="number" className="form-input" value={filters.minPrice || ''} onChange={e => handlePrice('minPrice', e.target.value)} placeholder="0" />
              </div>
              <div className="form-group">
                <label className="form-label">Max (₹)</label>
                <input type="number" className="form-input" value={filters.maxPrice || ''} onChange={e => handlePrice('maxPrice', e.target.value)} placeholder="100000" />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Rating */}
      <div className="filter-section">
        <button className="filter-section-title toggle" onClick={() => setRatingOpen(o => !o)}>
          Rating {ratingOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
        {ratingOpen && (
          <div className="filter-ratings">
            {[4, 3, 2, 1].map(r => (
              <button key={r} className={`rating-filter-btn ${filters.rating === r ? 'active' : ''}`}
                onClick={() => handleRating(filters.rating === r ? null : r)}>
                {'★'.repeat(r)}{'☆'.repeat(5-r)} & above
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Availability */}
      <div className="filter-section">
        <h4 className="filter-section-title">Availability</h4>
        <label className="filter-checkbox">
          <input type="checkbox" checked={!!filters.inStock} onChange={e => onChange({ ...filters, inStock: e.target.checked })} />
          <span>In Stock Only</span>
        </label>
      </div>
    </aside>
  );
};

export default ProductFilters;
