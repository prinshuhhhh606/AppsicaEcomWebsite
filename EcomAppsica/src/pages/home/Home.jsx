import React, { useEffect, useState, useRef } from 'react';
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
  ChevronLeft,
  ChevronRight,
  Star,
  Flame,
  Tag,
} from 'lucide-react';
import ProductGrid from '../../Components/product/ProductGrid';
import { productService } from '../../services/productService';
import { categoryService } from '../../services/categoryService';
import { bannerService } from '../../services/bannerService';
import { getPublicImageUrl } from '../../utils/imageHelper';

const SEASONAL_HERO_SLIDES = [
  {
    id: 'slide-1',
    seasonBadge: 'THE NEW SEASON • 2026',
    subBadge: 'FLAGSHIP AUDIO EDIT',
    title: 'Aura Studio Pro Wireless',
    tagline: 'Experience acoustic depth & silent comfort',
    categorySlug: 'electronics',
    categoryName: 'Electronics',
    price: '₹12,999',
    originalPrice: '₹16,499',
    discount: '21% OFF',
    rating: '4.9',
    reviewsCount: '520+ Reviews',
    accentColor: '#6366f1',
    glowColor: 'rgba(99, 102, 241, 0.45)',
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=1200&q=85',
    floatingPill: '⚡ 142 Ordered Today',
    deliveryNote: 'Free Next-Day Dispatch',
  },
  {
    id: 'slide-2',
    seasonBadge: 'AUTUMN / WINTER EDIT',
    subBadge: 'DESIGNER WARDROBE',
    title: 'Minimalist Virgin Wool Trench',
    tagline: 'Tailored silhouettes for crisp days',
    categorySlug: 'fashion',
    categoryName: 'Fashion',
    price: '₹4,899',
    originalPrice: '₹6,999',
    discount: '30% OFF',
    rating: '4.8',
    reviewsCount: '310+ Reviews',
    accentColor: '#f97316',
    glowColor: 'rgba(234, 88, 12, 0.4)',
    image: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=1200&q=85',
    floatingPill: '🔥 Trending in Apparel',
    deliveryNote: 'Handpicked Fabric',
  },
  {
    id: 'slide-3',
    seasonBadge: 'TRANQUIL LIVING',
    subBadge: 'ARTISANAL HOME',
    title: 'Nordic Ceramic Accent Vessel',
    tagline: 'Crafted for calm, considered spaces',
    categorySlug: 'home',
    categoryName: 'Home & Living',
    price: '₹2,499',
    originalPrice: '₹3,299',
    discount: '24% OFF',
    rating: '5.0',
    reviewsCount: '190+ Reviews',
    accentColor: '#14b8a6',
    glowColor: 'rgba(13, 148, 136, 0.4)',
    image: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=1200&q=85',
    floatingPill: '🌿 Clean Botanical Pick',
    deliveryNote: 'Eco-Friendly Packaged',
  },
];

const DEFAULT_CATEGORIES = [
  {
    name: 'Electronics',
    slug: 'electronics',
    mark: '01',
    tone: 'lilac',
    tagline: 'Headphones, smartphones, smartwatches & gadgets',
    image: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?auto=format&fit=crop&w=800&q=80',
    alt: 'Electronics - High-tech smartphones, wireless headphones, smartwatch and electronic gadgets',
  },
  {
    name: 'Fashion',
    slug: 'fashion',
    mark: '02',
    tone: 'peach',
    tagline: 'Stylish clothing, sneakers, handbags & accessories',
    image: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=800&q=80',
    alt: 'Fashion - Stylish apparel, sneakers, designer handbags and fashion accessories',
  },
  {
    name: 'Home & Living',
    slug: 'home',
    mark: '03',
    tone: 'mint',
    tagline: 'Elegant home decor, furniture, lamps & cushions',
    image: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=800&q=80',
    alt: 'Home & Living - Elegant home decor, furniture, lighting lamps, cushions and essentials',
  },
  {
    name: 'Beauty',
    slug: 'beauty',
    mark: '04',
    tone: 'rose',
    tagline: 'Skincare products, cosmetics, perfume & makeup',
    image: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=800&q=80',
    alt: 'Beauty - Skincare products, cosmetics, luxury perfume and makeup items',
  },
];

