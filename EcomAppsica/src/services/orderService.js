import api from './api';

export const orderService = {
  // Customer Order Operations
  getMyOrders: async (params = {}) => {
    const res = await api.get('/orders', { params });
    return res.data;
  },

  getById: async (id) => {
    const res = await api.get(`/orders/${id}`);
    return res.data;
  },

  cancelOrder: async (id, reason) => {
    const res = await api.put(`/orders/${id}/cancel`, { reason });
    return res.data;
  },

  requestReturn: async (id, reason) => {
    const res = await api.post(`/orders/${id}/return`, { reason });
    return res.data;
  },

  trackOrder: async (id) => {
    const res = await api.get(`/orders/${id}/track`);
    return res.data;
  },

  // Admin Order Management
  getAllOrders: async (params = {}) => {
    const res = await api.get('/admin/orders', { params });
    return res.data;
  },

  updateStatus: async (id, status, note = '') => {
    const res = await api.put(`/admin/orders/${id}/status`, { status, note });
    return res.data;
  },

  updateTracking: async (id, trackingData) => {
    const res = await api.put(`/admin/orders/${id}/tracking`, trackingData);
    return res.data;
  },

  verifyPayment: async (id, transactionId = null) => {
    const res = await api.put(`/admin/orders/${id}/verify-payment`, { transactionId });
    return res.data;
  },

  processRefund: async (id, reason = '') => {
    const res = await api.post(`/admin/orders/${id}/refund`, { reason });
    return res.data;
  },
};
