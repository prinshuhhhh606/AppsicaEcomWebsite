import api from './api';

export const productService = {
  getAll: async (params = {}) => {
    const res = await api.get('/products', { params });
    return res.data;
  },
  getById: async (id) => {
    const res = await api.get(`/products/${id}`);
    return res.data;
  },
  getByCategory: async (slug, params = {}) => {
    const res = await api.get(`/products/category/${slug}`, { params });
    return res.data;
  },
  search: async (query, params = {}) => {
    const res = await api.get('/products/search', { params: { q: query, ...params } });
    return res.data;
  },
  getFeatured: async () => {
    const res = await api.get('/products/featured');
    return res.data;
  },
  getReviews: async (id) => {
    const res = await api.get(`/products/${id}/reviews`);
    return res.data;
  },
  addReview: async (id, data) => {
    const res = await api.post(`/products/${id}/reviews`, data);
    return res.data;
  },
  // Admin & Moderation Operations
  getAllForAdmin: async (params = {}) => {
    const res = await api.get('/admin/products', { params });
    return res.data;
  },
  moderate: async (id, data) => {
    const res = await api.put(`/admin/products/${id}/approval`, data);
    return res.data;
  },
  create: async (data) => {
    const res = await api.post('/admin/products', data);
    return res.data;
  },
  update: async (id, data) => {
    const res = await api.put(`/admin/products/${id}`, data);
    return res.data;
  },
  delete: async (id) => {
    const res = await api.delete(`/admin/products/${id}`);
    return res.data;
  },
};
