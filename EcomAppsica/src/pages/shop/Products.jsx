import React, { useEffect, useState, useMemo } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { ChevronRight, Tag, Sparkles, Store, Sparkle, ShoppingBag, Percent, ArrowRight } from 'lucide-react';
import ProductGrid from '../../Components/product/ProductGrid';
import PageHeading from '../../Components/common/PageHeading';
import { productService } from '../../services/productService';
import { categoryService } from '../../services/categoryService';
import './Products.css';

const DEFAULT_CATEGORIES = [
  { name: 'Electronics', slug: 'electronics' },
  { name: 'Fashion', slug: 'fashion' },
  { name: 'Home & Living', slug: 'home' },
  { name: 'Beauty', slug: 'beauty' },
];

const POPULAR_BRANDS = [
  'Apple',
  'Sony',
  'Samsung',
  'Zara',
  'Nike',
  'NEXORA Select',
  'LuxeStudio',
  'SoundCraft',
  'Minimalist',
];

const INSPIRATION_MOODS = [
  {
    id: 'tech',
    title: 'Minimalist Workspace',
    tag: 'Desk & Audio',
    desc: 'Clean matte ergonomics, studio headphones & workspace lighting',
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=80',
    category: 'electronics',
  },
  {
    id: 'fashion',
    title: 'Urban Streetwear',
    tag: 'Apparel & Kicks',
    desc: 'Relaxed tailoring, heavyweight cottons & contemporary silhouettes',
    image: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=600&q=80',
    category: 'fashion',
  },
  {
    id: 'home',
    title: 'Nordic Living Space',
    tag: 'Decor & Living',
    desc: 'Warm earthen ceramics, ambient glow & sculptural accents',
    image: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=600&q=80',
    category: 'home',
  },
  {
    id: 'beauty',
    title: 'Organic Clean Glow',
    tag: 'Wellness & Skincare',
    desc: 'Botanical extracts, aromatherapy & pure self-care rituals',
    image: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=600&q=80',
    category: 'beauty',
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

export default function Products() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { slug: categorySlug } = useParams();

  const filterParam = searchParams.get('filter') || '';
  const brandParam = searchParams.get('brand') || '';
  const queryParam = searchParams.get('q') || '';

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState(queryParam);
  const [prevQueryParam, setPrevQueryParam] = useState(queryParam);
  const [category, setCategory] = useState('');
  const [sort, setSort] = useState(filterParam === 'new' ? 'newest' : 'newest');

  // Keep search input in sync with URL
  if (prevQueryParam !== queryParam) {
    setPrevQueryParam(queryParam);
    setQuery(queryParam);
  }

  // Load dynamic categories
  useEffect(() => {
    let active = true;
    categoryService
      .getAll()
      .then((result) => {
        const list = result?.categories || result?.data?.categories || (Array.isArray(result) ? result : []);
        if (active && list.length > 0) setCategories(list);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  // Fetch products
  useEffect(() => {
    let active = true;
    setLoading(true);

    const queryParams = {
      sort,
      ...(category ? { category } : {}),
      ...(filterParam ? { filter: filterParam } : {}),
      ...(brandParam ? { brand: brandParam } : {}),
    };

    const request = categorySlug
      ? productService.getByCategory(categorySlug, queryParams)
      : queryParam.trim()
      ? productService.search(queryParam.trim(), queryParams)
      : productService.getAll(queryParams);

    request
      .then((result) => {
        if (!active) return;
        setProducts(getProducts(result));
        setError('');
      })
      .catch((requestError) => {
        if (!active) return;
        setProducts([]);
        setError(readableError(requestError, 'Products could not be loaded. Please try again.'));
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [categorySlug, category, queryParam, sort, filterParam, brandParam]);

  // Dynamic brands list computed from loaded products + popular brands
  const availableBrands = useMemo(() => {
    const fromProducts = products.map((p) => p.brand).filter(Boolean);
    return Array.from(new Set([...POPULAR_BRANDS, ...fromProducts]));
  }, [products]);

  // Dynamic displayed products (ensure client-side fallback if backend filter yields few results)
  const displayedProducts = useMemo(() => {
    let list = [...products];

    if (filterParam === 'deals') {
      const discounted = list.filter(
        (p) => (p.originalPrice && p.originalPrice > p.price) || p.isFeatured
      );
      if (discounted.length > 0) return discounted;
      // If none currently have explicit originalPrice, add virtual markdowns to showcase deals
      return list.map((p, idx) => ({
        ...p,
        originalPrice: p.originalPrice && p.originalPrice > p.price ? p.originalPrice : Math.round(p.price * 1.25),
      }));
    }

    if (filterParam === 'brands' && brandParam) {
      const matched = list.filter(
        (p) => (p.brand || '').toLowerCase() === brandParam.toLowerCase()
      );
      if (matched.length > 0) return matched;
    }

    return list;
  }, [products, filterParam, brandParam]);

  // Dynamic headings and breadcrumbs
  const { title, eyebrow, description, breadcrumbLabel } = useMemo(() => {
    if (categorySlug) {
      const catName = `${categorySlug.charAt(0).toUpperCase()}${categorySlug.slice(1)}`;
      return {
        eyebrow: 'CATEGORY EDIT',
        title: catName,
        description: `Explore curated ${catName} essentials handpicked for quality and form.`,
        breadcrumbLabel: catName,
      };
    }
    if (queryParam) {
      return {
        eyebrow: 'SEARCH RESULTS',
        title: `Results for “${queryParam}”`,
        description: `We found matches for your search in our catalog.`,
        breadcrumbLabel: `Search: ${queryParam}`,
      };
    }
    if (filterParam === 'deals') {
      return {
        eyebrow: 'LIMITED TIME SAVINGS',
        title: 'Hot Deals & Special Markdowns',
        description: 'Shop curated discounts, flash price cuts, and coupon-eligible products.',
        breadcrumbLabel: 'Deals',
      };
    }
    if (filterParam === 'new') {
      return {
        eyebrow: 'JUST RELEASED',
        title: 'New Arrivals & Fresh Drops',
        description: 'Browse the newest releases and season drops across technology, style, and living.',
        breadcrumbLabel: 'New Arrivals',
      };
    }
    if (filterParam === 'brands') {
      return {
        eyebrow: 'PREMIER LABELS',
        title: brandParam ? `${brandParam} Collection` : 'Shop by Featured Brands',
        description: 'Authentic items from leading international creators and verified workshops.',
        breadcrumbLabel: brandParam ? `Brands: ${brandParam}` : 'Brands',
      };
    }
    if (filterParam === 'inspiration') {
      return {
        eyebrow: 'CURATED AESTHETICS',
        title: 'Style & Living Inspiration',
        description: 'Lookbooks, aesthetic moodboards, and themed edits designed to inspire your everyday lifestyle.',
        breadcrumbLabel: 'Inspiration',
      };
    }
    return {
      eyebrow: 'THE APPSICA EDIT',
      title: 'Shop All Products',
      description: 'Discover considered favourites across all your everyday categories.',
      breadcrumbLabel: 'Shop',
    };
  }, [categorySlug, queryParam, filterParam, brandParam]);

  function submitSearch(event) {
    event.preventDefault();
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (query.trim()) next.set('q', query.trim());
      else next.delete('q');
      return next;
    });
  }

  function handleSelectBrand(brand) {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set('filter', 'brands');
      if (brand) next.set('brand', brand);
      else next.delete('brand');
      return next;
    });
  }

  function handleInspirationClick(mood) {
    if (mood.category) {
      setCategory(mood.category);
    }
  }

  return (
    <div className="container store-page listing-page">
      {/* Breadcrumb */}
      <div className="breadcrumb">
        <Link to="/">Home</Link>
        <ChevronRight size={14} />
        <Link to="/products">Shop</Link>
        {breadcrumbLabel !== 'Shop' && (
          <>
            <ChevronRight size={14} />
            <span>{breadcrumbLabel}</span>
          </>
        )}
      </div>

      {/* Catalog Quick Sub-nav Tabs */}
      <div className="catalog-nav-tabs">
        <Link to="/products" className={`catalog-tab ${!filterParam && !categorySlug ? 'active' : ''}`}>
          <ShoppingBag size={14} /> Shop All
        </Link>
        <Link to="/products?filter=deals" className={`catalog-tab ${filterParam === 'deals' ? 'active' : ''}`}>
          <Tag size={14} /> Deals
        </Link>
        <Link to="/products?filter=new" className={`catalog-tab ${filterParam === 'new' ? 'active' : ''}`}>
          <Sparkles size={14} /> New Arrivals
        </Link>
        <Link to="/products?filter=brands" className={`catalog-tab ${filterParam === 'brands' ? 'active' : ''}`}>
          <Store size={14} /> Brands
        </Link>
        <Link to="/products?filter=inspiration" className={`catalog-tab ${filterParam === 'inspiration' ? 'active' : ''}`}>
          <Sparkle size={14} /> Inspiration
        </Link>
      </div>

      <PageHeading eyebrow={eyebrow} title={title}>
        {description}
      </PageHeading>

      {/* Special Deals Hero Banner */}
      {filterParam === 'deals' && (
        <div className="deal-promo-banner animate-fadeIn">
          <div className="deal-banner-content">
            <span className="deal-badge-pill">
              <Percent size={13} /> Limited Period Offer
            </span>
            <h2>Exclusive 20% Instant Savings</h2>
            <p>
              Apply coupon <strong>SAVE20</strong> at checkout to unlock flat 20% off on all eligible deals. Free delivery on orders over ₹999.
            </p>
          </div>
          <div className="deal-coupon-box">
            <span className="coupon-label">Coupon Code</span>
            <div className="coupon-code">SAVE20</div>
          </div>
        </div>
      )}

      {/* Brands Interactive Selector */}
      {filterParam === 'brands' && (
        <div className="brand-selector-section animate-fadeIn">
          <div className="brand-selector-title">
            <span>Filter by Verified Brand:</span>
            {brandParam && (
              <button
                type="button"
                className="btn-link"
                style={{ fontSize: '0.78rem', color: '#063b2c', fontWeight: 600 }}
                onClick={() => handleSelectBrand('')}
              >
                Clear Brand Filter ({brandParam})
              </button>
            )}
          </div>
          <div className="brand-pills-row">
            <button
              type="button"
              className={`brand-pill-btn ${!brandParam ? 'active' : ''}`}
              onClick={() => handleSelectBrand('')}
            >
              All Brands
            </button>
            {availableBrands.map((b) => (
              <button
                key={b}
                type="button"
                className={`brand-pill-btn ${brandParam.toLowerCase() === b.toLowerCase() ? 'active' : ''}`}
                onClick={() => handleSelectBrand(b)}
              >
                {b}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Inspiration Moodboards Grid */}
      {filterParam === 'inspiration' && (
        <div className="inspiration-section animate-fadeIn">
          <div className="inspiration-grid">
            {INSPIRATION_MOODS.map((mood) => (
              <div
                key={mood.id}
                className="inspiration-card"
                onClick={() => handleInspirationClick(mood)}
              >
                <img src={mood.image} alt={mood.title} loading="lazy" />
                <div className="inspiration-card-overlay">
                  <span className="inspiration-card-tag">{mood.tag}</span>
                  <h3 className="inspiration-card-title">{mood.title}</h3>
                  <p className="inspiration-card-desc">{mood.desc}</p>
                  <button type="button" className="inspiration-shop-btn">
                    Explore Aesthetic <ArrowRight size={12} style={{ verticalAlign: 'middle', marginLeft: 3 }} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Listing Toolbar (Search + Sort) */}
      <div className="listing-toolbar">
        <form className="listing-search" onSubmit={submitSearch}>
          <input
            aria-label="Search products"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="What are you looking for?"
          />
          <button className="btn btn-primary" type="submit">
            Search
          </button>
        </form>

        <label className="sort-control">
          Sort by
          <select value={sort} onChange={(event) => setSort(event.target.value)}>
            <option value="newest">Newest</option>
            <option value="popular">Popular</option>
            <option value="price_low">Price: low to high</option>
            <option value="price_high">Price: high to low</option>
            <option value="rating">Top rated</option>
          </select>
        </label>
      </div>

      {/* Category Pills (Visible when not on explicit category slug) */}
      {!categorySlug && (
        <div className="category-pills">
          <button className={!category ? 'active' : ''} onClick={() => setCategory('')}>
            Everything
          </button>
          {categories.map((item) => (
            <button
              key={item.slug}
              className={category === item.slug ? 'active' : ''}
              onClick={() => setCategory(item.slug)}
            >
              {item.name}
            </button>
          ))}
        </div>
      )}

      {/* Product Grid */}
      <ProductGrid
        products={displayedProducts}
        loading={loading}
        error={error}
        emptyMessage={
          brandParam
            ? `No products currently available for brand “${brandParam}”. Try selecting “All Brands”.`
            : "Nothing here just yet. Try another category or search."
        }
      />
    </div>
  );
}
