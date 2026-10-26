import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import './Pagination.css';

const Pagination = ({ currentPage, totalPages, onPageChange }) => {
  if (totalPages <= 1) return null;

  const getPages = () => {
    const pages = [];
    const delta = 2;
    for (let i = Math.max(1, currentPage - delta); i <= Math.min(totalPages, currentPage + delta); i++) {
      pages.push(i);
    }
    if (pages[0] > 1) { pages.unshift('...'); pages.unshift(1); }
    if (pages[pages.length - 1] < totalPages) { pages.push('...'); pages.push(totalPages); }
    return pages;
  };

  return (
    <div className="pagination">
      <button className="pg-btn" onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1}>
        <ChevronLeft size={18} />
      </button>
      {getPages().map((page, i) => (
        page === '...'
          ? <span key={`e${i}`} className="pg-ellipsis">…</span>
          : <button key={page} className={`pg-btn ${currentPage === page ? 'active' : ''}`} onClick={() => onPageChange(page)}>{page}</button>
      ))}
      <button className="pg-btn" onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === totalPages}>
        <ChevronRight size={18} />
      </button>
    </div>
  );
};

export default Pagination;
