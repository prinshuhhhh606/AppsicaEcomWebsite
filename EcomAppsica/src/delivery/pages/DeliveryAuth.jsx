import React, { useState, useContext } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import {
  Bike,
  ShieldCheck,
  ArrowRight,
  Mail,
  Lock,
  Phone,
  User,
  Truck,
  AlertCircle,
  CheckCircle,
  FileText
} from 'lucide-react';
import { AuthContext } from '../../context/AuthContextValue';
import { deliveryService } from '../../services/deliveryService';
import { STORAGE_KEYS } from '../../utils/constants';

export default function DeliveryAuth() {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const { updateUser } = useContext(AuthContext);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectTarget = searchParams.get('redirect') || '/delivery/dashboard';

  // Login Form
  const [loginForm, setLoginForm] = useState({
    email: '',
    password: '',
  });

  // Register Form
  const [regForm, setRegForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    vehicleType: 'bike',
    vehicleNumber: '',
    drivingLicenseNumber: '',
    emergencyContact: '',
    deliveryCity: 'Mumbai',
  });

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await deliveryService.login(loginForm.email, loginForm.password);
      if (res?.token && res?.user) {
        localStorage.setItem(STORAGE_KEYS.TOKEN, res.token);
        localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(res.user));
        updateUser(res.user);
        navigate(redirectTarget);
      }
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const res = await deliveryService.register(regForm);
      if (res?.token && res?.user) {
        localStorage.setItem(STORAGE_KEYS.TOKEN, res.token);
        localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(res.user));
        updateUser(res.user);
        setSuccess('Registration submitted successfully! Redirecting to rider portal…');
        setTimeout(() => {
          navigate('/delivery/dashboard');
        }, 1200);
      }
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setLoginForm({ email: 'delivery@appsica.com', password: 'delivery123' });
    setError('');
    setLoading(true);
    try {
      const res = await deliveryService.login('delivery@appsica.com', 'delivery123');
      if (res?.token && res?.user) {
        localStorage.setItem(STORAGE_KEYS.TOKEN, res.token);
        localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(res.user));
        updateUser(res.user);
        navigate(redirectTarget);
      }
    } catch (err) {
      setError(err?.response?.data?.message || 'Demo login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #090d16 0%, #111827 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.5rem',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 480,
          background: '#182234',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: 20,
          padding: '2rem',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.6)',
        }}
      >
        {/* Logo and Header */}
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <div
            style={{
              width: 56,
              height: 56,
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              borderRadius: 16,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1rem',
              color: 'white',
              boxShadow: '0 8px 16px rgba(16, 185, 129, 0.3)',
            }}
          >
            <Bike size={28} />
          </div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800, margin: '0 0 0.25rem', color: '#f8fafc' }}>
            Appsica Delivery Fleet
          </h1>
          <p style={{ fontSize: '0.88rem', color: '#94a3b8', margin: 0 }}>
            {isLogin ? 'Sign in to access your assigned deliveries and earnings' : 'Register your vehicle to start delivering'}
          </p>
        </div>

        {/* Demo Quick-Login Banner */}
        {isLogin && (
          <div
            style={{
              background: 'rgba(16, 185, 129, 0.1)',
              border: '1px solid rgba(16, 185, 129, 0.25)',
              borderRadius: 12,
              padding: '0.75rem 1rem',
              marginBottom: '1.25rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '0.5rem',
            }}
          >
            <div>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#34d399' }}>Demo Rider Account</div>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>delivery@appsica.com / delivery123</div>
            </div>
            <button
              onClick={handleDemoLogin}
              disabled={loading}
              className="deliv-btn deliv-btn-success"
              style={{ minHeight: 34, padding: '4px 12px', fontSize: '0.8rem' }}
            >
              1-Click Sign In
            </button>
          </div>
        )}

        {/* Tab Switcher */}
        <div
          style={{
            display: 'flex',
            background: 'rgba(0, 0, 0, 0.25)',
            padding: 4,
            borderRadius: 12,
            marginBottom: '1.5rem',
          }}
        >
          <button
            onClick={() => { setIsLogin(true); setError(''); }}
            style={{
              flex: 1,
              padding: '0.6rem',
              borderRadius: 8,
              border: 'none',
              background: isLogin ? '#6366f1' : 'transparent',
              color: isLogin ? 'white' : '#94a3b8',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            Rider Sign In
          </button>
          <button
            onClick={() => { setIsLogin(false); setError(''); }}
            style={{
              flex: 1,
              padding: '0.6rem',
              borderRadius: 8,
              border: 'none',
              background: !isLogin ? '#6366f1' : 'transparent',
              color: !isLogin ? 'white' : '#94a3b8',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            Join Fleet
          </button>
        </div>

        {error && (
          <div
            style={{
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: 10,
              padding: '0.75rem 1rem',
              marginBottom: '1rem',
              color: '#f87171',
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div
            style={{
              background: 'rgba(16, 185, 129, 0.15)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              borderRadius: 10,
              padding: '0.75rem 1rem',
              marginBottom: '1rem',
              color: '#34d399',
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            <CheckCircle size={16} />
            <span>{success}</span>
          </div>
        )}

        {/* LOGIN FORM */}
        {isLogin ? (
          <form onSubmit={handleLoginSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#cbd5e1', marginBottom: 6 }}>
                Email Address
              </label>
              <div style={{ position: 'relative' }}>
                <Mail size={18} style={{ position: 'absolute', left: 12, top: 14, color: '#64748b' }} />
                <input
                  type="email"
                  required
                  value={loginForm.email}
                  onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                  placeholder="rider@example.com"
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem 0.75rem 2.5rem',
                    background: '#0f172a',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: 10,
                    color: '#f8fafc',
                    fontSize: '0.9rem',
                    outline: 'none',
                  }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#cbd5e1', marginBottom: 6 }}>
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <Lock size={18} style={{ position: 'absolute', left: 12, top: 14, color: '#64748b' }} />
                <input
                  type="password"
                  required
                  value={loginForm.password}
                  onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                  placeholder="••••••••"
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem 0.75rem 2.5rem',
                    background: '#0f172a',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: 10,
                    color: '#f8fafc',
                    fontSize: '0.9rem',
                    outline: 'none',
                  }}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="deliv-btn deliv-btn-primary deliv-btn-full"
              style={{ marginTop: '0.5rem' }}
            >
              {loading ? 'Authenticating…' : 'Sign In as Delivery Partner'}
              <ArrowRight size={16} />
            </button>
          </form>
        ) : (
          /* REGISTRATION FORM */
          <form onSubmit={handleRegisterSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#cbd5e1', marginBottom: 4 }}>
                Full Name
              </label>
              <input
                type="text"
                required
                value={regForm.name}
                onChange={(e) => setRegForm({ ...regForm, name: e.target.value })}
                placeholder="Vikram Sharma"
                style={{
                  width: '100%',
                  padding: '0.65rem 0.85rem',
                  background: '#0f172a',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: 10,
                  color: '#f8fafc',
                  fontSize: '0.88rem',
                }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#cbd5e1', marginBottom: 4 }}>
                  Email
                </label>
                <input
                  type="email"
                  required
                  value={regForm.email}
                  onChange={(e) => setRegForm({ ...regForm, email: e.target.value })}
                  placeholder="rider@appsica.com"
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem',
                    background: '#0f172a',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: 10,
                    color: '#f8fafc',
                    fontSize: '0.88rem',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#cbd5e1', marginBottom: 4 }}>
                  Phone Number
                </label>
                <input
                  type="tel"
                  required
                  value={regForm.phone}
                  onChange={(e) => setRegForm({ ...regForm, phone: e.target.value })}
                  placeholder="9876543210"
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem',
                    background: '#0f172a',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: 10,
                    color: '#f8fafc',
                    fontSize: '0.88rem',
                  }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#cbd5e1', marginBottom: 4 }}>
                Password (min 6 characters)
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={regForm.password}
                onChange={(e) => setRegForm({ ...regForm, password: e.target.value })}
                placeholder="••••••••"
                style={{
                  width: '100%',
                  padding: '0.65rem 0.85rem',
                  background: '#0f172a',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: 10,
                  color: '#f8fafc',
                  fontSize: '0.88rem',
                }}
              />
            </div>

            {/* Vehicle Details */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#cbd5e1', marginBottom: 4 }}>
                  Vehicle Type
                </label>
                <select
                  value={regForm.vehicleType}
                  onChange={(e) => setRegForm({ ...regForm, vehicleType: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem',
                    background: '#0f172a',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: 10,
                    color: '#f8fafc',
                    fontSize: '0.88rem',
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
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#cbd5e1', marginBottom: 4 }}>
                  Vehicle Reg Number
                </label>
                <input
                  type="text"
                  required
                  value={regForm.vehicleNumber}
                  onChange={(e) => setRegForm({ ...regForm, vehicleNumber: e.target.value })}
                  placeholder="MH-02-AB-1234"
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem',
                    background: '#0f172a',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: 10,
                    color: '#f8fafc',
                    fontSize: '0.88rem',
                    textTransform: 'uppercase',
                  }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#cbd5e1', marginBottom: 4 }}>
                  Driving License No
                </label>
                <input
                  type="text"
                  required
                  value={regForm.drivingLicenseNumber}
                  onChange={(e) => setRegForm({ ...regForm, drivingLicenseNumber: e.target.value })}
                  placeholder="DL-9876543210"
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem',
                    background: '#0f172a',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: 10,
                    color: '#f8fafc',
                    fontSize: '0.88rem',
                    textTransform: 'uppercase',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#cbd5e1', marginBottom: 4 }}>
                  Service City
                </label>
                <input
                  type="text"
                  required
                  value={regForm.deliveryCity}
                  onChange={(e) => setRegForm({ ...regForm, deliveryCity: e.target.value })}
                  placeholder="Mumbai"
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem',
                    background: '#0f172a',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: 10,
                    color: '#f8fafc',
                    fontSize: '0.88rem',
                  }}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="deliv-btn deliv-btn-success deliv-btn-full"
              style={{ marginTop: '0.5rem' }}
            >
              {loading ? 'Submitting Application…' : 'Register as Delivery Partner'}
              <ArrowRight size={16} />
            </button>
          </form>
        )}

        <div style={{ marginTop: '1.5rem', textAlign: 'center', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '1rem' }}>
          <Link to="/" style={{ color: '#94a3b8', fontSize: '0.82rem', textDecoration: 'none' }}>
            ← Back to Customer Store
          </Link>
        </div>
      </div>
    </div>
  );
}
