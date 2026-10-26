import api from './api';

export const paymentService = {
  initiate: async (orderId) => { const res = await api.post('/payments/initiate', { orderId }); return res.data; },
  verify: async (data) => { const res = await api.post('/payments/verify', data); return res.data; },
  getStatus: async (paymentId) => { const res = await api.get(`/payments/${paymentId}`); return res.data; },
  // Admin
  getAll: async (params = {}) => { const res = await api.get('/admin/payments', { params }); return res.data; },
  refund: async (paymentId) => { const res = await api.post(`/admin/payments/${paymentId}/refund`); return res.data; },
};
