import React, { useState, useCallback } from 'react';
import { WishlistContext } from './WishlistContextValue';

export const WishlistProvider = ({ children }) => {
  const [wishlist, setWishlist] = useState(() => {
    try { const saved = localStorage.getItem('appsica_wishlist'); return saved ? JSON.parse(saved) : []; }
    catch { return []; }
  });

  const addToWishlist = useCallback((product) => {
    setWishlist(prev => {
      if (prev.find(i => i._id === product._id)) return prev;
      const updated = [...prev, product];
      localStorage.setItem('appsica_wishlist', JSON.stringify(updated));
      return updated;
    });
  }, []);

  const removeFromWishlist = useCallback((productId) => {
    setWishlist(prev => {
      const updated = prev.filter(i => i._id !== productId);
      localStorage.setItem('appsica_wishlist', JSON.stringify(updated));
      return updated;
    });
  }, []);

  const isWishlisted = useCallback((productId) => wishlist.some(i => i._id === productId), [wishlist]);
  const wishlistCount = wishlist.length;

  return (
    <WishlistContext.Provider value={{ wishlist, wishlistCount, addToWishlist, removeFromWishlist, isWishlisted }}>
      {children}
    </WishlistContext.Provider>
  );
};
