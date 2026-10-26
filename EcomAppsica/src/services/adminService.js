import api from './api';

export const adminService = {
  getDashboardStats: async () => { const res = await api.get('/admin/dashboard'); return res.data; },
  getCustomers: async (params = {}) => { const res = await api.get('/admin/customers', { params }); return res.data; },
  getCustomerById: async (id) => { const res = await api.get(`/admin/customers/${id}`); return res.data; },
  getBanners: async () => { const res = await api.get('/admin/banners'); return res.data; },
  createBanner: async (data) => { const res = await api.post('/admin/banners', data); return res.data; },
  updateBanner: async (id, data) => { const res = await api.put(`/admin/banners/${id}`, data); return res.data; },
  deleteBanner: async (id) => { const res = await api.delete(`/admin/banners/${id}`); return res.data; },
  getCoupons: async () => { const res = await api.get('/admin/coupons'); return res.data; },
  createCoupon: async (data) => { const res = await api.post('/admin/coupons', data); return res.data; },
  updateCoupon: async (id, data) => { const res = await api.put(`/admin/coupons/${id}`, data); return res.data; },
  deleteCoupon: async (id) => { const res = await api.delete(`/admin/coupons/${id}`); return res.data; },
  getShippingZones: async () => { const res = await api.get('/admin/shipping'); return res.data; },
  updateShipping: async (id, data) => { const res = await api.put(`/admin/shipping/${id}`, data); return res.data; },
};
