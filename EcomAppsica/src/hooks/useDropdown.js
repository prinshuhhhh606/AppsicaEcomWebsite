import { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Custom hook to manage dropdown open/close behavior:
 * - Outside click & touch detection (desktop + mobile)
 * - Escape key to close
 * - Automatic close on route change (URL navigation)
 * - Accessible toggle, open, and close handlers
 *
 * @param {boolean} initialState - initial open state (default false)
 */
export function useDropdown(initialState = false) {
  const [isOpen, setIsOpen] = useState(initialState);
  const dropdownRef = useRef(null);
  const location = useLocation();

  // Sync state on route change (React recommended pattern for state derived from external prop)
  const [prevPath, setPrevPath] = useState(location.pathname);
  if (prevPath !== location.pathname) {
    setPrevPath(location.pathname);
    setIsOpen(false);
  }

  const close = useCallback(() => {
    setIsOpen(false);
  }, []);

  const open = useCallback(() => {
    setIsOpen(true);
  }, []);

  const toggle = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  // Click/Touch outside and Escape key listeners
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside, { passive: true });
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  return {
    isOpen,
    setIsOpen,
    dropdownRef,
    open,
    close,
    toggle,
  };
}

export default useDropdown;
