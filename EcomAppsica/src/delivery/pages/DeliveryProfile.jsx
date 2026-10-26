import React, { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User,
  Bike,
  ShieldCheck,
  Phone,
  Mail,
  MapPin,
  Lock,
  LogOut,
  CheckCircle,
  AlertCircle,
  HelpCircle,
  Clock
} from 'lucide-react';
import { AuthContext } from '../../context/AuthContextValue';
import { deliveryService } from '../../services/deliveryService';

export default function DeliveryProfile() {
  const { user, logout, updateUser } = useContext(AuthContext);
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    vehicleType: user?.vehicleType || 'bike',
    vehicleNumber: user?.vehicleNumber || '',
    drivingLicenseNumber: user?.drivingLicenseNumber || '',
    emergencyContact: user?.emergencyContact || '',
    deliveryCity: user?.deliveryCity || 'Mumbai',
    password: '',
  });

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    deliveryService.getProfile().then((res) => {
      if (res?.success && res.user) {
        setForm((prev) => ({
          ...prev,
          name: res.user.name || '',
          phone: res.user.phone || '',
          vehicleType: res.user.vehicleType || 'bike',
          vehicleNumber: res.user.vehicleNumber || '',
          drivingLicenseNumber: res.user.drivingLicenseNumber || '',
          emergencyContact: res.user.emergencyContact || '',
          deliveryCity: res.user.deliveryCity || 'Mumbai',
        }));
      }
    }).catch(() => {});
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const res = await deliveryService.updateProfile(form);
      if (res?.success) {
        setSuccess('Profile updated successfully!');
        updateUser(res.user);
        setForm((prev) => ({ ...prev, password: '' }));
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/delivery/login');
  };

  const status = user?.deliveryStatus || 'pending';

  return (
    <div style={{ maxWidth: 800, margin: '0 auto' }}>
      {/* Rider Header Card */}
      <div
        className="deliv-card"
        style={{
          background: 'linear-gradient(135deg, #182234 0%, #0f172a 100%)',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1.25rem',
          padding: '1.75rem',
          marginBottom: '1.5rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div
            style={{
              width: 64,
              height: 64,
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              borderRadius: 20,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: '1.8rem',
              fontWeight: 800,
            }}
          >
            {user?.name?.charAt(0).toUpperCase() || 'R'}
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: 2 }}>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0, color: '#f8fafc' }}>
                {user?.name || 'Appsica Rider'}
              </h2>
              {status === 'approved' ? (
                <span
                  style={{
                    background: 'rgba(16, 185, 129, 0.15)',
                    color: '#34d399',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                    padding: '2px 8px',
                    borderRadius: 999,
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                  }}
                >
                  <ShieldCheck size={13} /> Verified Rider
                </span>
              ) : (
                <span
                  style={{
                    background: 'rgba(245, 158, 11, 0.15)',
                    color: '#fbbf24',
                    border: '1px solid rgba(245, 158, 11, 0.3)',
                    padding: '2px 8px',
                    borderRadius: 999,
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                  }}
                >
                  <Clock size={13} /> Pending Verification
                </span>
              )}
            </div>

            <div style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
              {user?.email} • ID: {user?._id?.substring(18).toUpperCase() || 'RIDER-42'}
            </div>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="deliv-btn deliv-btn-danger"
          style={{ minHeight: 38 }}
        >
          <LogOut size={16} /> Sign Out
        </button>
      </div>

      {error && (
        <div style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 10, padding: '0.85rem', marginBottom: '1rem', color: '#f87171' }}>
          {error}
        </div>
      )}

      {success && (
        <div style={{ background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 10, padding: '0.85rem', marginBottom: '1rem', color: '#34d399' }}>
          {success}
        </div>
      )}

      {/* Edit Profile Form */}
      <div className="deliv-card" style={{ marginBottom: '1.5rem' }}>
        <h3 className="deliv-card-title" style={{ marginBottom: '1.25rem' }}>
          <User size={18} color="#6366f1" />
          <span>Vehicle & Profile Information</span>
        </h3>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#cbd5e1', marginBottom: 4 }}>
                Rider Name
              </label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  background: '#0f172a',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: 10,
                  color: '#f8fafc',
                  fontSize: '0.9rem',
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#cbd5e1', marginBottom: 4 }}>
                Phone Number
              </label>
              <input
                type="tel"
                required
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  background: '#0f172a',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: 10,
                  color: '#f8fafc',
                  fontSize: '0.9rem',
                }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#cbd5e1', marginBottom: 4 }}>
                Vehicle Type
              </label>
              <select
                value={form.vehicleType}
                onChange={(e) => setForm({ ...form, vehicleType: e.target.value })}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  background: '#0f172a',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: 10,
                  color: '#f8fafc',
                  fontSize: '0.9rem',
                }}
              >
                <option value="bike">Motorcycle / Bike</option>
                <option value="scooter">Scooter (Activa / Jupiter)</option>
                <option value="electric">Electric 2-Wheeler (EV)</option>
                <option value="van">Delivery Van</option>
                <option value="bicycle">Bicycle</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#cbd5e1', marginBottom: 4 }}>
                Vehicle Registration Number
              </label>
              <input
                type="text"
                required
                value={form.vehicleNumber}
                onChange={(e) => setForm({ ...form, vehicleNumber: e.target.value })}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  background: '#0f172a',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: 10,
                  color: '#f8fafc',
                  fontSize: '0.9rem',
                  textTransform: 'uppercase',
                }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#cbd5e1', marginBottom: 4 }}>
                Driving License Number
              </label>
              <input
                type="text"
                value={form.drivingLicenseNumber}
                onChange={(e) => setForm({ ...form, drivingLicenseNumber: e.target.value })}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  background: '#0f172a',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: 10,
                  color: '#f8fafc',
                  fontSize: '0.9rem',
                  textTransform: 'uppercase',
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#cbd5e1', marginBottom: 4 }}>
                Emergency Contact Number
              </label>
              <input
                type="tel"
                value={form.emergencyContact}
                onChange={(e) => setForm({ ...form, emergencyContact: e.target.value })}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  background: '#0f172a',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: 10,
                  color: '#f8fafc',
                  fontSize: '0.9rem',
                }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#cbd5e1', marginBottom: 4 }}>
              Change Password (leave blank to keep current)
            </label>
            <input
              type="password"
              minLength={6}
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="Enter new password if changing"
              style={{
                width: '100%',
                padding: '0.75rem',
                background: '#0f172a',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: 10,
                color: '#f8fafc',
                fontSize: '0.9rem',
              }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="deliv-btn deliv-btn-primary"
            style={{ alignSelf: 'flex-start', minHeight: 42, padding: '0 24px' }}
          >
            {loading ? 'Saving Changes…' : 'Save Profile Changes'}
          </button>
        </form>
      </div>

      {/* Support & Helpline Card */}
      <div className="deliv-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <HelpCircle size={24} color="#38bdf8" />
          <div>
            <div style={{ fontWeight: 700, color: '#f8fafc' }}>Need Dispatch Assistance?</div>
            <div style={{ fontSize: '0.82rem', color: '#94a3b8' }}>Support line: +91 98765 43210 • Email: support@appsicaecom.com</div>
          </div>
        </div>
        <a
          href="tel:9876543210"
          className="deliv-btn deliv-btn-secondary"
          style={{ minHeight: 38, padding: '0 16px', fontSize: '0.85rem' }}
        >
          <Phone size={15} /> Call Fleet Support
        </a>
      </div>
    </div>
  );
}
