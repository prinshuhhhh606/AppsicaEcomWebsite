import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Sparkles,
  ArrowRight,
  ArrowUpRight,
  Check,
  ShoppingBag,
  Truck,
  ShieldCheck,
  RotateCcw,
  PackageCheck,
} from 'lucide-react';
import ProductGrid from '../../Components/product/ProductGrid';
import { productService } from '../../services/productService';
import { categoryService } from '../../services/categoryService';

const DEFAULT_CATEGORIES = [
  { name: 'Electronics', slug: 'electronics', mark: '01', tone: 'lilac' },
  { name: 'Fashion', slug: 'fashion', mark: '02', tone: 'peach' },
  { name: 'Home & Living', slug: 'home', mark: '03', tone: 'mint' },
  { name: 'Beauty', slug: 'beauty', mark: '04', tone: 'rose' },
];

function getProducts(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.products)) return payload.products;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.data?.products)) return payload.data.products;
  return [];
}

function readableError(error, fallback) {
  return error?.response?.data?.message || error?.message || fallback;
}

function ProductSection({ title, eyebrow, products, loading, error, emptyMessage, to = '/products' }) {
  return (
    <section className="section-block">
      <div className="section-topline">
        <div>
          <span className="eyebrow">{eyebrow}</span>
          <h2>{title}</h2>
        </div>
        <Link className="text-link" to={to}>
          Explore all <ArrowRight size={16} />
        </Link>
      </div>
      <ProductGrid products={products} loading={loading} error={error} emptyMessage={emptyMessage} />
    </section>
  );
}

export default function Home() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    // Fetch featured products from real backend MongoDB
    productService
      .getFeatured()
      .then((result) => {
        if (active) setProducts(getProducts(result));
      })
      .catch((requestError) => {
        if (active) setError(readableError(requestError, 'Featured products could not be loaded.'));
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    // Fetch categories dynamically from backend
    categoryService
      .getAll()
      .then((result) => {
        const list = result?.categories || result?.data?.categories || (Array.isArray(result) ? result : []);
        if (active && list.length > 0) {
          setCategories(list);
        }
      })
      .catch(() => {
        // Safe fallback to DEFAULT_CATEGORIES
      });

    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="store-page">
      <section className="hero container">
        <div className="hero-copy">
          <span className="hero-kicker">
            <Sparkles size={15} /> THE EVERYDAY EDIT
          </span>
          <h1>
            Good things.<br />
            <span>Great finds.</span>
          </h1>
          <p>Thoughtful picks for your life, your home and everything in between. Discover a better way to shop.</p>
          <div className="hero-actions">
            <Link to="/products" className="btn btn-primary btn-lg">
              Shop the collection <ArrowRight size={18} />
            </Link>
            <Link to="/category/electronics" className="hero-secondary">
              Explore categories <ArrowUpRight size={17} />
            </Link>
          </div>
          <div className="hero-proof">
            <span>
              <Check size={15} /> Carefully selected
            </span>
            <span>
              <Check size={15} /> Easy returns
            </span>
          </div>
        </div>
        <div className="hero-art" aria-label="Featured shopping collections">
          <div className="hero-orbit orbit-one" />
          <div className="hero-orbit orbit-two" />
          <div className="hero-card hero-card-main">
            <span className="hero-card-label">THE NEW SEASON</span>
            <div className="hero-shape">
              <ShoppingBag size={70} strokeWidth={1.1} />
            </div>
            <div className="hero-card-bottom">
              <span>Find your next favourite</span>
              <ArrowUpRight size={19} />
            </div>
          </div>
          <div className="floating-note">
            <span className="floating-spark">✦</span>
            <div>
              <b>Made for you</b>
              <small>Little things, big joy</small>
            </div>
          </div>
          <div className="hero-side-tag">A BETTER KIND OF EVERYDAY</div>
        </div>
      </section>

      <section className="trust-strip container">
        <div>
          <Truck size={20} />
          <span>
            <b>Fast delivery</b>
            <small>Right to your doorstep</small>
          </span>
        </div>
        <div>
          <ShieldCheck size={20} />
          <span>
            <b>Secure checkout</b>
            <small>Your details stay protected</small>
          </span>
        </div>
        <div>
          <RotateCcw size={20} />
          <span>
            <b>Easy returns</b>
            <small>Shop with peace of mind</small>
          </span>
        </div>
        <div>
          <PackageCheck size={20} />
          <span>
            <b>Quality picks</b>
            <small>Good things, guaranteed</small>
          </span>
        </div>
      </section>

      <section className="section-block container category-section">
        <div className="section-topline">
          <div>
            <span className="eyebrow">A LITTLE BIT OF EVERYTHING</span>
            <h2>Shop by category</h2>
          </div>
          <Link className="text-link" to="/products">
            All collections <ArrowRight size={16} />
          </Link>
        </div>
        <div className="category-grid">
          {categories.map((cat) => (
            <Link key={cat.slug} to={`/category/${cat.slug}`} className={`category-tile ${cat.tone || 'lilac'}`}>
              <span className="category-number">{cat.mark || '01'} / COLLECTION</span>
              <span className="category-name">{cat.name}</span>
              <span className="category-arrow">
                <ArrowUpRight size={18} />
              </span>
              <span className="category-decoration" aria-hidden="true">
                {cat.mark || '✦'}
              </span>
            </Link>
          ))}
        </div>
      </section>

      <div className="container">
        <ProductSection
          title="Picked for you"
          eyebrow="A FEW GOOD FINDS"
          products={products}
          loading={loading}
          error={error}
          emptyMessage="There are no featured products yet."
        />
      </div>

      <section className="closing-banner container">
        <div>
          <span className="eyebrow">THE GOOD STUFF IS CLOSER THAN YOU THINK</span>
          <h2>
            Find something<br />
            you’ll love.
          </h2>
        </div>
        <Link to="/products" className="btn btn-light btn-lg">
          Browse everything <ArrowRight size={18} />
        </Link>
        <span className="closing-decoration" aria-hidden="true">
          A
        </span>
      </section>
    </div>
  );
}
