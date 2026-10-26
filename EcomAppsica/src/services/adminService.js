import api from './api';

export const adminService = {
  // 1. Dashboard Metrics
  getDashboardStats: async (params = {}) => {
    const res = await api.get('/admin/dashboard', { params });
    return res.data;
  },

  // 2. Customers / Users
  getCustomers: async (params = {}) => {
    const res = await api.get('/admin/customers', { params });
    return res.data;
  },
  getCustomerById: async (id) => {
    const res = await api.get(`/admin/customers/${id}`);
    return res.data;
  },
  updateCustomerStatus: async (id, data) => {
    const res = await api.put(`/admin/customers/${id}/status`, data);
    return res.data;
  },

  // 3. Vendors & Moderation
  getVendors: async () => {
    const res = await api.get('/admin/vendors');
    return res.data;
  },
  updateVendorStatus: async (id, data) => {
    const res = await api.put(`/admin/vendors/${id}/status`, data);
    return res.data;
  },

  // 4. Commissions & Payouts
  getPayouts: async () => {
    const res = await api.get('/admin/payouts');
    return res.data;
  },
  createPayout: async (data) => {
    const res = await api.post('/admin/payouts', data);
    return res.data;
  },
  updatePayoutStatus: async (id, data) => {
    const res = await api.put(`/admin/payouts/${id}`, data);
    return res.data;
  },

  // 5. Returns & Refunds
  getReturnRequests: async () => {
    const res = await api.get('/admin/returns');
    return res.data;
  },
  updateReturnStatus: async (id, data) => {
    const res = await api.put(`/admin/returns/${id}/status`, data);
    return res.data;
  },

  // 6. Banners & Content
  getBanners: async () => {
    const res = await api.get('/admin/banners');
    return res.data;
  },
  createBanner: async (data) => {
    const res = await api.post('/admin/banners', data);
    return res.data;
  },
  updateBanner: async (id, data) => {
    const res = await api.put(`/admin/banners/${id}`, data);
    return res.data;
  },
  deleteBanner: async (id) => {
    const res = await api.delete(`/admin/banners/${id}`);
    return res.data;
  },

  // 7. Coupons & Promotions
  getCoupons: async () => {
    const res = await api.get('/admin/coupons');
    return res.data;
  },
  createCoupon: async (data) => {
    const res = await api.post('/admin/coupons', data);
    return res.data;
  },
  updateCoupon: async (id, data) => {
    const res = await api.put(`/admin/coupons/${id}`, data);
    return res.data;
  },
  deleteCoupon: async (id) => {
    const res = await api.delete(`/admin/coupons/${id}`);
    return res.data;
  },

  // 8. Shipping Zones & Logistics
  getShippingZones: async () => {
    const res = await api.get('/admin/shipping');
    return res.data;
  },
  createShippingZone: async (data) => {
    const res = await api.post('/admin/shipping', data);
    return res.data;
  },
  updateShipping: async (id, data) => {
    const res = await api.put(`/admin/shipping/${id}`, data);
    return res.data;
  },
  deleteShippingZone: async (id) => {
    const res = await api.delete(`/admin/shipping/${id}`);
    return res.data;
  },

  // 9. System Audit Logs
  getAuditLogs: async (params = {}) => {
    const res = await api.get('/admin/audit-logs', { params });
    return res.data;
  },

  // 10. Admin Notifications
  getNotifications: async () => {
    const res = await api.get('/admin/notifications');
    return res.data;
  },
  markAllNotificationsRead: async () => {
    const res = await api.put('/admin/notifications/read-all');
    return res.data;
  },

  // 11. System Settings
  getSystemSettings: async () => {
    const res = await api.get('/admin/settings');
    return res.data;
  },
  updateSystemSettings: async (data) => {
    const res = await api.put('/admin/settings', data);
    return res.data;
  },

  // 12. Reports & Analytics
  getReportsData: async (params = {}) => {
    const res = await api.get('/admin/reports', { params });
    return res.data;
  },

  // 13. Delivery Fleet Management
  getDeliveryPartners: async () => {
    const res = await api.get('/admin/delivery-partners');
    return res.data;
  },
  updateDeliveryPartnerStatus: async (id, status) => {
    const res = await api.put(`/admin/delivery-partners/${id}/status`, { status });
    return res.data;
  },
  assignOrderDelivery: async (orderId, deliveryPartnerId, deliveryFee = 50) => {
    const res = await api.put(`/admin/orders/${orderId}/assign-delivery`, { deliveryPartnerId, deliveryFee });
    return res.data;
  },
  getDeliveryEarnings: async () => {
    const res = await api.get('/admin/delivery-earnings');
    return res.data;
  },
};
