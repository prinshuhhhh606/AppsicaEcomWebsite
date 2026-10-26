import React, { useEffect, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import ProductGrid from '../../Components/product/ProductGrid';
import PageHeading from '../../Components/common/PageHeading';
import { productService } from '../../services/productService';
import { categoryService } from '../../services/categoryService';

const DEFAULT_CATEGORIES = [
  { name: 'Electronics', slug: 'electronics' },
  { name: 'Fashion', slug: 'fashion' },
  { name: 'Home & Living', slug: 'home' },
  { name: 'Beauty', slug: 'beauty' },
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
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const queryParam = searchParams.get('q') || '';
  const [query, setQuery] = useState(queryParam);
  const [category, setCategory] = useState('');
  const [sort, setSort] = useState('newest');

  // Keep search box in sync with URL
  useEffect(() => {
    setQuery(queryParam);
  }, [queryParam]);

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

  useEffect(() => {
    let active = true;
    setLoading(true);

    const request = categorySlug
      ? productService.getByCategory(categorySlug, { sort })
      : queryParam.trim()
      ? productService.search(queryParam.trim(), { sort })
      : productService.getAll({ sort, ...(category ? { category } : {}) });

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
  }, [categorySlug, category, queryParam, sort]);

  const title = categorySlug
    ? `${categorySlug.charAt(0).toUpperCase()}${categorySlug.slice(1)}`
    : queryParam
    ? `Results for “${queryParam}”`
    : 'All the good stuff';

  function submitSearch(event) {
    event.preventDefault();
    setSearchParams(query.trim() ? { q: query.trim() } : {});
  }

  return (
    <div className="container store-page listing-page">
      <div className="breadcrumb">
        <Link to="/">Home</Link>
        <ChevronRight size={14} />
        <span>Shop</span>
      </div>

      <PageHeading eyebrow="THE APPSICA EDIT" title={title}>
        Discover considered favourites across all your everyday categories.
      </PageHeading>

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

      <ProductGrid
        products={products}
        loading={loading}
        error={error}
        emptyMessage="Nothing here just yet. Try another category or search."
      />
    </div>
  );
}
