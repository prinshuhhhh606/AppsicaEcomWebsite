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
    if (
      redirectUrl &&
      redirectUrl !== '/' &&
      redirectUrl !== '/login' &&
      !redirectUrl.includes('/login')
    ) {
      // If customer requested checkout or my-orders, honor it
      if (
        role === 'admin' &&
        (redirectUrl.startsWith('/admin') || redirectUrl.startsWith('/'))
      ) {
        return redirectUrl.startsWith('/admin') ? redirectUrl : '/admin/dashboard';
      }
      return redirectUrl;
    }

    if (role === 'admin') return '/admin/dashboard';
    if (role === 'vendor') return '/vendor/dashboard';
    if (role === 'delivery') return '/delivery/dashboard';
    return '/';
  };

  async function executeLogin(email, password, roleHint) {
    setError('');
    setBusy(true);

    try {
      const res = await login(email, password);
      const loggedInUser = res?.user || res?.data?.user || res;
      const role = loggedInUser?.role || roleHint || 'user';

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
    await executeLogin(form.email.trim(), form.password, null);
  }

  async function handleDemoLogin(email, password, roleName) {
    setDemoRoleLoading(roleName);
    setForm({ email, password });
    await executeLogin(email, password, roleName);
  }

  function handleCurrentSessionRedirect() {
    if (isAdmin) {
      navigate('/admin/dashboard', { replace: true });
    } else if (isVendor) {
      navigate('/vendor/dashboard', { replace: true });
    } else if (isDelivery) {
      navigate('/delivery/dashboard', { replace: true });
    } else {
      navigate(redirectUrl && redirectUrl !== '/login' ? redirectUrl : '/', {
        replace: true,
      });
    }
  }

  function handleSwitchAccount() {
    logout();
    toast.info('Signed out. You can now log into a different account.');
  }

  return (
    <div className="container store-page auth-page">
      <div className="auth-art">
        <span className="eyebrow">UNIFIED MULTI-VENDOR PLATFORM</span>

        <h2>
          One Platform.
          <br />
          <span>Four Powerful Portals.</span>
        </h2>

        <div className="auth-art-mark">A</div>

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
            <div style={{ color: '#94a3b8', fontSize: '0.72rem', marginTop: 2 }}>
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
            <div style={{ color: '#94a3b8', fontSize: '0.72rem', marginTop: 2 }}>
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
            <div style={{ color: '#94a3b8', fontSize: '0.72rem', marginTop: 2 }}>
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
            <div style={{ color: '#94a3b8', fontSize: '0.72rem', marginTop: 2 }}>
              Curated goods & live order tracking
            </div>
          </div>
        </div>
      </div>

      <div className="auth-panel">
        <span className="eyebrow">SECURE AUTHENTICATION</span>

        <h1 style={{ marginTop: '0.35rem', marginBottom: '0.35rem' }}>Sign In</h1>

        <p style={{ color: '#94a3b8', fontSize: '0.88rem', marginBottom: '1.25rem' }}>
          Access your personal storefront or management dashboard.
        </p>

        {/* Active Session Card if user is already logged in */}
        {isAuthenticated && user && (
          <div
            style={{
              background: 'rgba(99, 102, 241, 0.14)',
              border: '1px solid rgba(99, 102, 241, 0.35)',
              borderRadius: 12,
              padding: '1rem',
              marginBottom: '1.25rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    background: '#6366f1',
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    fontSize: '0.85rem',
                  }}
                >
                  {user.name?.[0]?.toUpperCase() || 'U'}
                </div>
                <div>
                  <div style={{ fontWeight: 600, color: '#f8fafc', fontSize: '0.92rem' }}>
                    {user.name}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>{user.email}</div>
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
                      ? 'rgba(129, 140, 248, 0.2)'
                      : user.role === 'vendor'
                      ? 'rgba(245, 158, 11, 0.2)'
                      : user.role === 'delivery'
                      ? 'rgba(56, 189, 248, 0.2)'
                      : 'rgba(16, 185, 129, 0.2)',
                  color:
                    user.role === 'admin'
                      ? '#c7d2fe'
                      : user.role === 'vendor'
                      ? '#fde68a'
                      : user.role === 'delivery'
                      ? '#bae6fd'
                      : '#a7f3d0',
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
                  padding: '8px 12px',
                  borderRadius: 8,
                  background: '#6366f1',
                  color: '#fff',
                  border: 'none',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                }}
              >
                Go to Portal <ExternalLink size={14} />
              </button>

              <button
                type="button"
                onClick={handleSwitchAccount}
                style={{
                  padding: '8px 14px',
                  borderRadius: 8,
                  background: 'rgba(255, 255, 255, 0.08)',
                  color: '#f87171',
                  border: '1px solid rgba(248, 113, 113, 0.3)',
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
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: 14,
            padding: '1rem',
            marginBottom: '1.5rem',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '0.75rem',
            }}
          >
            <span
              style={{
                fontSize: '0.78rem',
                fontWeight: 700,
                color: '#e2e8f0',
                letterSpacing: '0.04em',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <Sparkles size={14} color="#f59e0b" /> 1-CLICK DEMO LOGIN (TEST ROLES)
            </span>
            <span style={{ fontSize: '0.7rem', color: '#64748b' }}>Select to test</span>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '0.6rem',
            }}
          >
            {/* 1. Admin */}
            <button
              type="button"
              disabled={busy}
              onClick={() => handleDemoLogin('admin@appsica.com', 'admin123', 'admin')}
              style={{
                padding: '9px 12px',
                borderRadius: 9,
                background:
                  demoRoleLoading === 'admin'
                    ? '#6366f1'
                    : 'rgba(99, 102, 241, 0.1)',
                border: '1px solid rgba(99, 102, 241, 0.3)',
                color: demoRoleLoading === 'admin' ? '#fff' : '#c7d2fe',
                fontSize: '0.78rem',
                fontWeight: 600,
                cursor: busy ? 'not-allowed' : 'pointer',
                textAlign: 'left',
                display: 'flex',
                alignItems: 'center',
                gap: 7,
                transition: 'all 0.15s ease',
              }}
            >
              <ShieldCheck size={16} color="#818cf8" />
              <div>
                <div style={{ lineHeight: 1.2 }}>Super Admin</div>
                <div style={{ fontSize: '0.67rem', color: '#94a3b8', fontWeight: 400 }}>
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
                padding: '9px 12px',
                borderRadius: 9,
                background:
                  demoRoleLoading === 'vendor'
                    ? '#d97706'
                    : 'rgba(245, 158, 11, 0.1)',
                border: '1px solid rgba(245, 158, 11, 0.3)',
                color: demoRoleLoading === 'vendor' ? '#fff' : '#fde68a',
                fontSize: '0.78rem',
                fontWeight: 600,
                cursor: busy ? 'not-allowed' : 'pointer',
                textAlign: 'left',
                display: 'flex',
                alignItems: 'center',
                gap: 7,
                transition: 'all 0.15s ease',
              }}
            >
              <Store size={16} color="#f59e0b" />
              <div>
                <div style={{ lineHeight: 1.2 }}>Seller Central</div>
                <div style={{ fontSize: '0.67rem', color: '#94a3b8', fontWeight: 400 }}>
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
                padding: '9px 12px',
                borderRadius: 9,
                background:
                  demoRoleLoading === 'delivery'
                    ? '#0284c7'
                    : 'rgba(56, 189, 248, 0.1)',
                border: '1px solid rgba(56, 189, 248, 0.3)',
                color: demoRoleLoading === 'delivery' ? '#fff' : '#bae6fd',
                fontSize: '0.78rem',
                fontWeight: 600,
                cursor: busy ? 'not-allowed' : 'pointer',
                textAlign: 'left',
                display: 'flex',
                alignItems: 'center',
                gap: 7,
                transition: 'all 0.15s ease',
              }}
            >
              <Truck size={16} color="#38bdf8" />
              <div>
                <div style={{ lineHeight: 1.2 }}>Delivery Rider</div>
                <div style={{ fontSize: '0.67rem', color: '#94a3b8', fontWeight: 400 }}>
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
                padding: '9px 12px',
                borderRadius: 9,
                background:
                  demoRoleLoading === 'user'
                    ? '#059669'
                    : 'rgba(16, 185, 129, 0.1)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                color: demoRoleLoading === 'user' ? '#fff' : '#a7f3d0',
                fontSize: '0.78rem',
                fontWeight: 600,
                cursor: busy ? 'not-allowed' : 'pointer',
                textAlign: 'left',
                display: 'flex',
                alignItems: 'center',
                gap: 7,
                transition: 'all 0.15s ease',
              }}
            >
              <UserCheck size={16} color="#10b981" />
              <div>
                <div style={{ lineHeight: 1.2 }}>Customer</div>
                <div style={{ fontSize: '0.67rem', color: '#94a3b8', fontWeight: 400 }}>
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