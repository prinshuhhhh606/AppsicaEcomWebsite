import api from './api';

export const wishlistService = {
  getWishlist: async () => { const res = await api.get('/wishlist'); return res.data; },
  addToWishlist: async (productId) => { const res = await api.post('/wishlist', { productId }); return res.data; },
  removeFromWishlist: async (productId) => { const res = await api.delete(`/wishlist/${productId}`); return res.data; },
  isWishlisted: async (productId) => { const res = await api.get(`/wishlist/check/${productId}`); return res.data; },
};