const DEFAULT_FEATURED_PRODUCTS = [
  {
    _id: 'feat-1',
    id: 'feat-1',
    name: 'Noise Cancelling Studio Headphones',
    slug: 'noise-cancelling-studio-headphones',
    description: 'Precision acoustics with active noise cancellation, ambient passthrough mode, and 40h battery.',
    price: 7999,
    originalPrice: 9999,
    category: { name: 'Electronics', slug: 'electronics' },
    images: ['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80'],
    rating: 4.9,
    reviewCount: 1234,
    stock: 25,
    brand: 'Stunner Audio',
    isFeatured: true,
  },
  {
    _id: 'feat-2',
    id: 'feat-2',
    name: 'Linen Casual Minimalist Shirt',
    slug: 'linen-casual-minimalist-shirt',
    description: '100% organic breathable linen tailoring for timeless, refined day-to-evening dressing.',
    price: 2999,
    originalPrice: 3999,
    category: { name: 'Fashion', slug: 'fashion' },
    images: ['https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=800&q=80'],
    rating: 4.8,
    reviewCount: 812,
    stock: 30,
    brand: 'Stunner Wardrobe',
    isFeatured: true,
  },
  {
    _id: 'feat-3',
    id: 'feat-3',
    name: 'Minimalist Niacinamide Botanical Serum',
    slug: 'minimalist-niacinamide-botanical-serum',
    description: 'Cold-pressed calming serum formulated with 10% pure niacinamide and zinc for radiant, balanced skin.',
    price: 1699,
    originalPrice: 1999,
    category: { name: 'Beauty', slug: 'beauty' },
    images: ['https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=800&q=80'],
    rating: 4.9,
    reviewCount: 645,
    stock: 45,
    brand: 'Stunner Botanicals',
    isFeatured: true,
  },
  {
    _id: 'feat-4',
    id: 'feat-4',
    name: 'Compact Precision Espresso Maker',
    slug: 'compact-precision-espresso-maker',
    description: '15-bar Italian pressure pump with brushed steel thermal block for rich, velvety morning brew.',
    price: 4899,
    originalPrice: 5999,
    category: { name: 'Home & Living', slug: 'home' },
    images: ['https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=800&q=80'],
    rating: 4.8,
    reviewCount: 963,
    stock: 14,
    brand: 'Artisan Kitchen',
    isFeatured: true,
  },
  {
    _id: 'feat-5',
    id: 'feat-5',
    name: 'Urban Tactical Waterproof Backpack',
    slug: 'urban-tactical-waterproof-backpack',
    description: 'Weatherproof ripstop ballistic canvas with padded 16-inch laptop compartment and ergonomic straps.',
    price: 3999,
    originalPrice: 4599,
    category: { name: 'Fashion', slug: 'fashion' },
    images: ['https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=800&q=80'],
    rating: 4.9,
    reviewCount: 1108,
    stock: 22,
    brand: 'Tactical Pack',
    isFeatured: true,
  },
  {
    _id: 'feat-6',
    id: 'feat-6',
    name: 'Lunar Minimalist Smartwatch Series 4',
    slug: 'lunar-minimalist-smartwatch-series-4',
    description: 'Ceramic bezel AMOLED smartwatch with continuous biometric tracking, titanium buckle, and 7-day battery.',
    price: 8999,
    originalPrice: 11999,
    category: { name: 'Electronics', slug: 'electronics' },
    images: ['https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80'],
    rating: 4.8,
    reviewCount: 520,
    stock: 18,
    brand: 'Lunar',
    isFeatured: true,
  },
  {
    _id: 'feat-7',
    id: 'feat-7',
    name: 'Nordic Ceramic Living Accent Vessel',
    slug: 'nordic-ceramic-living-accent-vessel',
    description: 'Hand-thrown stoneware with matte textured glaze. Crafted for calm, considered organic interiors.',
    price: 2499,
    originalPrice: 3299,
    category: { name: 'Home & Living', slug: 'home' },
    images: ['https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=800&q=80'],
    rating: 5.0,
    reviewCount: 190,
    stock: 12,
    brand: 'Artisan Living',
    isFeatured: true,
  },
  {
    _id: 'feat-8',
    id: 'feat-8',
    name: 'Handcrafted Italian Leather Tote',
    slug: 'handcrafted-italian-leather-tote',
    description: 'Full-grain vegetal tanned calfskin with raw suede interior and magnetic bronze clasp.',
    price: 6499,
    originalPrice: 8499,
    category: { name: 'Fashion', slug: 'fashion' },
    images: ['https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=800&q=80'],
    rating: 4.9,
    reviewCount: 340,
    stock: 15,
    brand: 'Stunner Leather',
    isFeatured: true,
  },
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
      <ProductGrid
        products={products}
        loading={loading && (!products || products.length === 0)}
        error={(!products || products.length === 0) ? error : null}
        emptyMessage={emptyMessage}
      />
    </section>
  );
}

