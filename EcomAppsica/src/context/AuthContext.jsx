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
            const formatted = {
              _id: profile._id || profile.id,
              id: profile.id || profile._id,
              name: profile.name,
              email: profile.email,
              role: profile.role || 'user',
              phone: profile.phone || '',
            };
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
        localStorage.setItem(STORAGE_KEYS.TOKEN, data.token);
        localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(data.user));
        setUser(data.user);
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
    setUser(userData);
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(userData));
  }, []);

  const isAuthenticated = Boolean(user && authService.getToken());
  const isAdmin = user?.role === 'admin';

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        isAuthenticated,
        isAdmin,
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
