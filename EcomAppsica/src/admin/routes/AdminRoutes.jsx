import React from 'react';
import { Route, Navigate } from 'react-router-dom';

import AdminDashboard from '../pages/Dashboard';
import CustomerList from '../pages/Customers/CustomerList';
import VendorList from '../pages/Vendors/VendorList';
import VendorApplications from '../pages/Vendors/VendorApplications';
import ProductList from '../pages/Products/ProductList';
import CategoryManagement from '../pages/Categories/CategoryManagement';
import OrderList from '../pages/Orders/OrderList';
import PaymentList from '../pages/Payments/PaymentList';
import Payouts from '../pages/Finance/Payouts';
import ReturnList from '../pages/Returns/ReturnList';
import ShippingManagement from '../pages/Shipping/ShippingManagement';
import CouponManagement from '../pages/Coupons/CouponManagement';
import BannerManagement from '../pages/Banners/BannerManagement';
import Reports from '../pages/Reports/Reports';
import NotificationList from '../pages/Notifications/NotificationList';
import AuditLogList from '../pages/AuditLogs/AuditLogList';
import SystemSettings from '../pages/Settings/SystemSettings';
import DeliveryPartners from '../pages/Delivery/DeliveryPartners';

export const adminRouteElements = (
  <>
    <Route index element={<Navigate to="dashboard" replace />} />
    <Route path="dashboard" element={<AdminDashboard />} />
    <Route path="users" element={<CustomerList />} />
    <Route path="vendors" element={<VendorList />} />
    <Route path="vendor-applications" element={<VendorApplications />} />
    <Route path="seller-approval-requests" element={<VendorApplications />} />
    <Route path="delivery-partners" element={<DeliveryPartners />} />
    <Route path="products" element={<ProductList />} />
    <Route path="categories" element={<CategoryManagement />} />
    <Route path="orders" element={<OrderList />} />
    <Route path="payments" element={<PaymentList />} />
    <Route path="payouts" element={<Payouts />} />
    <Route path="returns" element={<ReturnList />} />
    <Route path="shipping" element={<ShippingManagement />} />
    <Route path="coupons" element={<CouponManagement />} />
    <Route path="banners" element={<BannerManagement />} />
    <Route path="reports" element={<Reports />} />
    <Route path="notifications" element={<NotificationList />} />
    <Route path="audit-logs" element={<AuditLogList />} />
    <Route path="settings" element={<SystemSettings />} />
  </>
);

export default adminRouteElements;