export default function Home() {
  // Initialize with cached products or curated fallback for INSTANT 0ms rendering
  const [products, setProducts] = useState(() => {
    try {
      const cached = sessionStorage.getItem('stunnerysl_featured_products');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (_) {}
    return DEFAULT_FEATURED_PRODUCTS;
  });
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES);
  const [heroSlides, setHeroSlides] = useState(SEASONAL_HERO_SLIDES);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeSlide, setActiveSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Auto-play seasonal banner every 5.5s
  useEffect(() => {
    if (isPaused || heroSlides.length <= 1) return;
    const timer = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % heroSlides.length);
    }, 5500);
    return () => clearInterval(timer);
  }, [isPaused, heroSlides.length]);

  useEffect(() => {
    let active = true;

    // Fetch active promotional banners from MongoDB
    bannerService
      .getActiveBanners()
      .then((banners) => {
        if (active && Array.isArray(banners) && banners.length > 0) {
          const mapped = banners.map((b, idx) => ({
            id: b._id || `banner-${idx}`,
            seasonBadge: 'PROMOTIONAL DROP',
            subBadge: b.position !== undefined ? `FEATURED #${b.position + 1}` : 'SPECIAL EDIT',
            title: b.title,
            tagline: b.subtitle || 'Discover premium handpicked essentials',
            categorySlug: (b.link || '/products').replace(/^\//, ''),
            link: b.link || '/products',
            price: 'Explore Collection',
            originalPrice: '',
            discount: 'TRENDING',
            rating: '4.9',
            reviewsCount: 'Curated Drop',
            accentColor: idx % 3 === 0 ? '#6366f1' : idx % 3 === 1 ? '#f97316' : '#14b8a6',
            glowColor: idx % 3 === 0 ? 'rgba(99, 102, 241, 0.45)' : idx % 3 === 1 ? 'rgba(234, 88, 12, 0.4)' : 'rgba(13, 148, 136, 0.4)',
            image: b.image,
            floatingPill: '🔥 Fresh In Store',
            deliveryNote: 'Verified Quality',
          }));
          setHeroSlides(mapped);
        }
      })
      .catch(() => {
        // Fallback to defaults
      });

    // Fetch featured products from real backend MongoDB
    productService
      .getFeatured()
      .then((result) => {
        const prods = getProducts(result);
        if (active && prods.length > 0) {
          setProducts(prods);
          try {
            sessionStorage.setItem('stunnerysl_featured_products', JSON.stringify(prods));
          } catch (_) {}
        }
      })
      .catch((requestError) => {
        console.warn('Background featured products fetch:', requestError?.message);
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
          const merged = DEFAULT_CATEGORIES.map((defCat) => {
            const found = list.find((c) => c.slug === defCat.slug);
            return {
              ...defCat,
              ...(found || {}),
              name: defCat.name,
              image: defCat.image,
              alt: defCat.alt,
              tagline: defCat.tagline,
            };
          });
          setCategories(merged);
        }
      })
      .catch(() => {
        // Safe fallback
      });

    return () => {
      active = false;
    };
  }, []);

  const currentSlide = heroSlides[activeSlide] || heroSlides[0] || SEASONAL_HERO_SLIDES[0];

  const handlePrevSlide = (e) => {
    e.preventDefault();
    setActiveSlide((prev) => (prev - 1 + heroSlides.length) % heroSlides.length);
  };

  const handleNextSlide = (e) => {
    e.preventDefault();
    setActiveSlide((prev) => (prev + 1) % heroSlides.length);
  };

  return (
    <div className="store-page">
      {/* 1. HERO SECTION WITH PRO SEASONAL SHOWCASE BANNER */}
      <section className="hero container">
        <div className="hero-copy">
          <span className="hero-kicker">
            <Sparkles size={15} /> THE NEW SEASON 2026
          </span>
          <h1>
            Experience the new season.<br />
            <span>Find your next favourite.</span>
          </h1>
          <p>
            Thoughtful picks, designer acoustics, curated autumn wardrobes, and artisanal home accents. Discover a better way to shop.
          </p>

          <div className="hero-actions">
            <Link to="/products" className="btn btn-primary btn-lg">
              Shop the collection <ArrowRight size={18} />
            </Link>
            <Link to={`/category/${currentSlide.categorySlug}`} className="hero-secondary">
              Explore {currentSlide.categoryName} <ArrowUpRight size={17} />
            </Link>
          </div>

          {/* Quick Trending Capsule Tags */}
          <div className="hero-trending-tags">
            <span className="hero-trending-label">Trending Now:</span>
            <Link to="/category/electronics" className="hero-tag-pill">Wireless Audio</Link>
            <Link to="/category/fashion" className="hero-tag-pill">Autumn Coats</Link>
            <Link to="/category/home" className="hero-tag-pill">Ceramic Accents</Link>
            <Link to="/category/beauty" className="hero-tag-pill">Clean Botanicals</Link>
          </div>

          <div className="hero-proof">
            <span>
              <Check size={15} /> 100% Curated Quality
            </span>
            <span>
              <Check size={15} /> 7-Day Easy Returns
            </span>
            <span>
              <Check size={15} /> Express Pan-India Delivery
            </span>
          </div>
        </div>

        {/* PRO SEASONAL SHOWCASE BANNER COMPONENT */}
        <div
          className="hero-art hero-showcase-art"
          aria-label="The New Season Showcase Banner"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          {/* Ambient Radial Glow based on active slide color */}
          <div
            className="hero-ambient-glow"
            style={{ background: `radial-gradient(circle, ${currentSlide.glowColor}, transparent 70%)` }}
          />

          {/* Background Decorative Rings */}
          <div className="hero-orbit orbit-one" />
          <div className="hero-orbit orbit-two" />

          {/* Interactive Showcase Banner Card */}
          <div className="hero-banner-card">
            {/* Clickable Image & Visual Showcase */}
            <Link
              to={currentSlide.link || `/category/${currentSlide.categorySlug}`}
              className="hero-banner-image-container"
              style={{ textDecoration: 'none' }}
            >
              <img
                src={getPublicImageUrl(currentSlide.image)}
                alt={currentSlide.title}
                className="hero-banner-image"
                loading="eager"
              />
              <div className="hero-banner-gradient-overlay" />

              {/* Top Seasonal Badge Ribbon */}
              <div className="hero-banner-top-bar">
                <span className="hero-badge-season">
                  <Sparkles size={12} /> {currentSlide.seasonBadge}
                </span>
                <span className="hero-badge-sub">
                  {currentSlide.subBadge}
                </span>
              </div>

              {/* Floating Verified Rating Badge */}
              <div className="hero-floating-rating">
                <div className="hero-rating-stars">
                  <Star size={13} fill="#fbbf24" color="#fbbf24" />
                  <span>{currentSlide.rating}</span>
                </div>
                <small>{currentSlide.reviewsCount}</small>
              </div>

              {/* Floating Live Activity Badge */}
              <div className="hero-floating-activity">
                <Flame size={14} color="#f97316" />
                <span>{currentSlide.floatingPill}</span>
              </div>

              {/* Bottom Information Glassmorphic Card */}
              <div className="hero-banner-bottom-info">
                <div className="hero-banner-text-group">
                  <span className="hero-banner-eyebrow">FEATURED DROP</span>
                  <h3 className="hero-banner-title">{currentSlide.title}</h3>
                  <p className="hero-banner-tagline">{currentSlide.tagline}</p>
                </div>

                <div className="hero-banner-price-row">
                  <div className="hero-price-group">
                    <span className="hero-price-main">{currentSlide.price}</span>
                    <span className="hero-price-mrp">{currentSlide.originalPrice}</span>
                    <span className="hero-discount-pill">{currentSlide.discount}</span>
                  </div>

                  <div className="hero-find-favourite-btn">
                    <span>Find your next favourite</span>
                    <ArrowUpRight size={17} />
                  </div>
                </div>
              </div>
            </Link>

            {/* Slider Switcher & Tab Controls */}
            <div className="hero-banner-controls">
              <button
                type="button"
                className="hero-ctrl-arrow"
                onClick={handlePrevSlide}
                aria-label="Previous Slide"
              >
                <ChevronLeft size={18} />
              </button>

              <div className="hero-ctrl-tabs">
                {heroSlides.map((slide, idx) => (
                  <button
                    key={slide.id || idx}
                    type="button"
                    onClick={() => setActiveSlide(idx)}
                    className={`hero-ctrl-tab ${activeSlide === idx ? 'active' : ''}`}
                  >
                    <span className="hero-tab-idx">0{idx + 1}</span>
                    <span className="hero-tab-name">{slide.categoryName || slide.title?.slice(0, 16)}</span>
                    {activeSlide === idx && <span className="hero-tab-progress" />}
                  </button>
                ))}
              </div>

              <button
                type="button"
                className="hero-ctrl-arrow"
                onClick={handleNextSlide}
                aria-label="Next Slide"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>

          <div className="hero-side-tag">EXPERIENCE THE NEW SEASON</div>
        </div>
      </section>

      {/* 2. HIGH-FASHION SEASONAL MARQUEE TICKER */}
      <div className="seasonal-ticker" aria-hidden="true">
        <div className="seasonal-ticker-track">
          <span>✦ THE NEW SEASON 2026</span>
          <span className="ticker-dot">•</span>
          <span>FIND YOUR NEXT FAVOURITE</span>
          <span className="ticker-dot">•</span>
          <span>CURATED MULTI-VENDOR MARKETPLACE</span>
          <span className="ticker-dot">•</span>
          <span>UP TO 40% OFF SEASONAL DROPS</span>
          <span className="ticker-dot">•</span>
          <span>100% VERIFIED AUTHENTIC</span>
          <span className="ticker-dot">•</span>
          <span>FAST DOORSTEP DISPATCH</span>
          <span className="ticker-dot">•</span>
          <span>✦ THE NEW SEASON 2026</span>
          <span className="ticker-dot">•</span>
          <span>FIND YOUR NEXT FAVOURITE</span>
          <span className="ticker-dot">•</span>
          <span>CURATED MULTI-VENDOR MARKETPLACE</span>
          <span className="ticker-dot">•</span>
          <span>UP TO 40% OFF SEASONAL DROPS</span>
          <span className="ticker-dot">•</span>
          <span>100% VERIFIED AUTHENTIC</span>
          <span className="ticker-dot">•</span>
          <span>FAST DOORSTEP DISPATCH</span>
        </div>
      </div>

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

      <section className="section-block container category-section" aria-label="Shop by Category">
        <div className="section-topline">
          <div>
            <span className="eyebrow">EXPLORE OUR COLLECTIONS</span>
            <h2>Shop by Category</h2>
          </div>
          <Link className="text-link" to="/products">
            View All Categories <ArrowRight size={16} />
          </Link>
        </div>
        <div className="category-grid">
          {categories.map((cat) => (
            <Link
              key={cat.slug}
              to={`/category/${cat.slug}`}
              className={`category-card category-tone-${cat.tone || 'lilac'}`}
              aria-label={`Shop ${cat.name} collection`}
            >
              <div className="category-image-wrap">
                <img
                  src={getPublicImageUrl(cat.image)}
                  alt={cat.alt || `${cat.name} products`}
                  className="category-image"
                  loading="lazy"
                />
                <div className="category-overlay-gradient" />
                <span className="category-badge-chip">
                  {cat.mark || '01'} / COLLECTION
                </span>
              </div>

              <div className="category-card-body">
                <div className="category-card-info">
                  <h3 className="category-card-title">{cat.name}</h3>
                  {cat.tagline && <p className="category-card-desc">{cat.tagline}</p>}
                </div>

                <div className="category-card-action">
                  <span className="category-shop-now-btn">
                    Shop Now <ArrowRight size={15} className="category-action-arrow" />
                  </span>
                  <div className="category-action-circle" aria-hidden="true">
                    <ArrowUpRight size={16} />
                  </div>
                </div>
              </div>
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
          S
        </span>
      </section>
    </div>
  );
}
