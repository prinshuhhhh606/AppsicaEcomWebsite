import React, { useState, useCallback, useEffect } from 'react';
import { AuthContext } from './AuthContextValue';
import { authService } from '../services/authService';
import { STORAGE_KEYS } from '../utils/constants';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => authService.getCurrentUser());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Sync profile from backend on app mount if token exists
  useEffect(() => {
    const token = authService.getToken();
    if (token) {
      authService
        .getProfile()
        .then((res) => {
          const profile = res?.user || res?.data?.user || res?.data || res;
          if (profile && (profile._id || profile.id || profile.email)) {
            const actualVendorStatus = profile.vendorStatus;
            const actualDeliveryStatus = profile.deliveryStatus;

            const formatted = {
              _id: profile._id || profile.id,
              id: profile.id || profile._id,
              name: profile.name,
              email: profile.email,
              role: profile.role || 'user',
              phone: profile.phone || '',
              vendorStatus: actualVendorStatus,
              deliveryStatus: actualDeliveryStatus,
              vehicleType: profile.vehicleType || 'bike',
              vehicleNumber: profile.vehicleNumber || '',
              isOnline: profile.isOnline ?? true,
              storeName: profile.storeName || '',
              storeDescription: profile.storeDescription || '',
              storeLogo: profile.storeLogo || '',
            };

            // Invalidate session immediately if vendor is not explicitly approved by admin
            if (profile.role === 'vendor' && actualVendorStatus !== 'approved') {
              authService.logout();
              setUser(null);
              return;
            }

            if (profile.role === 'delivery' && actualDeliveryStatus !== 'approved') {
              authService.logout();
              setUser(null);
              return;
            }

            setUser(formatted);
            localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(formatted));
          }
        })
        .catch(() => {
          // Token expired or invalid
          authService.logout();
          setUser(null);
        });
    }
  }, []);

  const login = useCallback(async (email, password) => {
    setLoading(true);
    setError(null);
    try {
      const data = await authService.login(email, password);
      const loggedInUser = data?.user || data;
      if (
        (loggedInUser?.role === 'vendor' && loggedInUser?.vendorStatus !== 'approved') ||
        (loggedInUser?.role === 'delivery' && loggedInUser?.deliveryStatus !== 'approved')
      ) {
        authService.logout();
        setUser(null);
        const msg =
          'Your registration request has not been approved by the admin yet. Please wait for approval.';
        setError(msg);
        throw new Error(msg);
      }
      setUser(loggedInUser);
      return data;
    } catch (err) {
      const message =
        err?.response?.data?.message || err?.message || 'Login failed. Please try again.';
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  const register = useCallback(async (registrationData) => {
    setLoading(true);
    setError(null);
    try {
      const data = await authService.register(registrationData);
      if (data?.token && data?.user) {
        if (
          (data.user.role === 'vendor' && data.user.vendorStatus !== 'approved') ||
          (data.user.role === 'delivery' && data.user.deliveryStatus !== 'approved')
        ) {
          authService.logout();
          setUser(null);
        } else {
          localStorage.setItem(STORAGE_KEYS.TOKEN, data.token);
          localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(data.user));
          setUser(data.user);
        }
      }
      return data;
    } catch (err) {
      const message =
        err?.response?.data?.message || err?.message || 'Registration failed. Please try again.';
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    authService.logout();
    setUser(null);
    setError(null);
  }, []);

  const updateUser = useCallback((userData) => {
    if (
      userData &&
      ((userData.role === 'vendor' && userData.vendorStatus !== 'approved') ||
        (userData.role === 'delivery' && userData.deliveryStatus !== 'approved'))
    ) {
      authService.logout();
      setUser(null);
      return;
    }
    setUser(userData);
    if (userData) {
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(userData));
    } else {
      authService.logout();
    }
  }, []);

  const isAuthenticated = Boolean(
    user &&
      authService.getToken() &&
      (user.role !== 'vendor' || user.vendorStatus === 'approved') &&
      (user.role !== 'delivery' || user.deliveryStatus === 'approved')
  );
  const isAdmin = Boolean(user && user.role === 'admin');
  const isVendor = Boolean(
    user && (user.role === 'admin' || (user.role === 'vendor' && user.vendorStatus === 'approved'))
  );
  const isDelivery = Boolean(
    user && (user.role === 'admin' || (user.role === 'delivery' && user.deliveryStatus === 'approved'))
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        isAuthenticated,
        isAdmin,
        isVendor,
        isDelivery,
        login,
        register,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
