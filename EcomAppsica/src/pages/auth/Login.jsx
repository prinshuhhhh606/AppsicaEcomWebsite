import { useContext, useState } from 'react';
import { Link, useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { ArrowRight, CircleAlert } from 'lucide-react';
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

  const { login } = useContext(AuthContext);
  const { toast } = useContext(NotificationContext);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const location = useLocation();

  const redirectUrl = searchParams.get('redirect') || location.state?.from || '/';

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setBusy(true);

    try {
      await login(form.email, form.password);

      toast.success('Welcome back.');
      navigate(redirectUrl);
    } catch (requestError) {
      setError(
        readableError(requestError, 'We couldn’t sign you in. Please try again.')
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="container store-page auth-page">
      <div className="auth-art">
        <span className="eyebrow">
          A BETTER WAY TO FIND YOUR FAVOURITES
        </span>

        <h2>
          Come on in.
          <br />
          <span>Your good finds await.</span>
        </h2>

        <div className="auth-art-mark">A</div>

        <p>One little account. A whole lot of lovely things.</p>
      </div>

      <div className="auth-panel">
        <span className="eyebrow">WELCOME BACK</span>

        <h1>Sign in</h1>

        <p>Sign in to pick up where you left off.</p>

        {redirectUrl && redirectUrl !== '/' && (
          <div
            style={{
              background: 'rgba(99, 102, 241, 0.12)',
              border: '1px solid rgba(99, 102, 241, 0.3)',
              borderRadius: 10,
              padding: '0.75rem 1rem',
              marginBottom: '1.25rem',
              color: '#c7d2fe',
              fontSize: '0.88rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            <CircleAlert size={16} color="#818cf8" style={{ flexShrink: 0 }} />
            <span>
              {redirectUrl.includes('checkout')
                ? 'Sign in to complete your checkout. Your cart items are preserved!'
                : 'Please sign in to continue to your requested page.'}
            </span>
          </div>
        )}

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
              placeholder="you@example.com"
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
              placeholder="Enter your password"
            />
          </label>

          <div className="auth-forgot">
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
          >
            {busy ? 'Please wait…' : 'Sign in'}
            {!busy && <ArrowRight size={17} />}
          </button>
        </form>

        <p className="auth-switch">
          New around here?{' '}
          <Link
            to={
              redirectUrl && redirectUrl !== '/'
                ? `/register?redirect=${encodeURIComponent(redirectUrl)}`
                : '/register'
            }
          >
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}

export default Login;