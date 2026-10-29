import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import AdminSidebar from './AdminSidebar';
import AdminHeader from './AdminHeader';
import './AdminLayout.css';

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  // Dynamic header titles based on pathname
  const getPageTitle = (path) => {
    if (path.includes('/dashboard')) return 'Platform Executive Dashboard';
    if (path.includes('/users')) return 'Customer & User Management';
    if (path.includes('/pending-approval') || path.includes('/pending-approvals')) return 'Pending Registration Approvals';
    if (path.includes('/vendor-applications') || path.includes('/seller-approval-requests')) return 'Pending Registration Approvals';
    if (path.includes('/delivery-applications') || path.includes('/delivery-partner-requests')) return 'Pending Registration Approvals';
    if (path.includes('/vendors')) return 'Vendor Directory & Store Profiles';
    if (path.includes('/delivery-assignments') || path.includes('/assign-delivery')) return 'Dispatch & Delivery Assignments';
    if (path.includes('/delivery-partners')) return 'Delivery Fleet & Rider Dispatch';
    if (path.includes('/products')) return 'Catalog Products & Inventory Stock';
    if (path.includes('/categories')) return 'Store Categories & Taxonomies';
    if (path.includes('/orders')) return 'Order Lifecycle & Fulfillment';
    if (path.includes('/payments')) return 'Financial Transactions Ledger';
    if (path.includes('/payouts')) return 'Vendor Commissions & Payouts';
    if (path.includes('/returns')) return 'Return Requests & Dispute Resolution';
    if (path.includes('/shipping')) return 'Shipping Zones & Courier Logistics';
    if (path.includes('/coupons')) return 'Coupons & Promotional Codes';
    if (path.includes('/banners')) return 'Storefront Hero & Marketing Banners';
    if (path.includes('/reports')) return 'Enterprise Reports & CSV Analytics';
    if (path.includes('/notifications')) return 'Security & System Alerts';
    if (path.includes('/audit-logs')) return 'Administrative Audit Trail';
    if (path.includes('/settings')) return 'Global Platform Configuration';
    return 'Admin Management Console';
  };

  return (
    <div className="admin-app">
      <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="admin-main-wrapper">
        <AdminHeader
          onMenuToggle={() => setSidebarOpen(true)}
          title={getPageTitle(location.pathname)}
        />

        <main className="admin-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
