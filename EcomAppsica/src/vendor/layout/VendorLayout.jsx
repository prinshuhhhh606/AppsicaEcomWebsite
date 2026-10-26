import React, { useState, useContext } from 'react';
import { Outlet } from 'react-router-dom';
import VendorSidebar from './VendorSidebar';
import VendorHeader from './VendorHeader';
import { AuthContext } from '../../context/AuthContextValue';
import { AlertCircle, Clock } from 'lucide-react';
import './VendorLayout.css';

export default function VendorLayout({ title = 'Seller Central' }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user } = useContext(AuthContext);

  const isPending = user?.vendorStatus === 'pending';

  return (
    <div className="vendor-app">
      <VendorSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="vendor-main-wrapper">
        <VendorHeader onMenuToggle={() => setSidebarOpen(true)} title={title} />

        <main className="vendor-content">
          {/* Informative notice if vendor account is still pending admin approval */}
          {isPending && (
            <div className="vendor-pending-banner">
              <Clock size={24} className="vendor-pending-banner-icon" />
              <div className="vendor-pending-banner-content">
                <h4>Vendor Store Awaiting Administrator Approval</h4>
                <p>
                  Welcome to Appsica Seller Central! Your seller registration is currently under review by our administration team.
                  You can set up your store profile, configure payout details, and draft products. Once approved, your products will automatically go live on the marketplace.
                </p>
              </div>
            </div>
          )}

          {/* Alert if vendor account was rejected by admin */}
          {user?.vendorStatus === 'rejected' && (
            <div className="vendor-pending-banner" style={{ background: 'rgba(239, 68, 68, 0.15)', borderColor: 'rgba(239, 68, 68, 0.35)', color: '#f87171' }}>
              <AlertCircle size={24} className="vendor-pending-banner-icon" style={{ color: '#ef4444' }} />
              <div className="vendor-pending-banner-content">
                <h4 style={{ color: '#fca5a5' }}>Vendor Store Application Rejected</h4>
                <p style={{ color: '#fca5a5' }}>
                  {user?.vendorRejectionReason
                    ? `Reason: "${user.vendorRejectionReason}"`
                    : 'Your seller store documentation did not meet platform verification guidelines. Please contact support at support@appsica.com for assistance.'}
                </p>
              </div>
            </div>
          )}

          <Outlet />
        </main>
      </div>
    </div>
  );
}
