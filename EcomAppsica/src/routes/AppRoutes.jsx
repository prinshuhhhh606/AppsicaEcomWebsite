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
import AdminLayout from '../admin/layout/AdminLayout';
import { adminRouteElements } from '../admin/routes/AdminRoutes';
import NotFound from '../pages/errors/NotFound';

// Vendor Panel Pages
import VendorAuth from '../vendor/pages/VendorAuth';
import VendorLayout from '../vendor/layout/VendorLayout';
import VendorDashboard from '../vendor/pages/VendorDashboard';
import VendorProducts from '../vendor/pages/VendorProducts';
import VendorOrders from '../vendor/pages/VendorOrders';
import VendorReports from '../vendor/pages/VendorReports';
import VendorReviews from '../vendor/pages/VendorReviews';
import VendorProfile from '../vendor/pages/VendorProfile';

// Delivery Partner Panel Pages
import DeliveryAuth from '../delivery/pages/DeliveryAuth';
import DeliveryLayout from '../delivery/layout/DeliveryLayout';
import DeliveryDashboard from '../delivery/pages/DeliveryDashboard';
import AssignedOrders from '../delivery/pages/AssignedOrders';
import PickupManagement from '../delivery/pages/PickupManagement';
import ActiveDeliveries from '../delivery/pages/ActiveDeliveries';
import DeliveryHistory from '../delivery/pages/DeliveryHistory';
import DeliveryEarnings from '../delivery/pages/DeliveryEarnings';
import DeliveryNotifications from '../delivery/pages/DeliveryNotifications';
import DeliveryProfile from '../delivery/pages/DeliveryProfile';

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
  const location = useLocation();
  const redirectTarget = encodeURIComponent(location.pathname + location.search);

  if (!isAuthenticated) {
    return <Navigate to={`/login?redirect=${redirectTarget}`} replace />;
  }

  if (!isAdmin) {
    return <Navigate to={`/login?redirect=${redirectTarget}&notice=admin_required`} replace />;
  }

  return children;
}

/**
 * Route Guard for Vendor Users (or Admin)
 */
function VendorOnly({ children }) {
  const { isAuthenticated, isVendor, user } = useContext(AuthContext);
  const location = useLocation();
  const redirectTarget = encodeURIComponent(location.pathname + location.search);

  if (!isAuthenticated) {
    return <Navigate to={`/vendor/login?redirect=${redirectTarget}`} replace />;
  }

  // Super Admin has administrative access
  if (user?.role === 'admin') {
    return children;
  }

  // Seller MUST be approved by Admin
  if (user?.role === 'vendor') {
    if (user?.vendorStatus !== 'approved') {
      const status = user?.vendorStatus || 'pending';
      const message =
        status === 'rejected'
          ? 'Your seller application was rejected by the admin. Please contact support or reapply.'
          : status === 'suspended'
            ? 'Your seller account has been suspended by the admin. Please contact support.'
            : 'Your registration request has not been approved by the admin yet. Please wait for approval.';

      return (
        <Navigate
          to={`/vendor/login?status=${status}&message=${encodeURIComponent(message)}`}
          replace
        />
      );
    }
    return children;
  }

  return <Navigate to="/vendor/login" replace />;
}

/**
 * Route Guard for Delivery Partner Users (or Admin)
 */
function DeliveryOnly({ children }) {
  const { isAuthenticated, isDelivery, user } = useContext(AuthContext);
  const location = useLocation();
  const redirectTarget = encodeURIComponent(location.pathname + location.search);

  if (!isAuthenticated) {
    return <Navigate to={`/delivery/login?redirect=${redirectTarget}`} replace />;
  }

  // Super Admin has administrative access
  if (user?.role === 'admin') {
    return children;
  }

  // Delivery Partner MUST be approved by Admin
  if (user?.role === 'delivery') {
    if (user?.deliveryStatus !== 'approved') {
      const status = user?.deliveryStatus || 'pending';
      const message =
        status === 'rejected'
          ? 'Your registration request has been rejected. Please contact the admin for more information.'
          : status === 'suspended'
            ? 'Your delivery partner account has been temporarily suspended by administrator.'
            : 'Your account has not been approved by the admin yet. Please wait for approval.';

      return (
        <Navigate
          to={`/delivery/login?status=${status}&message=${encodeURIComponent(message)}`}
          replace
        />
      );
    }
    return children;
  }

  return <Navigate to="/delivery/login" replace />;
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
        element={<TrackOrder />}
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

      {/* Admin Panel (Protected - Admin Role Required) */}
      <Route
        path="/admin"
        element={
          <AdminOnly>
            <AdminLayout />
          </AdminOnly>
        }
      >
        {adminRouteElements}
      </Route>

      {/* Vendor Auth (Public seller login & registration) */}
      <Route path="/vendor/login" element={<VendorAuth />} />
      <Route path="/vendor/register" element={<VendorAuth />} />

      {/* Vendor Panel (Protected - Vendor or Admin Required) */}
      <Route
        path="/vendor"
        element={
          <VendorOnly>
            <VendorLayout title="Seller Central" />
          </VendorOnly>
        }
      >
        <Route index element={<Navigate to="/vendor/dashboard" replace />} />
        <Route path="dashboard" element={<VendorDashboard />} />
        <Route path="products" element={<VendorProducts />} />
        <Route path="orders" element={<VendorOrders />} />
        <Route path="reports" element={<VendorReports />} />
        <Route path="reviews" element={<VendorReviews />} />
        <Route path="profile" element={<VendorProfile />} />
      </Route>

      {/* Delivery Partner Auth (Public rider login & registration) */}
      <Route path="/delivery/login" element={<DeliveryAuth />} />
      <Route path="/delivery/register" element={<DeliveryAuth />} />

      {/* Delivery Partner Panel (Protected - Delivery Partner or Admin) */}
      <Route
        path="/delivery"
        element={
          <DeliveryOnly>
            <DeliveryLayout />
          </DeliveryOnly>
        }
      >
        <Route index element={<Navigate to="/delivery/dashboard" replace />} />
        <Route path="dashboard" element={<DeliveryDashboard />} />
        <Route path="assigned" element={<AssignedOrders />} />
        <Route path="pickups" element={<PickupManagement />} />
        <Route path="active" element={<ActiveDeliveries />} />
        <Route path="history" element={<DeliveryHistory />} />
        <Route path="earnings" element={<DeliveryEarnings />} />
        <Route path="notifications" element={<DeliveryNotifications />} />
        <Route path="profile" element={<DeliveryProfile />} />
      </Route>

      {/* 404 Not Found Fallback */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
