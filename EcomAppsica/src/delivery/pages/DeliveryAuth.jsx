import React, { useState, useContext, useEffect } from 'react';
import { useNavigate, useSearchParams, useLocation, Link } from 'react-router-dom';
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
  FileText,
  Clock,
  MapPin,
  RefreshCw,
  XCircle,
} from 'lucide-react';
import { AuthContext } from '../../context/AuthContextValue';
import { authService } from '../../services/authService';
import { deliveryService } from '../../services/deliveryService';
import { STORAGE_KEYS } from '../../utils/constants';

export default function DeliveryAuth() {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const statusParam = searchParams.get('status');
  const redirectTarget = searchParams.get('redirect') || '/delivery/dashboard';

  const { user, isAuthenticated, isDelivery, updateUser } = useContext(AuthContext);

  const [mode, setMode] = useState(
    location.pathname.includes('register') ? 'register' : 'login'
  );

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const messageParam = searchParams.get('message');
  const [pendingNotice, setPendingNotice] = useState(
    statusParam === 'pending'
      ? (messageParam || 'Your account has not been approved by the admin yet. Please wait for approval.')
      : ''
  );
  const [rejectionNotice, setRejectionNotice] = useState(
    statusParam === 'rejected'
      ? (messageParam || 'Your registration request has been rejected. Please contact the admin for more information.')
      : ''
  );
  const [success, setSuccess] = useState('');
  const [submittedData, setSubmittedData] = useState(null);

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

  // Only redirect if delivery partner is already authenticated AND approved by admin!
  useEffect(() => {
    if (isAuthenticated && (user?.role === 'admin' || (user?.role === 'delivery' && user?.deliveryStatus === 'approved'))) {
      navigate('/delivery/dashboard', { replace: true });
    }
  }, [isAuthenticated, user?.role, user?.deliveryStatus, navigate]);

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setPendingNotice('');
    setRejectionNotice('');
    setSuccess('');
    setLoading(true);

    try {
      const cleanEmail = String(loginForm.email).trim();
      const cleanPassword = String(loginForm.password).trim();
      const res = await deliveryService.login(cleanEmail, cleanPassword);
      if (res?.token && res?.user) {
        if (res.user.role === 'delivery' && res.user.deliveryStatus !== 'approved') {
          authService.logout();
          updateUser(null);
          setPendingNotice('Your account has not been approved by the admin yet. Please wait for approval.');
          return;
        }
        localStorage.setItem(STORAGE_KEYS.TOKEN, res.token);
        localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(res.user));
        updateUser(res.user);
        navigate(redirectTarget);
      }
    } catch (err) {
      const data = err?.response?.data || err;
      if (data?.pendingApproval || data?.deliveryStatus === 'pending') {
        setPendingNotice(
          data.message || 'Your account has not been approved by the admin yet. Please wait for approval.'
        );
      } else if (data?.rejected || data?.deliveryStatus === 'rejected') {
        setRejectionNotice(
          data.message || 'Your registration request has been rejected. Please contact the admin for more information.'
        );
      } else {
        setError(data?.message || err?.message || 'Login failed. Please check your credentials.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setPendingNotice('');
    setRejectionNotice('');
    setSuccess('');
    setLoading(true);

    try {
      // Clear any prior customer or unapproved delivery session before new registration
      authService.logout();
      updateUser(null);

      const res = await deliveryService.register(regForm);

      // Save application details for confirmation card
      setSubmittedData({
        name: regForm.name,
        email: regForm.email.trim(),
        phone: regForm.phone.trim(),
        vehicleType: regForm.vehicleType,
        vehicleNumber: regForm.vehicleNumber.trim().toUpperCase(),
        drivingLicenseNumber: regForm.drivingLicenseNumber.trim().toUpperCase(),
        deliveryCity: regForm.deliveryCity,
      });

      // Retain the registered email in loginForm for seamless first sign-in
      setLoginForm((prev) => ({ ...prev, email: regForm.email.trim() }));

      // Clear password from state
      setRegForm((prev) => ({ ...prev, password: '' }));

      // Switch to submitted review mode
      setMode('submitted');
      setSuccess(
        res?.message ||
          'Your registration request has been submitted successfully. Please wait for admin approval.'
      );
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setLoginForm({ email: 'delivery@appsica.com', password: 'delivery123' });
    setError('');
    setPendingNotice('');
    setRejectionNotice('');
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
      const data = err?.response?.data;
      if (data?.pendingApproval) {
        setPendingNotice(data.message || 'Your Delivery Partner application is awaiting Admin approval.');
      } else {
        setError(data?.message || 'Demo login failed');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResubmitFromRejection = () => {
    setRegForm((prev) => ({
      ...prev,
      email: loginForm.email || prev.email,
    }));
    setMode('register');
    setRejectionNotice('');
    setError('');
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#f8f9f6',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem 1rem',
        color: '#000000',
        fontFamily: "'Inter', sans-serif",
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: mode === 'register' ? 560 : mode === 'submitted' ? 560 : 480,
          background: '#ffffff',
          border: '1px solid #eaede7',
          borderRadius: 20,
          padding: '2.25rem',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.05)',
          transition: 'all 0.3s ease',
        }}
      >
        {/* ========================================== */}
        {/* VIEW 1: SUBMITTED / PENDING APPLICATION CARD */}
        {/* ========================================== */}
        {mode === 'submitted' && submittedData ? (
          <div>
            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
              <div
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  background: 'rgba(6, 59, 44, 0.1)',
                  border: '1px solid rgba(6, 59, 44, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 1rem',
                  color: '#063b2c',
                }}
              >
                <Clock size={32} />
              </div>
              <span
                style={{
                  display: 'inline-block',
                  background: 'rgba(6, 59, 44, 0.1)',
                  border: '1px solid rgba(6, 59, 44, 0.25)',
                  color: '#063b2c',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  padding: '4px 12px',
                  borderRadius: '20px',
                  marginBottom: '0.75rem',
                }}
              >
                Pending Admin Approval
              </span>
              <h2 style={{ fontSize: '1.45rem', fontWeight: 800, margin: '0 0 0.5rem', color: '#063b2c' }}>
                Application Under Review
              </h2>
              <p style={{ color: '#000000', fontSize: '0.88rem', margin: 0, lineHeight: 1.6 }}>
                <strong>Your registration request has been submitted successfully. Please wait for admin approval.</strong> Our operations team
                verifies driver identity, vehicle details, and license credentials before activating accounts.
              </p>
            </div>

            {/* Applicant Summary */}
            <div
              style={{
                background: '#f8f9f6',
                border: '1px solid #eaede7',
                borderRadius: '12px',
                padding: '1rem',
                margin: '1.25rem 0',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: '0.75rem',
                fontSize: '0.82rem',
              }}
            >
              <div>
                <span style={{ color: '#000000', display: 'block', fontSize: '0.72rem', textTransform: 'uppercase', fontWeight: 700 }}>
                  Rider Name
                </span>
                <strong style={{ color: '#063b2c' }}>{submittedData.name}</strong>
              </div>

              <div>
                <span style={{ color: '#000000', display: 'block', fontSize: '0.72rem', textTransform: 'uppercase', fontWeight: 700 }}>
                  Email
                </span>
                <span style={{ color: '#000000' }}>{submittedData.email}</span>
              </div>

              <div>
                <span style={{ color: '#000000', display: 'block', fontSize: '0.72rem', textTransform: 'uppercase', fontWeight: 700 }}>
                  Phone
                </span>
                <span style={{ color: '#000000' }}>{submittedData.phone}</span>
              </div>

              <div>
                <span style={{ color: '#000000', display: 'block', fontSize: '0.72rem', textTransform: 'uppercase', fontWeight: 700 }}>
                  Vehicle
                </span>
                <span style={{ color: '#063b2c', fontWeight: 700, textTransform: 'capitalize' }}>
                  {submittedData.vehicleType} ({submittedData.vehicleNumber})
                </span>
              </div>

              <div>
                <span style={{ color: '#000000', display: 'block', fontSize: '0.72rem', textTransform: 'uppercase', fontWeight: 700 }}>
                  Driving License
                </span>
                <span style={{ color: '#000000', fontWeight: 600 }}>{submittedData.drivingLicenseNumber}</span>
              </div>

              <div>
                <span style={{ color: '#000000', display: 'block', fontSize: '0.72rem', textTransform: 'uppercase', fontWeight: 700 }}>
                  Operating City
                </span>
                <span style={{ color: '#000000' }}>{submittedData.deliveryCity}</span>
              </div>
            </div>

            <div
              style={{
                background: 'rgba(6, 59, 44, 0.06)',
                border: '1px solid rgba(6, 59, 44, 0.2)',
                borderRadius: '10px',
                padding: '0.85rem 1rem',
                fontSize: '0.82rem',
                color: '#000000',
                marginBottom: '1.5rem',
                lineHeight: 1.5,
              }}
            >
              ℹ️ <strong>What happens next?</strong> Once our administration verifies your details and clicks
              Approve in the Admin Dashboard, you can sign in with your email and password to access the Delivery
              Dashboard and receive delivery assignments.
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <button
                type="button"
                onClick={() => {
                  if (submittedData?.email) {
                    setLoginForm((prev) => ({ ...prev, email: submittedData.email }));
                  }
                  setMode('login');
                  setSubmittedData(null);
                  setError('');
                }}
                className="deliv-btn deliv-btn-primary deliv-btn-full"
                style={{ background: '#063b2c' }}
              >
                Go to Rider Sign In <ArrowRight size={16} />
              </button>
              <Link
                to="/"
                style={{
                  color: '#000000',
                  fontSize: '0.82rem',
                  textAlign: 'center',
                  textDecoration: 'none',
                  padding: '6px',
                  fontWeight: 600,
                }}
              >
                Back to Customer Store
              </Link>
            </div>
          </div>
        ) : (
          /* ========================================== */
          /* VIEW 2: LOGIN OR REGISTRATION FORM */
          /* ========================================== */
          <>
            {/* Header */}
            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
              <div
                style={{
                  width: 56,
                  height: 56,
                  background: 'linear-gradient(135deg, #063b2c 0%, #0b5e48 100%)',
                  borderRadius: 16,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 1rem',
                  color: 'white',
                  boxShadow: '0 8px 16px rgba(6, 59, 44, 0.25)',
                }}
              >
                <Bike size={28} />
              </div>
              <h1 style={{ fontSize: '1.6rem', fontWeight: 800, margin: '0 0 0.25rem', color: '#063b2c' }}>
                StunnerYsl Delivery Fleet
              </h1>
              <p style={{ fontSize: '0.88rem', color: '#000000', margin: 0, fontWeight: 500 }}>
                {mode === 'login'
                  ? 'Sign in to access your assigned deliveries and earnings'
                  : 'Register your vehicle to start delivering'}
              </p>
            </div>

            {/* Demo Quick-Login Banner */}
            {mode === 'login' && (
              <div
                style={{
                  background: '#f0fdf4',
                  border: '1px solid #bbf7d0',
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
                  <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#063b2c' }}>Demo Rider Account</div>
                  <div style={{ fontSize: '0.75rem', color: '#000000', fontWeight: 600 }}>delivery@stunnerysl.com / delivery123</div>
                </div>
                <button
                  onClick={handleDemoLogin}
                  disabled={loading}
                  className="deliv-btn deliv-btn-success"
                  style={{ minHeight: 34, padding: '4px 12px', fontSize: '0.8rem', background: '#063b2c', color: '#ffffff' }}
                >
                  1-Click Sign In
                </button>
              </div>
            )}

            {/* Tab Switcher */}
            <div
              style={{
                display: 'flex',
                background: '#f1f5f9',
                padding: 4,
                borderRadius: 12,
                marginBottom: '1.5rem',
                border: '1px solid #eaede7',
              }}
            >
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setError('');
                  setPendingNotice('');
                  setRejectionNotice('');
                }}
                style={{
                  flex: 1,
                  padding: '0.6rem',
                  borderRadius: 8,
                  border: 'none',
                  background: mode === 'login' ? '#063b2c' : 'transparent',
                  color: mode === 'login' ? '#ffffff' : '#000000',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                Rider Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('register');
                  setError('');
                  setPendingNotice('');
                  setRejectionNotice('');
                }}
                style={{
                  flex: 1,
                  padding: '0.6rem',
                  borderRadius: 8,
                  border: 'none',
                  background: mode === 'register' ? '#063b2c' : 'transparent',
                  color: mode === 'register' ? '#ffffff' : '#000000',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                Join Fleet (Register)
              </button>
            </div>

            {/* PENDING APPROVAL ALERT BANNER */}
            {pendingNotice && (
              <div
                style={{
                  background: 'rgba(245, 158, 11, 0.15)',
                  border: '1px solid rgba(245, 158, 11, 0.35)',
                  borderRadius: 10,
                  padding: '0.85rem 1rem',
                  marginBottom: '1.25rem',
                  color: '#fbbf24',
                  fontSize: '0.85rem',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.65rem',
                  lineHeight: 1.5,
                }}
              >
                <Clock size={18} style={{ flexShrink: 0, marginTop: 2 }} />
                <div>
                  <strong style={{ display: 'block', marginBottom: 2 }}>
                    Your Delivery Partner application is awaiting Admin approval.
                  </strong>
                  <span>{pendingNotice}</span>
                </div>
              </div>
            )}

            {/* REJECTION ALERT BANNER */}
            {rejectionNotice && (
              <div
                style={{
                  background: 'rgba(239, 68, 68, 0.15)',
                  border: '1px solid rgba(239, 68, 68, 0.35)',
                  borderRadius: 10,
                  padding: '0.85rem 1rem',
                  marginBottom: '1.25rem',
                  color: '#fca5a5',
                  fontSize: '0.85rem',
                  lineHeight: 1.5,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.65rem', marginBottom: 8 }}>
                  <XCircle size={18} style={{ flexShrink: 0, marginTop: 2, color: '#ef4444' }} />
                  <div>
                    <strong style={{ display: 'block', color: '#f87171' }}>
                      Delivery Partner Application Rejected
                    </strong>
                    <span>{rejectionNotice}</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleResubmitFromRejection}
                  style={{
                    background: 'rgba(239, 68, 68, 0.25)',
                    border: '1px solid rgba(239, 68, 68, 0.4)',
                    color: '#fee2e2',
                    padding: '6px 12px',
                    borderRadius: 6,
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  Edit Details & Resubmit Application →
                </button>
              </div>
            )}

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
            {mode === 'login' ? (
              <form onSubmit={handleLoginSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '0.82rem',
                      fontWeight: 700,
                      color: '#000000',
                      marginBottom: 6,
                    }}
                  >
                    Email Address or Registered Mobile Number
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Mail size={18} style={{ position: 'absolute', left: 12, top: 14, color: '#063b2c' }} />
                    <input
                      type="text"
                      required
                      value={loginForm.email}
                      onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                      placeholder="rider@appsica.com or 9876543210"
                      autoComplete="username"
                      style={{
                        width: '100%',
                        padding: '0.75rem 1rem 0.75rem 2.5rem',
                        background: '#ffffff',
                        border: '1px solid #eaede7',
                        borderRadius: 10,
                        color: '#000000',
                        fontSize: '0.9rem',
                        outline: 'none',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '0.82rem',
                      fontWeight: 700,
                      color: '#000000',
                      marginBottom: 6,
                    }}
                  >
                    Password
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Lock size={18} style={{ position: 'absolute', left: 12, top: 14, color: '#063b2c' }} />
                    <input
                      type="password"
                      required
                      value={loginForm.password}
                      onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                      placeholder="••••••••"
                      style={{
                        width: '100%',
                        padding: '0.75rem 1rem 0.75rem 2.5rem',
                        background: '#ffffff',
                        border: '1px solid #eaede7',
                        borderRadius: 10,
                        color: '#000000',
                        fontSize: '0.9rem',
                        outline: 'none',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="deliv-btn deliv-btn-primary deliv-btn-full"
                  style={{ marginTop: '0.5rem', background: '#063b2c', color: '#ffffff', fontWeight: 700 }}
                >
                  {loading ? 'Authenticating…' : 'Sign In as Delivery Partner'}
                  <ArrowRight size={16} />
                </button>
              </form>
            ) : (
              /* REGISTRATION FORM */
              <form onSubmit={handleRegisterSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
                <div
                  style={{
                    background: 'rgba(6, 59, 44, 0.08)',
                    border: '1px solid rgba(6, 59, 44, 0.25)',
                    borderRadius: 8,
                    padding: '0.65rem 0.85rem',
                    color: '#063b2c',
                    fontSize: '0.8rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                  }}
                >
                  <Clock size={16} style={{ flexShrink: 0 }} />
                  <span>
                    <strong>Verification Required:</strong> Your application will be sent to the Admin Dashboard for approval.
                  </span>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#000000', marginBottom: 4 }}>
                    Full Legal Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={regForm.name}
                    onChange={(e) => setRegForm({ ...regForm, name: e.target.value })}
                    placeholder="Enter your full name"
                    style={{
                      width: '100%',
                      padding: '0.65rem 0.85rem',
                      background: '#ffffff',
                      border: '1px solid #eaede7',
                      borderRadius: 10,
                      color: '#000000',
                      fontSize: '0.88rem',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#000000', marginBottom: 4 }}>
                      Email Address *
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
                        background: '#ffffff',
                        border: '1px solid #eaede7',
                        borderRadius: 10,
                        color: '#000000',
                        fontSize: '0.88rem',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#000000', marginBottom: 4 }}>
                      Mobile Phone Number *
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
                        background: '#ffffff',
                        border: '1px solid #eaede7',
                        borderRadius: 10,
                        color: '#000000',
                        fontSize: '0.88rem',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#000000', marginBottom: 4 }}>
                    Password (min 6 characters) *
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
                      background: '#ffffff',
                      border: '1px solid #eaede7',
                      borderRadius: 10,
                      color: '#000000',
                      fontSize: '0.88rem',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>

                {/* Vehicle Details */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#000000', marginBottom: 4 }}>
                      Vehicle Type *
                    </label>
                    <select
                      value={regForm.vehicleType}
                      onChange={(e) => setRegForm({ ...regForm, vehicleType: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '0.65rem 0.85rem',
                        background: '#ffffff',
                        border: '1px solid #eaede7',
                        borderRadius: 10,
                        color: '#000000',
                        fontSize: '0.88rem',
                        boxSizing: 'border-box',
                      }}
                    >
                      <option value="bike">Motorcycle / Bike</option>
                      <option value="scooter">Scooter</option>
                      <option value="ev">Electric Vehicle (EV)</option>
                      <option value="van">Delivery Van</option>
                      <option value="car">Car</option>
                      <option value="bicycle">Bicycle</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#000000', marginBottom: 4 }}>
                      Vehicle Reg Number *
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
                        background: '#ffffff',
                        border: '1px solid #eaede7',
                        borderRadius: 10,
                        color: '#000000',
                        fontSize: '0.88rem',
                        textTransform: 'uppercase',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#000000', marginBottom: 4 }}>
                      Driving License No *
                    </label>
                    <input
                      type="text"
                      required
                      value={regForm.drivingLicenseNumber}
                      onChange={(e) => setRegForm({ ...regForm, drivingLicenseNumber: e.target.value })}
                      placeholder="DL-1420110012345"
                      style={{
                        width: '100%',
                        padding: '0.65rem 0.85rem',
                        background: '#ffffff',
                        border: '1px solid #eaede7',
                        borderRadius: 10,
                        color: '#000000',
                        fontSize: '0.88rem',
                        textTransform: 'uppercase',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#000000', marginBottom: 4 }}>
                      Operating City *
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
                        background: '#ffffff',
                        border: '1px solid #eaede7',
                        borderRadius: 10,
                        color: '#000000',
                        fontSize: '0.88rem',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#000000', marginBottom: 4 }}>
                    Emergency Contact (Optional)
                  </label>
                  <input
                    type="tel"
                    value={regForm.emergencyContact}
                    onChange={(e) => setRegForm({ ...regForm, emergencyContact: e.target.value })}
                    placeholder="e.g. 9812345678"
                    style={{
                      width: '100%',
                      padding: '0.65rem 0.85rem',
                      background: '#ffffff',
                      border: '1px solid #eaede7',
                      borderRadius: 10,
                      color: '#000000',
                      fontSize: '0.88rem',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="deliv-btn deliv-btn-success deliv-btn-full"
                  style={{ marginTop: '0.5rem', background: '#063b2c', color: '#ffffff', fontWeight: 700 }}
                >
                  {loading ? 'Submitting Application…' : 'Submit Delivery Partner Application'}
                  <ArrowRight size={16} />
                </button>
              </form>
            )}

            <div
              style={{
                marginTop: '1.5rem',
                textAlign: 'center',
                borderTop: '1px solid #eaede7',
                paddingTop: '1rem',
              }}
            >
              <Link to="/" style={{ color: '#000000', fontSize: '0.85rem', textDecoration: 'none', fontWeight: 600 }}>
                ← Back to Customer Store
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
