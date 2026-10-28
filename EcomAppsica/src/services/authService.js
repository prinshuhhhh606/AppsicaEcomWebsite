import api from './api';
import { STORAGE_KEYS } from '../utils/constants';

export const authService = {
  login: async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    if (res.data?.token && res.data?.user) {
      if (
        (res.data.user.role === 'vendor' && res.data.user.vendorStatus !== 'approved') ||
        (res.data.user.role === 'delivery' && res.data.user.deliveryStatus !== 'approved')
      ) {
        localStorage.removeItem(STORAGE_KEYS.TOKEN);
        localStorage.removeItem(STORAGE_KEYS.USER);
        throw new Error(
          'Your registration request has not been approved by the admin yet. Please wait for approval.'
        );
      }
      localStorage.setItem(STORAGE_KEYS.TOKEN, res.data.token);
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(res.data.user));
    }
    return res.data;
  },
  register: async (data) => {
    const res = await api.post('/auth/register', data);
    return res.data;
  },
  logout: () => {
    localStorage.removeItem(STORAGE_KEYS.TOKEN);
    localStorage.removeItem(STORAGE_KEYS.USER);
  },
  forgotPassword: async (email) => {
    const res = await api.post('/auth/forgot-password', { email });
    return res.data;
  },
  resetPassword: async (token, password) => {
    const res = await api.post('/auth/reset-password', { token, password });
    return res.data;
  },
  getProfile: async () => {
    const res = await api.get('/auth/profile');
    return res.data;
  },
  updateProfile: async (data) => {
    const res = await api.put('/auth/profile', data);
    return res.data;
  },
  getCurrentUser: () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.USER);
      if (!raw) return null;
      const user = JSON.parse(raw);
      if (!user) return null;

      // Disallow unverified/pending/rejected/suspended vendor or delivery sessions from localStorage restoration
      if (
        (user.role === 'vendor' && user.vendorStatus !== 'approved') ||
        (user.role === 'delivery' && user.deliveryStatus !== 'approved')
      ) {
        localStorage.removeItem(STORAGE_KEYS.TOKEN);
        localStorage.removeItem(STORAGE_KEYS.USER);
        return null;
      }

      return user;
    } catch {
      return null;
    }
  },
  getToken: () => localStorage.getItem(STORAGE_KEYS.TOKEN),
  isAuthenticated: () => {
    const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
    const userRaw = localStorage.getItem(STORAGE_KEYS.USER);
    if (!token || !userRaw) return false;
    try {
      const u = JSON.parse(userRaw);
      if (u?.role === 'vendor' && u?.vendorStatus !== 'approved') return false;
      if (u?.role === 'delivery' && u?.deliveryStatus !== 'approved') return false;
      return true;
    } catch {
      return false;
    }
  },
};
