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
  Clock,
  Compass,
  Navigation
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
    addressLine: user?.deliveryAddress?.addressLine || '',
    city: user?.deliveryAddress?.city || user?.deliveryCity || 'Mumbai',
    state: user?.deliveryAddress?.state || 'Maharashtra',
    pincode: user?.deliveryAddress?.pincode || '',
    lat: user?.deliveryAddress?.lat || user?.currentLocation?.lat || '',
    lng: user?.deliveryAddress?.lng || user?.currentLocation?.lng || '',
    useGpsLocation: user?.useGpsLocation || false,
    driverAvailability: user?.driverAvailability || 'available',
    password: '',
  });

  const [loading, setLoading] = useState(false);
  const [gpsDetecting, setGpsDetecting] = useState(false);
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
          addressLine: res.user.deliveryAddress?.addressLine || '',
          city: res.user.deliveryAddress?.city || res.user.deliveryCity || 'Mumbai',
          state: res.user.deliveryAddress?.state || 'Maharashtra',
          pincode: res.user.deliveryAddress?.pincode || '',
          lat: res.user.deliveryAddress?.lat || res.user.currentLocation?.lat || '',
          lng: res.user.deliveryAddress?.lng || res.user.currentLocation?.lng || '',
          useGpsLocation: res.user.useGpsLocation || false,
          driverAvailability: res.user.driverAvailability || 'available',
        }));
      }
    }).catch(() => {});
  }, []);

  const handleDetectGps = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      return;
    }
    setGpsDetecting(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setForm((prev) => ({
          ...prev,
          lat: parseFloat(pos.coords.latitude.toFixed(6)),
          lng: parseFloat(pos.coords.longitude.toFixed(6)),
          useGpsLocation: true,
        }));
        setGpsDetecting(false);
      },
      (err) => {
        setGpsDetecting(false);
        alert(`Location permission denied or unavailable: ${err.message}`);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

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

          {/* Address & Dispatch Geolocation Section */}
          <div style={{ marginTop: '0.5rem', paddingTop: '1rem', borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
            <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#f8fafc', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: 6 }}>
              <MapPin size={16} color="#38bdf8" />
              <span>Registered Address & Dispatch Base</span>
            </h4>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
              <div style={{ gridColumn: 'span 2' }}>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#cbd5e1', marginBottom: 4 }}>
                  Full Street Address / Landmark
                </label>
                <input
                  type="text"
                  value={form.addressLine}
                  onChange={(e) => setForm({ ...form, addressLine: e.target.value })}
                  placeholder="e.g. Flat 302, Green Valley Apartments, Alkapuri"
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
                  City
                </label>
                <input
                  type="text"
                  value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                  placeholder="e.g. Vadodara / Mumbai"
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
                  State
                </label>
                <input
                  type="text"
                  value={form.state}
                  onChange={(e) => setForm({ ...form, state: e.target.value })}
                  placeholder="e.g. Gujarat / Maharashtra"
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
                  Pincode
                </label>
                <input
                  type="text"
                  value={form.pincode}
                  onChange={(e) => setForm({ ...form, pincode: e.target.value })}
                  placeholder="e.g. 390007 / 400001"
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
                  Availability Status
                </label>
                <select
                  value={form.driverAvailability}
                  onChange={(e) => setForm({ ...form, driverAvailability: e.target.value })}
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
                  <option value="available">🟢 Available for Orders</option>
                  <option value="busy">🟡 Busy (Do not assign new orders)</option>
                  <option value="offline">⚪ Offline (Not on shift)</option>
                </select>
              </div>
            </div>

            {/* Resolved GPS Coordinates & Consent */}
            <div style={{ background: '#0b1120', padding: '0.85rem', borderRadius: 10, marginBottom: '1rem', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 8 }}>
                <span style={{ fontSize: '0.82rem', color: '#94a3b8' }}>
                  GPS Coordinates: <strong>{form.lat ? `${form.lat}, ${form.lng}` : 'Auto-resolved from address on save'}</strong>
                </span>
                <button
                  type="button"
                  onClick={handleDetectGps}
                  disabled={gpsDetecting}
                  className="deliv-btn deliv-btn-secondary"
                  style={{ minHeight: 32, fontSize: '0.78rem', padding: '0 10px' }}
                >
                  <Compass size={14} className={gpsDetecting ? 'animate-spin' : ''} />
                  {gpsDetecting ? 'Detecting…' : 'Detect GPS Position'}
                </button>
              </div>

              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.8rem', color: '#cbd5e1', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={form.useGpsLocation}
                  onChange={(e) => setForm({ ...form, useGpsLocation: e.target.checked })}
                  style={{ accentColor: '#10b981', width: 16, height: 16 }}
                />
                <span>I consent to using live GPS coordinates instead of my static home address for automated order assignment.</span>
              </label>
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
