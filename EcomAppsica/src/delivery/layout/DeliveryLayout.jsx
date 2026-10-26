import React, { useState, useContext } from 'react';
import { Outlet, useLocation, Link } from 'react-router-dom';
import { AlertCircle, Clock } from 'lucide-react';
import { AuthContext } from '../../context/AuthContextValue';
import DeliverySidebar from './DeliverySidebar';
import DeliveryHeader from './DeliveryHeader';
import DeliveryBottomNav from './DeliveryBottomNav';
import './DeliveryLayout.css';

export default function DeliveryLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const { user } = useContext(AuthContext);

  const getPageTitle = (path) => {
    if (path.includes('/dashboard')) return 'Rider Command Center';
    if (path.includes('/assigned')) return 'Assigned Deliveries';
    if (path.includes('/pickups')) return 'Vendor Pickup Hubs';
    if (path.includes('/active')) return 'Active Deliveries';
    if (path.includes('/history')) return 'Delivery History';
    if (path.includes('/earnings')) return 'Earnings & Settlements';
    if (path.includes('/notifications')) return 'Rider Notifications';
    if (path.includes('/profile')) return 'Rider Profile & Vehicle';
    return 'Delivery Partner Panel';
  };

  const isPendingApproval = user?.deliveryStatus === 'pending';
  const isSuspended = user?.deliveryStatus === 'suspended';

  return (
    <div className="delivery-app">
      <DeliverySidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="delivery-main-wrapper">
        <DeliveryHeader
          onMenuToggle={() => setSidebarOpen(true)}
          title={getPageTitle(location.pathname)}
        />

        {/* Account Approval / Suspension Alert Banner */}
        {isPendingApproval && (
          <div
            style={{
              background: 'rgba(245, 158, 11, 0.15)',
              borderBottom: '1px solid rgba(245, 158, 11, 0.3)',
              padding: '0.75rem 1.5rem',
              color: '#fbbf24',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              fontSize: '0.88rem',
            }}
          >
            <Clock size={18} style={{ flexShrink: 0 }} />
            <span>
              <strong>Application Under Review:</strong> Your delivery partner documents are pending administrator verification. You will be able to accept parcel assignments once approved.
            </span>
          </div>
        )}

        {isSuspended && (
          <div
            style={{
              background: 'rgba(239, 68, 68, 0.15)',
              borderBottom: '1px solid rgba(239, 68, 68, 0.3)',
              padding: '0.75rem 1.5rem',
              color: '#f87171',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              fontSize: '0.88rem',
            }}
          >
            <AlertCircle size={18} style={{ flexShrink: 0 }} />
            <span>
              <strong>Account Suspended:</strong> Your delivery account is currently inactive. Please contact support at support@appsica.com.
            </span>
          </div>
        )}

        <main className="delivery-content">
          <Outlet />
        </main>

        <DeliveryBottomNav />
      </div>
    </div>
  );
}
