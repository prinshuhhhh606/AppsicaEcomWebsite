import React, { useContext } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContextValue';

// Public & Store Pages
import Home from '../pages/home/Home';
import Products from '../pages/shop/Products';
import ProductDetails from '../pages/product/ProductDetails';
import Cart from '../pages/cart/Cart';

// Authentication Pages
import Login from '../pages/auth/Login';
import Register from '../pages/auth/Register';
import ForgotPassword from '../pages/auth/ForgotPassword';

// Account & Wishlist Pages
import Profile from '../pages/account/Profile';
import Addresses from '../pages/account/Addresses';
import Wishlist from '../pages/account/Wishlist';

// Checkout, Payment & Orders Pages
import Checkout from '../pages/checkout/Checkout';
import PaymentResult from '../pages/payment/PaymentResult';
import MyOrders from '../pages/orders/MyOrders';
import TrackOrder from '../pages/orders/TrackOrder';
import OrderConfirmation from '../pages/orders/OrderConfirmation';

// Admin & Error Pages
import AdminDashboard from '../admin/pages/Dashboard';
import NotFound from '../pages/errors/NotFound';

/**
 * Route Guard for Authenticated Users (Preserves destination URL)
 */
function Protected({ children }) {
  const { isAuthenticated } = useContext(AuthContext);
  const location = useLocation();
  const redirectTarget = encodeURIComponent(location.pathname + location.search);
  return isAuthenticated ? children : <Navigate to={`/login?redirect=${redirectTarget}`} replace />;
}

/**
 * Route Guard for Admin Users Only
 */
function AdminOnly({ children }) {
  const { isAuthenticated, isAdmin } = useContext(AuthContext);
  return isAuthenticated && isAdmin ? children : <Navigate to={isAuthenticated ? '/' : '/login'} replace />;
}

export default function AppRoutes() {
  return (
    <Routes>
      {/* Home & Catalog (Public - No Login Required) */}
      <Route path="/" element={<Home />} />
      <Route path="/products" element={<Products />} />
      <Route path="/category/:slug" element={<Products />} />
      <Route path="/search" element={<Products />} />
      <Route path="/product/:id" element={<ProductDetails />} />

      {/* Cart (Public - Guests can manage cart) */}
      <Route path="/cart" element={<Cart />} />

      {/* Checkout & Payment (Protected - Requires Customer Login) */}
      <Route
        path="/checkout"
        element={
          <Protected>
            <Checkout />
          </Protected>
        }
      />
      <Route
        path="/payment/result"
        element={
          <Protected>
            <PaymentResult />
          </Protected>
        }
      />

      {/* Auth */}
      <Route path="/register" element={<Register />} />
      <Route path="/login" element={<Login />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />

      {/* User Orders & Tracking (Protected - Requires Customer Login) */}
      <Route
        path="/my-orders"
        element={
          <Protected>
            <MyOrders />
          </Protected>
        }
      />
      <Route
        path="/track-order/:orderId"
        element={
          <Protected>
            <TrackOrder />
          </Protected>
        }
      />
      <Route
        path="/order-confirmation/:id"
        element={
          <Protected>
            <OrderConfirmation />
          </Protected>
        }
      />
      <Route
        path="/account/profile"
        element={
          <Protected>
            <Profile />
          </Protected>
        }
      />
      <Route
        path="/account/addresses"
        element={
          <Protected>
            <Addresses />
          </Protected>
        }
      />
      <Route path="/wishlist" element={<Wishlist />} />

      {/* Admin Dashboard (Protected - Admin Role Required) */}
      <Route
        path="/admin"
        element={
          <AdminOnly>
            <AdminDashboard />
          </AdminOnly>
        }
      />

      {/* 404 Not Found Fallback */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
