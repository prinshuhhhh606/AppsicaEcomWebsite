import api from './api';

export const vendorService = {
  // Vendor Auth
  register: async (vendorData) => {
    const res = await api.post('/vendor/register', vendorData);
    return res.data;
  },

  login: async (email, password) => {
    const res = await api.post('/vendor/login', { email, password });
    return res.data;
  },

  // Vendor Profile
  getProfile: async () => {
    const res = await api.get('/vendor/profile');
    return res.data;
  },

  updateProfile: async (data) => {
    const res = await api.put('/vendor/profile', data);
    return res.data;
  },

  // Vendor Dashboard
  getDashboard: async () => {
    const res = await api.get('/vendor/dashboard');
    return res.data;
  },

  // Vendor Products
  getProducts: async (params = {}) => {
    const res = await api.get('/vendor/products', { params });
    return res.data;
  },

  getProductById: async (id) => {
    const res = await api.get(`/vendor/products/${id}`);
    return res.data;
  },

  createProduct: async (productData) => {
    const res = await api.post('/vendor/products', productData);
    return res.data;
  },

  updateProduct: async (id, productData) => {
    const res = await api.put(`/vendor/products/${id}`, productData);
    return res.data;
  },

  toggleProductStatus: async (id, isActive) => {
    const res = await api.patch(`/vendor/products/${id}/toggle-status`, { isActive });
    return res.data;
  },

  deleteProduct: async (id) => {
    const res = await api.delete(`/vendor/products/${id}`);
    return res.data;
  },

  // Vendor Orders
  getOrders: async (params = {}) => {
    const res = await api.get('/vendor/orders', { params });
    return res.data;
  },

  getOrderById: async (id) => {
    const res = await api.get(`/vendor/orders/${id}`);
    return res.data;
  },

  updateOrderStatus: async (id, statusData) => {
    const res = await api.put(`/vendor/orders/${id}/status`, statusData);
    return res.data;
  },

  triggerDispatch: async (orderId) => {
    const res = await api.post(`/vendor/orders/${orderId}/dispatch`);
    return res.data;
  },

  // Delivery Partner Assignment (Seller assigns Delivery Boy)
  getDeliveryPartners: async () => {
    const res = await api.get('/vendor/delivery-partners');
    return res.data;
  },

  assignDeliveryPartner: async (orderId, deliveryPartnerId, deliveryFee = 50) => {
    const res = await api.put(`/vendor/orders/${orderId}/assign-delivery`, { deliveryPartnerId, deliveryFee });
    return res.data;
  },

  // Sales Reports & Earnings
  getReports: async () => {
    const res = await api.get('/vendor/reports');
    return res.data;
  },

  // Customer Reviews
  getReviews: async () => {
    const res = await api.get('/vendor/reviews');
    return res.data;
  },

  replyReview: async (reviewId, replyText) => {
    const res = await api.post(`/vendor/reviews/${reviewId}/reply`, { replyText });
    return res.data;
  },

  // Vendor Notifications
  getNotifications: async () => {
    const res = await api.get('/vendor/notifications');
    return res.data;
  },

  markAllNotificationsRead: async () => {
    const res = await api.put('/vendor/notifications/read-all');
    return res.data;
  },
};
