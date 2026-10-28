import axios from 'axios';
import { STORAGE_KEYS } from '../utils/constants';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: { 'Content-Type': 'application/json' },
  timeout: 10000,
});

// Request interceptor — attach auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
    if (token) {
      if (config.headers?.set) {
        config.headers.set('Authorization', `Bearer ${token}`);
      } else {
        config.headers = config.headers || {};
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor — handle 401 & 403 unapproved vendor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const url = error.config?.url || '';
    const isAuthEndpoint =
      url.includes('/login') ||
      url.includes('/register') ||
      url.includes('/forgot-password') ||
      url.includes('/reset-password');

    if (status === 401) {
      const hadToken = Boolean(localStorage.getItem(STORAGE_KEYS.TOKEN));
      localStorage.removeItem(STORAGE_KEYS.TOKEN);
      localStorage.removeItem(STORAGE_KEYS.USER);
      if (
        !isAuthEndpoint &&
        hadToken &&
        typeof window !== 'undefined' &&
        !window.location.pathname.startsWith('/login') &&
        !window.location.pathname.startsWith('/register') &&
        !window.location.pathname.startsWith('/vendor/login') &&
        !window.location.pathname.startsWith('/delivery/login')
      ) {
        const redirectTarget = encodeURIComponent(window.location.pathname + window.location.search);
        window.location.href = `/login?redirect=${redirectTarget}&notice=session_expired`;
      }
    } else if (status === 403 && !isAuthEndpoint) {
      const data = error.response?.data;
      const isVendorUnapproved =
        data?.vendorStatus ||
        data?.pendingApproval ||
        data?.rejected ||
        data?.message?.includes('approved by the admin') ||
        data?.message?.includes('seller');

      if (isVendorUnapproved || data?.message?.includes('deactivated')) {
        localStorage.removeItem(STORAGE_KEYS.TOKEN);
        localStorage.removeItem(STORAGE_KEYS.USER);

        if (
          typeof window !== 'undefined' &&
          !window.location.pathname.startsWith('/vendor/login') &&
          !window.location.pathname.startsWith('/login')
        ) {
          const vStatus = data?.vendorStatus || 'pending';
          const msg =
            data?.message ||
            'Your registration request has not been approved by the admin yet. Please wait for approval.';
          window.location.href = `/vendor/login?status=${vStatus}&message=${encodeURIComponent(msg)}`;
        }
      }

      const isDeliveryUnapproved =
        data?.deliveryStatus ||
        (url.includes('/delivery') && (data?.pendingApproval || data?.rejected || data?.message?.includes('approved')));

      if (isDeliveryUnapproved) {
        localStorage.removeItem(STORAGE_KEYS.TOKEN);
        localStorage.removeItem(STORAGE_KEYS.USER);

        if (
          typeof window !== 'undefined' &&
          !window.location.pathname.startsWith('/delivery/login')
        ) {
          const dStatus = data?.deliveryStatus || 'pending';
          const msg =
            data?.message ||
            (dStatus === 'rejected'
              ? 'Your registration request has been rejected. Please contact the admin for more information.'
              : 'Your account has not been approved by the admin yet. Please wait for approval.');
          window.location.href = `/delivery/login?status=${dStatus}&message=${encodeURIComponent(msg)}`;
        }
      }
    }

    return Promise.reject(error?.response?.data || error);
  }
);

export default api;
