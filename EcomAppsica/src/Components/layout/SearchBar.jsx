import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, TrendingUp } from 'lucide-react';
import './SearchBar.css';

const POPULAR = ['iPhone', 'Sneakers', 'Laptop', 'T-Shirt', 'Headphones'];

const SearchBar = ({ onClose }) => {
  const [query, setQuery] = useState('');
  const inputRef = useRef(null);
  const navigate = useNavigate();
  useEffect(() => { inputRef.current?.focus(); }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/search?q=${encodeURIComponent(query.trim())}`);
      onClose();
    }
  };

  const handlePopular = (term) => {
    navigate(`/search?q=${encodeURIComponent(term)}`);
    onClose();
  };

  return (
    <div className="searchbar-overlay animate-fadeIn" onClick={onClose}>
      <div className="searchbar-modal animate-slideDown" onClick={e => e.stopPropagation()}>
        <form className="searchbar-form" onSubmit={handleSearch}>
          <Search size={22} className="searchbar-icon" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search products, brands, categories..."
            className="searchbar-input"
          />
          {query && <button type="button" className="searchbar-clear" onClick={() => setQuery('')}><X size={18} /></button>}
          <button type="submit" className="btn btn-primary btn-sm">Search</button>
        </form>

        <div className="searchbar-popular">
          <p className="popular-title"><TrendingUp size={14} /> Popular Searches</p>
          <div className="popular-tags">
            {POPULAR.map(t => (
              <button key={t} className="popular-tag" onClick={() => handlePopular(t)}>{t}</button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SearchBar;
