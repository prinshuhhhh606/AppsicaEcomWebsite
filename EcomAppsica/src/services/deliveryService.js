import api from './api';

export const deliveryService = {
  // Authentication
  login: async (email, password) => {
    const res = await api.post('/delivery/login', { email, password });
    return res.data;
  },

  register: async (data) => {
    const res = await api.post('/delivery/register', data);
    return res.data;
  },

  // Profile & Availability
  getProfile: async () => {
    const res = await api.get('/delivery/profile');
    return res.data;
  },

  updateProfile: async (data) => {
    const res = await api.put('/delivery/profile', data);
    return res.data;
  },

  toggleAvailability: async () => {
    const res = await api.put('/delivery/toggle-availability');
    return res.data;
  },

  updateAvailabilityStatus: async (status, serviceRadiusKm) => {
    const res = await api.put('/delivery/availability-status', { status, serviceRadiusKm });
    return res.data;
  },

  updateLocation: async (lat, lng, address) => {
    const res = await api.put('/delivery/location', { lat, lng, address });
    return res.data;
  },

  // Dashboard
  getDashboard: async () => {
    const res = await api.get('/delivery/dashboard');
    return res.data;
  },

  // Orders & Lifecycle
  getAssignedOrders: async (params = {}) => {
    const res = await api.get('/delivery/assigned-orders', { params });
    return res.data;
  },

  getOrderDetails: async (id) => {
    const res = await api.get(`/delivery/order/${id}`);
    return res.data;
  },

  acceptAssignment: async (id) => {
    const res = await api.put(`/delivery/order/${id}/accept`);
    return res.data;
  },

  rejectAssignment: async (id, reason) => {
    const res = await api.put(`/delivery/order/${id}/reject`, { reason });
    return res.data;
  },

  arrivePickup: async (id) => {
    const res = await api.put(`/delivery/order/${id}/arrive-pickup`);
    return res.data;
  },

  confirmPickup: async (id, data = {}) => {
    const res = await api.put(`/delivery/order/${id}/confirm-pickup`, data);
    return res.data;
  },

  reportPickupException: async (id, data) => {
    const res = await api.put(`/delivery/order/${id}/pickup-exception`, data);
    return res.data;
  },

  startOutForDelivery: async (id) => {
    const res = await api.put(`/delivery/order/${id}/out-for-delivery`);
    return res.data;
  },

  verifyOtp: async (id, otp, data = {}) => {
    const res = await api.put(`/delivery/order/${id}/verify-otp`, { otp, ...data });
    return res.data;
  },

  reportDeliveryFailed: async (id, data) => {
    const res = await api.put(`/delivery/order/${id}/delivery-failed`, data);
    return res.data;
  },

  // History & Earnings
  getHistory: async (params = {}) => {
    const res = await api.get('/delivery/history', { params });
    return res.data;
  },

  getEarnings: async () => {
    const res = await api.get('/delivery/earnings');
    return res.data;
  },

  // Notifications
  getNotifications: async () => {
    const res = await api.get('/delivery/notifications');
    return res.data;
  },

  markAllNotificationsRead: async () => {
    const res = await api.put('/delivery/notifications/read-all');
    return res.data;
  },
};
