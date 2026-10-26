import api from './api';

export const categoryService = {
  getAll: async () => { const res = await api.get('/categories'); return res.data; },
  getBySlug: async (slug) => { const res = await api.get(`/categories/${slug}`); return res.data; },
  create: async (data) => { const res = await api.post('/admin/categories', data); return res.data; },
  update: async (id, data) => { const res = await api.put(`/admin/categories/${id}`, data); return res.data; },
  delete: async (id) => { const res = await api.delete(`/admin/categories/${id}`); return res.data; },
};
