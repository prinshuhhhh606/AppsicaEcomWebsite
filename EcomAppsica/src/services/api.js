import axios from 'axios';
import { STORAGE_KEYS } from '../utils/constants';

/**
 * Normalizes the API Base URL so that:
 * 1. In local dev (unset VITE_API_URL): defaults cleanly to '/api' (handled by Vite proxy -> http://127.0.0.1:5000)
 * 2. In production (deployed VITE_API_URL): guarantees it ends with '/api' without double slashes
 * 3. Never produces '/api/api' or drops '/api'
 */
const getNormalizedApiBase = () => {
  const envUrl = (import.meta.env.VITE_API_URL || import.meta.env.VITE_BACKEND_URL || '').trim();

  // If empty or explicitly relative '/api', return '/api' for Vite dev proxy
  if (!envUrl || envUrl === '/api') {
    return '/api';
  }

  // Remove trailing slashes
  let cleanUrl = envUrl.replace(/\/+$/, '');

  // If the user provided URL without '/api', append '/api'
  if (!cleanUrl.endsWith('/api')) {
    cleanUrl = `${cleanUrl}/api`;
  }

  return cleanUrl;
};

const api = axios.create({
  baseURL: getNormalizedApiBase(),
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

// Request interceptor — attach auth token & guard against duplicate '/api/api'
api.interceptors.request.use(
  (config) => {
    // If config.url starts with /api/ and baseURL already includes /api, strip redundant /api
    if (config.url && config.url.startsWith('/api/')) {
      config.url = config.url.replace(/^\/api/, '');
    }

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

// Response interceptor — handle 401 & 403 unapproved vendor / delivery partner
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
