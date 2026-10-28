import React, { useState, useContext, useEffect } from 'react';
import { useNavigate, useLocation, useSearchParams, Link } from 'react-router-dom';
import {
  Store,
  Mail,
  Lock,
  User,
  Phone,
  MapPin,
  FileText,
  ArrowRight,
  ShieldCheck,
  Clock,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  XCircle,
} from 'lucide-react';
import { AuthContext } from '../../context/AuthContextValue';
import { authService } from '../../services/authService';
import { vendorService } from '../../services/vendorService';
import { STORAGE_KEYS } from '../../utils/constants';

export default function VendorAuth() {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const statusParam = searchParams.get('status');
  const messageParam = searchParams.get('message');

  const { user, isAuthenticated, isVendor, updateUser } = useContext(AuthContext);

  const [mode, setMode] = useState(
    location.pathname.includes('register') ? 'register' : 'login'
  );

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [submittedData, setSubmittedData] = useState(null);

  // Form states
  const [loginForm, setLoginForm] = useState({
    email: '',
    password: '',
  });

  const [registerForm, setRegisterForm] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    storeName: '',
    storeDescription: '',
    businessAddress: '',
    taxId: '',
  });

  const pendingMessage =
    messageParam ||
    (statusParam === 'rejected'
      ? 'Your seller application was rejected by the admin. Please contact support or reapply.'
      : statusParam === 'suspended'
        ? 'Your seller account has been suspended by the admin. Please contact support.'
        : 'Your registration request has not been approved by the admin yet. Please wait for approval.');

  // Only redirect if seller is already authenticated AND approved by admin!
  useEffect(() => {
    if (isAuthenticated && isVendor && user?.vendorStatus === 'approved') {
      navigate('/vendor/dashboard', { replace: true });
    }
  }, [isAuthenticated, isVendor, user?.vendorStatus, navigate]);

  // Quick fill demo vendor credentials
  const fillDemo = (email, pass) => {
    setMode('login');
    setLoginForm({ email, password: pass });
    setError('');
    setSuccessMsg('');
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);

    try {
      const data = await vendorService.login(loginForm.email, loginForm.password);
      if (data?.token && data?.user) {
        if (data.user.role === 'vendor' && data.user.vendorStatus !== 'approved') {
          authService.logout();
          updateUser(null);
          setError('Your registration request has not been approved by the admin yet. Please wait for approval.');
          return;
        }
        localStorage.setItem(STORAGE_KEYS.TOKEN, data.token);
        localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(data.user));
        updateUser(data.user);
        navigate('/vendor/dashboard');
      }
    } catch (err) {
      const backendMessage =
        err?.response?.data?.message || err?.message || 'Login failed. Please check your credentials.';
      setError(backendMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);

    if (!registerForm.name || !registerForm.email || !registerForm.password || !registerForm.storeName) {
      setError('Please fill in all required fields (Name, Email, Password, Store Name)');
      setLoading(false);
      return;
    }

    try {
      // Clear any prior customer or unapproved vendor session before new registration
      authService.logout();
      updateUser(null);

      const data = await vendorService.register(registerForm);

      // Save application details for confirmation card
      setSubmittedData({
        storeName: registerForm.storeName,
        name: registerForm.name,
        email: registerForm.email,
        phone: registerForm.phone,
        businessAddress: registerForm.businessAddress,
        taxId: registerForm.taxId,
      });

      // Clear password from state
      setRegisterForm((prev) => ({ ...prev, password: '' }));

      const confirmationMessage =
        data?.message ||
        'Your seller registration request has been submitted. Your account will be activated after admin approval.';
      setSuccessMsg(confirmationMessage);

      // Transition to the dedicated pending review screen
      setMode('submitted');
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'radial-gradient(ellipse at top, #1e1b4b 0%, #090d16 65%, #05070c 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem 1rem',
        color: '#f8fafc',
        fontFamily: "'Inter', sans-serif",
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: mode === 'register' ? '680px' : mode === 'submitted' ? '560px' : '460px',
          background: 'rgba(15, 23, 42, 0.85)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(148, 163, 184, 0.15)',
          borderRadius: '20px',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.55), 0 0 40px rgba(99, 102, 241, 0.15)',
          padding: '2.25rem',
          transition: 'all 0.3s ease',
        }}
      >
        {/* Brand header */}
        <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
          <div
            style={{
              width: '56px',
              height: '56px',
              margin: '0 auto 1rem',
              borderRadius: '16px',
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              boxShadow: '0 8px 24px rgba(99, 102, 241, 0.4)',
            }}
          >
            <Store size={28} />
          </div>
          <h2 style={{ fontSize: '1.65rem', fontWeight: 800, margin: '0 0 0.35rem 0', letterSpacing: '-0.02em' }}>
            Appsica <span style={{ color: '#818cf8' }}>Seller Central</span>
          </h2>
          <p style={{ color: '#94a3b8', fontSize: '0.88rem', margin: 0 }}>
            {mode === 'login'
              ? 'Log in to manage your online store, products, and sales'
              : mode === 'register'
              ? 'Join thousands of trusted sellers on Appsica Marketplace'
              : 'Merchant onboarding verification & KYC'}
          </p>
        </div>

        {/* Tab switcher (hide when submitted) */}
        {mode !== 'submitted' && (
          <div
            style={{
              display: 'flex',
              background: 'rgba(10, 15, 29, 0.8)',
              padding: '4px',
              borderRadius: '12px',
              border: '1px solid rgba(148, 163, 184, 0.1)',
              marginBottom: '1.5rem',
            }}
          >
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setError('');
                setSuccessMsg('');
              }}
              style={{
                flex: 1,
                padding: '0.6rem',
                borderRadius: '8px',
                border: 'none',
                fontSize: '0.88rem',
                fontWeight: 600,
                cursor: 'pointer',
                background: mode === 'login' ? '#6366f1' : 'transparent',
                color: mode === 'login' ? '#fff' : '#94a3b8',
                transition: 'all 0.2s',
              }}
            >
              Vendor Login
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('register');
                setError('');
                setSuccessMsg('');
              }}
              style={{
                flex: 1,
                padding: '0.6rem',
                borderRadius: '8px',
                border: 'none',
                fontSize: '0.88rem',
                fontWeight: 600,
                cursor: 'pointer',
                background: mode === 'register' ? '#6366f1' : 'transparent',
                color: mode === 'register' ? '#fff' : '#94a3b8',
                transition: 'all 0.2s',
              }}
            >
              Register as Seller
            </button>
          </div>
        )}

        {/* Route Guard Notice if redirected due to pending/rejected status */}
        {statusParam === 'pending' && mode !== 'submitted' && (
          <div
            style={{
              background: 'rgba(245, 158, 11, 0.12)',
              border: '1px solid rgba(245, 158, 11, 0.35)',
              color: '#fde68a',
              padding: '0.85rem 1rem',
              borderRadius: '10px',
              fontSize: '0.85rem',
              marginBottom: '1.25rem',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
            }}
          >
            <Clock size={20} color="#f59e0b" style={{ flexShrink: 0 }} />
            <span>
              <strong>Application Pending:</strong> {pendingMessage}
            </span>
          </div>
        )}

        {statusParam === 'rejected' && mode !== 'submitted' && (
          <div
            style={{
              background: 'rgba(239, 68, 68, 0.12)',
              border: '1px solid rgba(239, 68, 68, 0.35)',
              color: '#fca5a5',
              padding: '0.85rem 1rem',
              borderRadius: '10px',
              fontSize: '0.85rem',
              marginBottom: '1.25rem',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
            }}
          >
            <XCircle size={20} color="#ef4444" style={{ flexShrink: 0 }} />
            <span>
              <strong>Application Rejected:</strong> {pendingMessage}
            </span>
          </div>
        )}

        {/* Dynamic Alerts */}
        {error && (
          <div
            style={{
              background: 'rgba(239, 68, 68, 0.12)',
              border: '1px solid rgba(239, 68, 68, 0.35)',
              color: '#fca5a5',
              padding: '0.85rem 1rem',
              borderRadius: '10px',
              fontSize: '0.85rem',
              marginBottom: '1.25rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
              <AlertCircle size={18} color="#ef4444" style={{ flexShrink: 0, marginTop: 2 }} />
              <div>
                <div>{error}</div>
                {error.includes('rejected') && (
                  <button
                    type="button"
                    onClick={() => {
                      setMode('register');
                      setError('');
                    }}
                    style={{
                      marginTop: 8,
                      background: 'rgba(255, 255, 255, 0.1)',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      color: '#fff',
                      padding: '4px 10px',
                      borderRadius: 6,
                      fontSize: '0.78rem',
                      cursor: 'pointer',
                      fontWeight: 600,
                    }}
                  >
                    Resubmit Application with Updated Details →
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {successMsg && mode !== 'submitted' && (
          <div
            style={{
              background: 'rgba(16, 185, 129, 0.12)',
              border: '1px solid rgba(16, 185, 129, 0.35)',
              color: '#6ee7b7',
              padding: '0.75rem 1rem',
              borderRadius: '10px',
              fontSize: '0.85rem',
              marginBottom: '1.25rem',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <CheckCircle2 size={18} /> {successMsg}
          </div>
        )}

        {/* 1. DEDICATED APPLICATION SUBMITTED VIEW */}
        {mode === 'submitted' && (
          <div style={{ textAlign: 'center' }}>
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: '50%',
                background: 'rgba(245, 158, 11, 0.15)',
                border: '2px solid rgba(245, 158, 11, 0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1.25rem',
                color: '#f59e0b',
              }}
            >
              <Clock size={32} />
            </div>

            <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#f8fafc', margin: '0 0 0.5rem 0' }}>
              Application Under Review
            </h3>

            <div
              style={{
                background: 'rgba(245, 158, 11, 0.1)',
                border: '1px solid rgba(245, 158, 11, 0.3)',
                borderRadius: '12px',
                padding: '1rem',
                color: '#fde68a',
                fontSize: '0.9rem',
                lineHeight: 1.5,
                marginBottom: '1.5rem',
                textAlign: 'left',
              }}
            >
              <strong>Your seller registration request has been submitted. Your account will be activated after admin approval.</strong>
            </div>

            {submittedData && (
              <div
                style={{
                  background: 'rgba(15, 23, 42, 0.6)',
                  border: '1px solid rgba(148, 163, 184, 0.15)',
                  borderRadius: '12px',
                  padding: '1rem',
                  textAlign: 'left',
                  fontSize: '0.82rem',
                  marginBottom: '1.5rem',
                  display: 'grid',
                  gap: '0.5rem',
                }}
              >
                <div>
                  <span style={{ color: '#64748b' }}>Store Name: </span>
                  <strong style={{ color: '#e2e8f0' }}>{submittedData.storeName}</strong>
                </div>
                <div>
                  <span style={{ color: '#64748b' }}>Seller: </span>
                  <strong style={{ color: '#e2e8f0' }}>{submittedData.name}</strong>
                </div>
                <div>
                  <span style={{ color: '#64748b' }}>Email: </span>
                  <strong style={{ color: '#e2e8f0' }}>{submittedData.email}</strong>
                </div>
                <div>
                  <span style={{ color: '#64748b' }}>Status: </span>
                  <span
                    style={{
                      background: 'rgba(245, 158, 11, 0.2)',
                      color: '#fbbf24',
                      padding: '2px 8px',
                      borderRadius: 10,
                      fontWeight: 700,
                      fontSize: '0.72rem',
                      textTransform: 'uppercase',
                    }}
                  >
                    Pending Administrator Approval
                  </span>
                </div>
              </div>
            )}

            <p style={{ color: '#94a3b8', fontSize: '0.82rem', lineHeight: 1.5, marginBottom: '1.5rem' }}>
              Your application has been received and is now listed under <strong>"Seller Approval Requests"</strong> in the Admin Panel. You will be able to access the Seller Dashboard and upload products as soon as an administrator verifies and accepts your store.
            </p>

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  if (submittedData?.email) {
                    setLoginForm((prev) => ({ ...prev, email: submittedData.email }));
                  }
                  setError('');
                }}
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  borderRadius: '10px',
                  border: 'none',
                  background: '#6366f1',
                  color: '#fff',
                  fontSize: '0.88rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Go to Seller Login
              </button>
              <Link
                to="/"
                style={{
                  padding: '0.75rem 1.25rem',
                  borderRadius: '10px',
                  background: 'rgba(255, 255, 255, 0.08)',
                  color: '#cbd5e1',
                  textDecoration: 'none',
                  fontSize: '0.88rem',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                Return to Store
              </Link>
            </div>
          </div>
        )}

        {/* 2. Quick Demo Fill Buttons (Login Mode Only) */}
        {mode === 'login' && (
          <div
            style={{
              background: 'rgba(30, 41, 59, 0.4)',
              border: '1px solid rgba(148, 163, 184, 0.1)',
              borderRadius: '12px',
              padding: '0.85rem',
              marginBottom: '1.5rem',
            }}
          >
            <div
              style={{
                fontSize: '0.75rem',
                fontWeight: 600,
                color: '#818cf8',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                marginBottom: '0.5rem',
                display: 'flex',
                alignItems: 'center',
                gap: 5,
              }}
            >
              <Sparkles size={13} /> Quick Fill Demo Credentials:
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => fillDemo('vendor@appsica.com', 'vendor123')}
                style={{
                  background: 'rgba(16, 185, 129, 0.12)',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  color: '#34d399',
                  padding: '0.35rem 0.65rem',
                  borderRadius: '6px',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                ✓ Approved Seller
              </button>
              <button
                type="button"
                onClick={() => fillDemo('pendingvendor@appsica.com', 'vendor123')}
                style={{
                  background: 'rgba(245, 158, 11, 0.12)',
                  border: '1px solid rgba(245, 158, 11, 0.3)',
                  color: '#fbbf24',
                  padding: '0.35rem 0.65rem',
                  borderRadius: '6px',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                ⏳ Pending Approval Seller
              </button>
              <button
                type="button"
                onClick={() => fillDemo('admin@appsica.com', 'admin123')}
                style={{
                  background: 'rgba(99, 102, 241, 0.12)',
                  border: '1px solid rgba(99, 102, 241, 0.3)',
                  color: '#818cf8',
                  padding: '0.35rem 0.65rem',
                  borderRadius: '6px',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                👑 Admin Account
              </button>
            </div>
          </div>
        )}

        {/* 3. LOGIN FORM */}
        {mode === 'login' && (
          <form onSubmit={handleLoginSubmit}>
            <div style={{ marginBottom: '1.25rem' }}>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  color: '#94a3b8',
                  marginBottom: '0.4rem',
                }}
              >
                Vendor Email
              </label>
              <div style={{ position: 'relative' }}>
                <Mail
                  size={18}
                  style={{
                    position: 'absolute',
                    left: '0.9rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: '#64748b',
                  }}
                />
                <input
                  type="email"
                  required
                  placeholder="seller@yourbusiness.com"
                  value={loginForm.email}
                  onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.7rem 1rem 0.7rem 2.5rem',
                    background: '#0a0f1d',
                    border: '1px solid rgba(148, 163, 184, 0.2)',
                    borderRadius: '10px',
                    color: '#fff',
                    fontSize: '0.9rem',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  color: '#94a3b8',
                  marginBottom: '0.4rem',
                }}
              >
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <Lock
                  size={18}
                  style={{
                    position: 'absolute',
                    left: '0.9rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: '#64748b',
                  }}
                />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={loginForm.password}
                  onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.7rem 1rem 0.7rem 2.5rem',
                    background: '#0a0f1d',
                    border: '1px solid rgba(148, 163, 184, 0.2)',
                    borderRadius: '10px',
                    color: '#fff',
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
              style={{
                width: '100%',
                padding: '0.8rem',
                borderRadius: '10px',
                border: 'none',
                background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
                color: '#fff',
                fontSize: '0.95rem',
                fontWeight: 600,
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                boxShadow: '0 4px 16px rgba(99, 102, 241, 0.4)',
                opacity: loading ? 0.7 : 1,
              }}
            >
              {loading ? 'Authenticating...' : 'Sign In to Seller Panel'} <ArrowRight size={18} />
            </button>
          </form>
        )}

        {/* 4. REGISTER FORM */}
        {mode === 'register' && (
          <form onSubmit={handleRegisterSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    color: '#94a3b8',
                    marginBottom: '0.35rem',
                  }}
                >
                  Full Name *
                </label>
                <div style={{ position: 'relative' }}>
                  <User
                    size={16}
                    style={{
                      position: 'absolute',
                      left: '0.85rem',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: '#64748b',
                    }}
                  />
                  <input
                    type="text"
                    required
                    placeholder="e.g. John Doe"
                    value={registerForm.name}
                    onChange={(e) => setRegisterForm({ ...registerForm, name: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.65rem 0.85rem 0.65rem 2.4rem',
                      background: '#0a0f1d',
                      border: '1px solid rgba(148, 163, 184, 0.2)',
                      borderRadius: '10px',
                      color: '#fff',
                      fontSize: '0.88rem',
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
                    fontWeight: 600,
                    color: '#94a3b8',
                    marginBottom: '0.35rem',
                  }}
                >
                  Email Address *
                </label>
                <div style={{ position: 'relative' }}>
                  <Mail
                    size={16}
                    style={{
                      position: 'absolute',
                      left: '0.85rem',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: '#64748b',
                    }}
                  />
                  <input
                    type="email"
                    required
                    placeholder="you@company.com"
                    value={registerForm.email}
                    onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.65rem 0.85rem 0.65rem 2.4rem',
                      background: '#0a0f1d',
                      border: '1px solid rgba(148, 163, 184, 0.2)',
                      borderRadius: '10px',
                      color: '#fff',
                      fontSize: '0.88rem',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    color: '#94a3b8',
                    marginBottom: '0.35rem',
                  }}
                >
                  Account Password *
                </label>
                <div style={{ position: 'relative' }}>
                  <Lock
                    size={16}
                    style={{
                      position: 'absolute',
                      left: '0.85rem',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: '#64748b',
                    }}
                  />
                  <input
                    type="password"
                    required
                    placeholder="Min 6 characters"
                    value={registerForm.password}
                    onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.65rem 0.85rem 0.65rem 2.4rem',
                      background: '#0a0f1d',
                      border: '1px solid rgba(148, 163, 184, 0.2)',
                      borderRadius: '10px',
                      color: '#fff',
                      fontSize: '0.88rem',
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
                    fontWeight: 600,
                    color: '#94a3b8',
                    marginBottom: '0.35rem',
                  }}
                >
                  Phone Number
                </label>
                <div style={{ position: 'relative' }}>
                  <Phone
                    size={16}
                    style={{
                      position: 'absolute',
                      left: '0.85rem',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: '#64748b',
                    }}
                  />
                  <input
                    type="tel"
                    placeholder="e.g. +91 9876543210"
                    value={registerForm.phone}
                    onChange={(e) => setRegisterForm({ ...registerForm, phone: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.65rem 0.85rem 0.65rem 2.4rem',
                      background: '#0a0f1d',
                      border: '1px solid rgba(148, 163, 184, 0.2)',
                      borderRadius: '10px',
                      color: '#fff',
                      fontSize: '0.88rem',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    color: '#94a3b8',
                    marginBottom: '0.35rem',
                  }}
                >
                  Store / Brand Name *
                </label>
                <div style={{ position: 'relative' }}>
                  <Store
                    size={16}
                    style={{
                      position: 'absolute',
                      left: '0.85rem',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: '#64748b',
                    }}
                  />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Aura Audio Co."
                    value={registerForm.storeName}
                    onChange={(e) => setRegisterForm({ ...registerForm, storeName: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.65rem 0.85rem 0.65rem 2.4rem',
                      background: '#0a0f1d',
                      border: '1px solid rgba(148, 163, 184, 0.2)',
                      borderRadius: '10px',
                      color: '#fff',
                      fontSize: '0.88rem',
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
                    fontWeight: 600,
                    color: '#94a3b8',
                    marginBottom: '0.35rem',
                  }}
                >
                  GSTIN / Tax ID
                </label>
                <div style={{ position: 'relative' }}>
                  <FileText
                    size={16}
                    style={{
                      position: 'absolute',
                      left: '0.85rem',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: '#64748b',
                    }}
                  />
                  <input
                    type="text"
                    placeholder="e.g. 29ABCDE1234F1Z5"
                    value={registerForm.taxId}
                    onChange={(e) => setRegisterForm({ ...registerForm, taxId: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.65rem 0.85rem 0.65rem 2.4rem',
                      background: '#0a0f1d',
                      border: '1px solid rgba(148, 163, 184, 0.2)',
                      borderRadius: '10px',
                      color: '#fff',
                      fontSize: '0.88rem',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
              </div>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  color: '#94a3b8',
                  marginBottom: '0.35rem',
                }}
              >
                Store Description
              </label>
              <textarea
                placeholder="Tell customers what makes your store unique..."
                value={registerForm.storeDescription}
                onChange={(e) => setRegisterForm({ ...registerForm, storeDescription: e.target.value })}
                rows={2}
                style={{
                  width: '100%',
                  padding: '0.65rem 0.85rem',
                  background: '#0a0f1d',
                  border: '1px solid rgba(148, 163, 184, 0.2)',
                  borderRadius: '10px',
                  color: '#fff',
                  fontSize: '0.88rem',
                  outline: 'none',
                  boxSizing: 'border-box',
                  fontFamily: 'inherit',
                  resize: 'vertical',
                }}
              />
            </div>

            <div style={{ marginBottom: '1.25rem' }}>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  color: '#94a3b8',
                  marginBottom: '0.35rem',
                }}
              >
                Business / Warehouse Address
              </label>
              <div style={{ position: 'relative' }}>
                <MapPin
                  size={16}
                  style={{
                    position: 'absolute',
                    left: '0.85rem',
                    top: '0.8rem',
                    color: '#64748b',
                  }}
                />
                <input
                  type="text"
                  placeholder="Street address, City, State, Pincode"
                  value={registerForm.businessAddress}
                  onChange={(e) => setRegisterForm({ ...registerForm, businessAddress: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem 0.65rem 2.4rem',
                    background: '#0a0f1d',
                    border: '1px solid rgba(148, 163, 184, 0.2)',
                    borderRadius: '10px',
                    color: '#fff',
                    fontSize: '0.88rem',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
            </div>

            {/* Strict Admin Approval Notice */}
            <div
              style={{
                background: 'rgba(245, 158, 11, 0.08)',
                border: '1px solid rgba(245, 158, 11, 0.25)',
                borderRadius: '10px',
                padding: '0.75rem',
                marginBottom: '1.25rem',
                display: 'flex',
                alignItems: 'flex-start',
                gap: 8,
                fontSize: '0.8rem',
                color: '#fde68a',
              }}
            >
              <Clock size={16} style={{ flexShrink: 0, marginTop: 2, color: '#fbbf24' }} />
              <div>
                <strong>Admin Approval Required:</strong> All new seller registrations require administrator verification before activation. You will receive access to upload products once your application is approved.
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '0.8rem',
                borderRadius: '10px',
                border: 'none',
                background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
                color: '#fff',
                fontSize: '0.95rem',
                fontWeight: 600,
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                boxShadow: '0 4px 16px rgba(99, 102, 241, 0.4)',
                opacity: loading ? 0.7 : 1,
              }}
            >
              {loading ? 'Submitting Application...' : 'Submit Seller Application'} <ArrowRight size={18} />
            </button>
          </form>
        )}

        <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.82rem', color: '#94a3b8' }}>
          <Link to="/" style={{ color: '#818cf8', textDecoration: 'none', fontWeight: 500 }}>
            ← Return to Appsica Store
          </Link>
        </div>
      </div>
    </div>
  );
}
