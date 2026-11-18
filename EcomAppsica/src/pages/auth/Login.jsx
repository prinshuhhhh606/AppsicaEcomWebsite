import { useContext, useState } from 'react';
import { Link, useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import {
  ArrowRight,
  CircleAlert,
  ShieldCheck,
  Store,
  Truck,
  UserCheck,
  LogOut,
  ExternalLink,
  Sparkles,
  Lock,
} from 'lucide-react';
import { AuthContext } from '../../context/AuthContextValue';
import { NotificationContext } from '../../context/NotificationContextValue';

function readableError(error, fallback) {
  return error?.response?.data?.message || error?.message || fallback;
}

function Login() {
  const [form, setForm] = useState({
    email: '',
    password: '',
  });

  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [demoRoleLoading, setDemoRoleLoading] = useState(null);

  const { user, login, logout, isAuthenticated, isAdmin, isVendor, isDelivery } =
    useContext(AuthContext);
  const { toast } = useContext(NotificationContext);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const location = useLocation();

  const rawRedirect = searchParams.get('redirect') || location.state?.from || '/';
  const redirectUrl = decodeURIComponent(rawRedirect);
  const notice = searchParams.get('notice');

  // Helper to determine destination route based on role & explicit redirect
  const getDestinationRoute = (role) => {
    // Admin always goes to admin portal (or preserved admin sub-route)
    if (role === 'admin') {
      if (redirectUrl && redirectUrl.startsWith('/admin')) {
        return redirectUrl;
      }
      return '/admin/dashboard';
    }

    // Approved vendor always goes to vendor portal (or preserved vendor sub-route)
    if (role === 'vendor') {
      if (redirectUrl && redirectUrl.startsWith('/vendor')) {
        return redirectUrl;
      }
      return '/vendor/dashboard';
    }

    // Approved delivery partner always goes to delivery portal (or preserved delivery sub-route)
    if (role === 'delivery') {
      if (redirectUrl && redirectUrl.startsWith('/delivery')) {
        return redirectUrl;
      }
      return '/delivery/dashboard';
    }

    // Customer goes to preserved redirect (e.g. /checkout, /my-orders) or customer homepage /
    if (
      redirectUrl &&
      redirectUrl !== '/' &&
      redirectUrl !== '/login' &&
      !redirectUrl.includes('/login') &&
      !redirectUrl.startsWith('/admin') &&
      !redirectUrl.startsWith('/vendor') &&
      !redirectUrl.startsWith('/delivery')
    ) {
      return redirectUrl;
    }

    return '/';
  };

  async function executeLogin(email, password) {
    setError('');
    setBusy(true);

    try {
      const res = await login(email, password);
      const loggedInUser = res?.user || res?.data?.user || res;
      // Role is determined strictly by backend authentication response
      const role = loggedInUser?.role || 'user';

      toast.success(
        `Welcome, ${loggedInUser?.name || 'User'}! Logged in as ${role.toUpperCase()}.`
      );

      const targetPath = getDestinationRoute(role);
      navigate(targetPath, { replace: true });
    } catch (requestError) {
      setError(
        readableError(
          requestError,
          'Invalid credentials. Please verify your email and password.'
        )
      );
    } finally {
      setBusy(false);
      setDemoRoleLoading(null);
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (!form.email || !form.password) {
      setError('Please provide both email and password');
      return;
    }
    await executeLogin(form.email.trim(), form.password);
  }

  async function handleDemoLogin(email, password, roleName) {
    setDemoRoleLoading(roleName);
    setForm({ email, password });
    await executeLogin(email, password);
  }

  function handleCurrentSessionRedirect() {
    if (isAdmin) {
      navigate('/admin/dashboard', { replace: true });
      return;
    }

    if (user?.role === 'vendor') {
      if (user?.vendorStatus === 'approved') {
        navigate('/vendor/dashboard', { replace: true });
      } else {
        const status = user?.vendorStatus || 'pending';
        const message =
          status === 'rejected'
            ? 'Your seller application was rejected by the admin. Please contact support or reapply.'
            : status === 'suspended'
              ? 'Your seller account has been suspended by the admin. Please contact support.'
              : 'Your registration request has not been approved by the admin yet. Please wait for approval.';
        navigate(`/vendor/login?status=${status}&message=${encodeURIComponent(message)}`, {
          replace: true,
        });
      }
      return;
    }

    if (user?.role === 'delivery') {
      if (user?.deliveryStatus === 'approved') {
        navigate('/delivery/dashboard', { replace: true });
      } else {
        const status = user?.deliveryStatus || 'pending';
        const message =
          status === 'rejected'
            ? 'Your delivery application was rejected by the admin. Please contact support or reapply.'
            : status === 'suspended'
              ? 'Your delivery account has been suspended by the admin. Please contact support.'
              : 'Your registration request has not been approved by the admin yet. Please wait for approval.';
        navigate(`/delivery/login?status=${status}&message=${encodeURIComponent(message)}`, {
          replace: true,
        });
      }
      return;
    }

    navigate(redirectUrl && redirectUrl !== '/login' ? redirectUrl : '/', {
      replace: true,
    });
  }

  function handleSwitchAccount() {
    logout();
    toast.info('Signed out. You can now log into a different account.');
  }

  return (
    <div className="container store-page auth-page" style={{ paddingTop: '2.5rem', marginTop: '1rem' }}>
      <div className="auth-art">
        <span className="eyebrow" style={{ color: '#d1fae5' }}>UNIFIED MULTI-VENDOR PLATFORM</span>

        <h2>
          One Platform.
          <br />
          <span>Four Powerful Portals.</span>
        </h2>

        <div className="auth-art-mark">S</div>

        <p>
          Customer Storefront • Vendor Central • Enterprise Super-Admin • Delivery Dispatch
        </p>

        {/* Informational badges for the 4 portals */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: 10,
            marginTop: 20,
            zIndex: 2,
          }}
        >
          <div
            style={{
              padding: '10px 14px',
              borderRadius: 12,
              background: 'rgba(255, 255, 255, 0.08)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              fontSize: '0.78rem',
            }}
          >
            <div style={{ fontWeight: 600, color: '#c7d2fe', display: 'flex', alignItems: 'center', gap: 6 }}>
              <ShieldCheck size={14} color="#818cf8" /> Admin Panel
            </div>
            <div style={{ color: '#d1fae5', fontSize: '0.72rem', marginTop: 2, opacity: 0.85 }}>
              Full catalog, fleet & finance control
            </div>
          </div>

          <div
            style={{
              padding: '10px 14px',
              borderRadius: 12,
              background: 'rgba(255, 255, 255, 0.08)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              fontSize: '0.78rem',
            }}
          >
            <div style={{ fontWeight: 600, color: '#fde68a', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Store size={14} color="#f59e0b" /> Vendor Central
            </div>
            <div style={{ color: '#d1fae5', fontSize: '0.72rem', marginTop: 2, opacity: 0.85 }}>
              Products, orders & payout ledger
            </div>
          </div>

          <div
            style={{
              padding: '10px 14px',
              borderRadius: 12,
              background: 'rgba(255, 255, 255, 0.08)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              fontSize: '0.78rem',
            }}
          >
            <div style={{ fontWeight: 600, color: '#bae6fd', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Truck size={14} color="#38bdf8" /> Rider Dispatch
            </div>
            <div style={{ color: '#d1fae5', fontSize: '0.72rem', marginTop: 2, opacity: 0.85 }}>
              Route maps & delivery OTP verification
            </div>
          </div>

          <div
            style={{
              padding: '10px 14px',
              borderRadius: 12,
              background: 'rgba(255, 255, 255, 0.08)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              fontSize: '0.78rem',
            }}
          >
            <div style={{ fontWeight: 600, color: '#a7f3d0', display: 'flex', alignItems: 'center', gap: 6 }}>
              <UserCheck size={14} color="#10b981" /> Customer Hub
            </div>
            <div style={{ color: '#d1fae5', fontSize: '0.72rem', marginTop: 2, opacity: 0.85 }}>
              Curated goods & live order tracking
            </div>
          </div>
        </div>
      </div>

      <div className="auth-panel" style={{ marginTop: '2.5rem', paddingTop: '1.5rem' }}>
        <span className="eyebrow" style={{ display: 'inline-flex', marginTop: '0.5rem', marginBottom: '0.75rem', color: '#063b2c', letterSpacing: '0.14em', fontWeight: 800 }}>
          SECURE AUTHENTICATION
        </span>

        <h1 style={{ marginTop: '0.35rem', marginBottom: '0.5rem', color: '#063b2c', fontWeight: 800 }}>Sign In</h1>

        <p style={{ color: '#000000', fontSize: '0.88rem', marginBottom: '1.5rem', fontWeight: 500 }}>
          Access your personal storefront or management dashboard.
        </p>

        {/* Active Session Card if user is already logged in */}
        {isAuthenticated && user && (
          <div
            style={{
              background: '#ffffff',
              border: '1.5px solid #c7d2fe',
              borderRadius: 14,
              padding: '1rem',
              marginBottom: '1.25rem',
              boxShadow: '0 4px 15px rgba(99, 102, 241, 0.08)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: '50%',
                    background: '#063b2c',
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    fontSize: '0.88rem',
                  }}
                >
                  {user.name?.[0]?.toUpperCase() || 'U'}
                </div>
                <div>
                  <div style={{ fontWeight: 700, color: '#000000', fontSize: '0.92rem' }}>
                    {user.name}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#000000' }}>{user.email}</div>
                </div>
              </div>

              <span
                style={{
                  padding: '3px 10px',
                  borderRadius: 20,
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  background:
                    user.role === 'admin'
                      ? 'rgba(6, 59, 44, 0.1)'
                      : user.role === 'vendor'
                      ? 'rgba(245, 158, 11, 0.15)'
                      : user.role === 'delivery'
                      ? 'rgba(2, 132, 199, 0.15)'
                      : 'rgba(16, 185, 129, 0.15)',
                  color:
                    user.role === 'admin'
                      ? '#063b2c'
                      : user.role === 'vendor'
                      ? '#b45309'
                      : user.role === 'delivery'
                      ? '#0369a1'
                      : '#065f46',
                }}
              >
                {user.role}
              </span>
            </div>

            <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
              <button
                type="button"
                onClick={handleCurrentSessionRedirect}
                style={{
                  flex: 1,
                  padding: '9px 12px',
                  borderRadius: 8,
                  background: '#063b2c',
                  color: '#fff',
                  border: 'none',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  transition: 'background 0.2s',
                }}
              >
                Go to Portal <ExternalLink size={14} />
              </button>

              <button
                type="button"
                onClick={handleSwitchAccount}
                style={{
                  padding: '9px 14px',
                  borderRadius: 8,
                  background: '#fef2f2',
                  color: '#dc2626',
                  border: '1px solid #fecaca',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <LogOut size={14} /> Switch
              </button>
            </div>
          </div>
        )}

        {/* Notice Alerts */}
        {notice === 'admin_required' && (
          <div
            style={{
              background: 'rgba(239, 68, 68, 0.12)',
              border: '1px solid rgba(239, 68, 68, 0.35)',
              borderRadius: 10,
              padding: '0.75rem 1rem',
              marginBottom: '1.25rem',
              color: '#fca5a5',
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.65rem',
            }}
          >
            <CircleAlert size={18} color="#ef4444" style={{ flexShrink: 0 }} />
            <span>
              <strong>Admin Access Required:</strong> You must be signed in as an
              administrator to view the Admin Console. Use the Quick Demo Admin
              button below.
            </span>
          </div>
        )}

        {redirectUrl && redirectUrl !== '/' && !notice && (
          <div
            style={{
              background: 'rgba(99, 102, 241, 0.12)',
              border: '1px solid rgba(99, 102, 241, 0.3)',
              borderRadius: 10,
              padding: '0.75rem 1rem',
              marginBottom: '1.25rem',
              color: '#c7d2fe',
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            <CircleAlert size={16} color="#818cf8" style={{ flexShrink: 0 }} />
            <span>
              {redirectUrl.includes('checkout')
                ? 'Sign in to complete your order. Your cart items are saved!'
                : `Please sign in to continue to: ${redirectUrl}`}
            </span>
          </div>
        )}

        {/* 1-Click Quick Demo Login Section */}
        <div
          style={{
            background: '#ffffff',
            border: '1px solid #eaede7',
            borderRadius: 14,
            padding: '1.1rem',
            marginBottom: '1.5rem',
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.04)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '0.85rem',
            }}
          >
            <span
              style={{
                fontSize: '0.8rem',
                fontWeight: 800,
                color: '#000000',
                letterSpacing: '0.04em',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <Sparkles size={15} color="#d97706" /> 1-CLICK DEMO LOGIN (TEST ROLES)
            </span>
            <span style={{ fontSize: '0.72rem', color: '#000000', fontWeight: 600 }}>Select to test</span>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '0.7rem',
            }}
          >
            {/* 1. Admin */}
            <button
              type="button"
              disabled={busy}
              onClick={() => handleDemoLogin('admin@appsica.com', 'admin123', 'admin')}
              style={{
                padding: '12px 14px',
                borderRadius: 10,
                background: demoRoleLoading === 'admin' ? '#4338ca' : '#eef2ff',
                border: '2px solid #6366f1',
                color: demoRoleLoading === 'admin' ? '#ffffff' : '#1e1b4b',
                fontSize: '0.82rem',
                fontWeight: 700,
                cursor: busy ? 'not-allowed' : 'pointer',
                textAlign: 'left',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                transition: 'all 0.15s ease',
              }}
            >
              <ShieldCheck size={20} color={demoRoleLoading === 'admin' ? '#ffffff' : '#4338ca'} style={{ flexShrink: 0 }} />
              <div>
                <div style={{ lineHeight: 1.2, fontWeight: 800, color: demoRoleLoading === 'admin' ? '#ffffff' : '#1e1b4b' }}>Super Admin</div>
                <div style={{ fontSize: '0.72rem', color: demoRoleLoading === 'admin' ? '#e0e7ff' : '#000000', fontWeight: 700, marginTop: 3 }}>
                  admin@appsica.com
                </div>
              </div>
            </button>

            {/* 2. Vendor */}
            <button
              type="button"
              disabled={busy}
              onClick={() => handleDemoLogin('vendor@appsica.com', 'vendor123', 'vendor')}
              style={{
                padding: '12px 14px',
                borderRadius: 10,
                background: demoRoleLoading === 'vendor' ? '#b45309' : '#fef3c7',
                border: '2px solid #d97706',
                color: demoRoleLoading === 'vendor' ? '#ffffff' : '#451a03',
                fontSize: '0.82rem',
                fontWeight: 700,
                cursor: busy ? 'not-allowed' : 'pointer',
                textAlign: 'left',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                transition: 'all 0.15s ease',
              }}
            >
              <Store size={20} color={demoRoleLoading === 'vendor' ? '#ffffff' : '#b45309'} style={{ flexShrink: 0 }} />
              <div>
                <div style={{ lineHeight: 1.2, fontWeight: 800, color: demoRoleLoading === 'vendor' ? '#ffffff' : '#451a03' }}>Seller Central</div>
                <div style={{ fontSize: '0.72rem', color: demoRoleLoading === 'vendor' ? '#fef3c7' : '#000000', fontWeight: 700, marginTop: 3 }}>
                  vendor@appsica.com
                </div>
              </div>
            </button>

            {/* 3. Delivery */}
            <button
              type="button"
              disabled={busy}
              onClick={() =>
                handleDemoLogin('delivery@appsica.com', 'delivery123', 'delivery')
              }
              style={{
                padding: '12px 14px',
                borderRadius: 10,
                background: demoRoleLoading === 'delivery' ? '#0284c7' : '#e0f2fe',
                border: '2px solid #0284c7',
                color: demoRoleLoading === 'delivery' ? '#ffffff' : '#082f49',
                fontSize: '0.82rem',
                fontWeight: 700,
                cursor: busy ? 'not-allowed' : 'pointer',
                textAlign: 'left',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                transition: 'all 0.15s ease',
              }}
            >
              <Truck size={20} color={demoRoleLoading === 'delivery' ? '#ffffff' : '#0284c7'} style={{ flexShrink: 0 }} />
              <div>
                <div style={{ lineHeight: 1.2, fontWeight: 800, color: demoRoleLoading === 'delivery' ? '#ffffff' : '#082f49' }}>Delivery Rider</div>
                <div style={{ fontSize: '0.72rem', color: demoRoleLoading === 'delivery' ? '#e0f2fe' : '#000000', fontWeight: 700, marginTop: 3 }}>
                  delivery@appsica.com
                </div>
              </div>
            </button>

            {/* 4. Customer */}
            <button
              type="button"
              disabled={busy}
              onClick={() => handleDemoLogin('user@appsica.com', 'user123', 'user')}
              style={{
                padding: '12px 14px',
                borderRadius: 10,
                background: demoRoleLoading === 'user' ? '#065f46' : '#dcfce7',
                border: '2px solid #059669',
                color: demoRoleLoading === 'user' ? '#ffffff' : '#064e3b',
                fontSize: '0.82rem',
                fontWeight: 700,
                cursor: busy ? 'not-allowed' : 'pointer',
                textAlign: 'left',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                transition: 'all 0.15s ease',
              }}
            >
              <UserCheck size={20} color={demoRoleLoading === 'user' ? '#ffffff' : '#059669'} style={{ flexShrink: 0 }} />
              <div>
                <div style={{ lineHeight: 1.2, fontWeight: 800, color: demoRoleLoading === 'user' ? '#ffffff' : '#064e3b' }}>Customer Store</div>
                <div style={{ fontSize: '0.72rem', color: demoRoleLoading === 'user' ? '#d1fae5' : '#000000', fontWeight: 700, marginTop: 3 }}>
                  user@appsica.com
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* Traditional Credentials Form */}
        <form className="store-form" onSubmit={handleSubmit}>
          <label className="form-group">
            <span className="form-label">Email address</span>
            <input
              className="form-input"
              type="email"
              name="email"
              required
              autoComplete="email"
              value={form.email}
              onChange={(event) =>
                setForm({ ...form, email: event.target.value })
              }
              placeholder="e.g. admin@appsica.com or user@appsica.com"
            />
          </label>

          <label className="form-group">
            <span className="form-label">Password</span>
            <input
              className="form-input"
              type="password"
              name="password"
              required
              autoComplete="current-password"
              value={form.password}
              onChange={(event) =>
                setForm({ ...form, password: event.target.value })
              }
              placeholder="Enter password (e.g. admin123)"
            />
          </label>

          <div
            className="auth-forgot"
            style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
          >
            <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
              <Lock size={12} style={{ verticalAlign: 'middle', marginRight: 4 }} />
              256-bit encrypted
            </span>
            <Link to="/forgot-password">Forgot password?</Link>
          </div>

          {error && (
            <div className="form-alert">
              <CircleAlert size={17} />
              {error}
            </div>
          )}

          <button
            className="btn btn-primary btn-full btn-lg"
            type="submit"
            disabled={busy}
            id="login-submit-button"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              marginTop: 4,
            }}
          >
            {busy ? (
              <span>Authenticating…</span>
            ) : (
              <>
                <span>Sign in</span>
                <ArrowRight size={17} />
              </>
            )}
          </button>
        </form>

        <p className="auth-switch" style={{ marginTop: '1.25rem' }}>
          New to Appsica?{' '}
          <Link
            to={
              redirectUrl && redirectUrl !== '/'
                ? `/register?redirect=${encodeURIComponent(redirectUrl)}`
                : '/register'
            }
          >
            Create Customer Account
          </Link>
          {' • '}
          <Link to="/vendor/register" style={{ color: '#f59e0b' }}>
            Become a Seller
          </Link>
          {' • '}
          <Link to="/delivery/register" style={{ color: '#38bdf8' }}>
            Rider Registration
          </Link>
        </p>
      </div>
    </div>
  );
}

export default Login;