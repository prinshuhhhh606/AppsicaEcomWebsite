import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, ZoomIn } from 'lucide-react';
import './ProductGallery.css';

const ProductGallery = ({ images = [] }) => {
  const [active, setActive] = useState(0);
  const [zoomed, setZoomed] = useState(false);

  const prev = () => setActive(i => (i > 0 ? i - 1 : images.length - 1));
  const next = () => setActive(i => (i < images.length - 1 ? i + 1 : 0));

  if (!images.length) return (
    <div className="gallery-placeholder">
      <div className="gallery-empty-img">No Image</div>
    </div>
  );

  return (
    <div className="product-gallery">
      {/* Main Image */}
      <div className="gallery-main" onClick={() => setZoomed(true)}>
        <img src={images[active]} alt="Product" className="gallery-main-img" />
        <button className="gallery-nav prev" onClick={e => { e.stopPropagation(); prev(); }}><ChevronLeft size={20} /></button>
        <button className="gallery-nav next" onClick={e => { e.stopPropagation(); next(); }}><ChevronRight size={20} /></button>
        <div className="gallery-zoom-hint"><ZoomIn size={16} /> Click to zoom</div>
        <div className="gallery-counter">{active + 1} / {images.length}</div>
      </div>

      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="gallery-thumbs">
          {images.map((img, i) => (
            <button key={i} className={`gallery-thumb ${i === active ? 'active' : ''}`} onClick={() => setActive(i)}>
              <img src={img} alt={`Thumb ${i+1}`} />
            </button>
          ))}
        </div>
      )}

      {/* Zoom Modal */}
      {zoomed && (
        <div className="gallery-zoom-overlay" onClick={() => setZoomed(false)}>
          <img src={images[active]} alt="Zoomed" className="gallery-zoomed-img" />
        </div>
      )}
    </div>
  );
};

export default ProductGallery;
