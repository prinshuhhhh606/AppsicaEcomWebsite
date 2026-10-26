import React, { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Package, MapPin, Heart, Shield, LogOut } from 'lucide-react';
import { AuthContext } from '../../context/AuthContextValue';
import PageHeading from '../../Components/common/PageHeading';

export default function Profile() {
  const { user, isAdmin, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  return (
    <div className="container store-page">
      <PageHeading eyebrow="YOUR APPSICA ACCOUNT" title="My Account Profile">
        Manage your profile, view orders, and track active deliveries.
      </PageHeading>

      <div className="profile-card">
        <div className="profile-avatar">{user?.name?.charAt(0)?.toUpperCase() || 'A'}</div>
        <div>
          <h2>{user?.name || 'Shopper'}</h2>
          <p>{user?.email}</p>
          {user?.phone && <small style={{ color: '#94a3b8' }}>Phone: {user.phone}</small>}
          {user?.role && (
            <div>
              <span className="badge badge-success" style={{ marginTop: '0.4rem', display: 'inline-block' }}>
                {user.role.toUpperCase()}
              </span>
            </div>
          )}
        </div>
        <button
          className="btn btn-secondary"
          onClick={() => {
            logout();
            navigate('/');
          }}
        >
          <LogOut size={15} style={{ verticalAlign: 'middle', marginRight: 4 }} /> Sign out
        </button>
      </div>

      {/* Prominent Quick Access Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem', margin: '2rem 0' }}>
        {/* My Orders Card */}
        <Link
          to="/my-orders"
          style={{
            background: 'linear-gradient(135deg, rgba(99,102,241,0.15), rgba(79,70,229,0.05))',
            border: '1px solid rgba(99,102,241,0.3)',
            borderRadius: 14,
            padding: '1.5rem',
            textDecoration: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            transition: 'all 0.2s',
          }}
          className="profile-feature-card"
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, background: '#6366f1', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Package size={24} />
            </div>
            <div>
              <h3 style={{ margin: 0, color: '#f8fafc', fontSize: '1.1rem' }}>My Orders</h3>
              <p style={{ margin: '0.2rem 0 0', color: '#94a3b8', fontSize: '0.85rem' }}>
                Check order history & live shipment tracking
              </p>
            </div>
          </div>
          <ArrowRight size={20} color="#818cf8" />
        </Link>

        {/* Saved Addresses Card */}
        <Link
          to="/account/addresses"
          style={{
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 14,
            padding: '1.5rem',
            textDecoration: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            transition: 'all 0.2s',
          }}
          className="profile-feature-card"
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(255,255,255,0.06)', color: '#94a3b8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <MapPin size={24} />
            </div>
            <div>
              <h3 style={{ margin: 0, color: '#f8fafc', fontSize: '1.1rem' }}>Saved Addresses</h3>
              <p style={{ margin: '0.2rem 0 0', color: '#94a3b8', fontSize: '0.85rem' }}>
                Manage shipping addresses
              </p>
            </div>
          </div>
          <ArrowRight size={20} color="#94a3b8" />
        </Link>
      </div>

      <div className="profile-links">
        <Link to="/my-orders">
          <Package size={17} style={{ verticalAlign: 'middle', marginRight: 8, color: '#818cf8' }} />
          View all order tracking <ArrowRight size={16} />
        </Link>
        <Link to="/wishlist">
          <Heart size={17} style={{ verticalAlign: 'middle', marginRight: 8, color: '#f43f5e' }} />
          Saved favourites & wishlist <ArrowRight size={16} />
        </Link>
        {isAdmin && (
          <Link to="/admin" style={{ color: '#818cf8', fontWeight: 600 }}>
            <Shield size={17} style={{ verticalAlign: 'middle', marginRight: 8 }} />
            Open Admin Control Panel <ArrowRight size={16} />
          </Link>
        )}
      </div>
    </div>
  );
}
