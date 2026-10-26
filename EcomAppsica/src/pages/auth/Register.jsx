
import { useState, useContext } from 'react';
import { Link, useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { User, Mail, Phone, Lock, ArrowRight } from 'lucide-react';
import { AuthContext } from '../../context/AuthContextValue';
import { NotificationContext } from '../../context/NotificationContextValue';
import './Register.css';

function Register() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const redirectUrl = searchParams.get('redirect') || location.state?.from || '/';

  const { register } = useContext(AuthContext);
  const { toast } = useContext(NotificationContext);

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [busy, setBusy] = useState(false);

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((previousForm) => ({
      ...previousForm,
      [name]: value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setSuccess('');

    const name = form.name.trim();
    const email = form.email.trim().toLowerCase();
    const phone = form.phone.trim();

    if (!name || !email || !form.password || !form.confirmPassword) {
      setError('Please fill in all required fields.');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid email address.');
      return;
    }

    if (form.password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setBusy(true);

    try {
      console.log('📤 [FRONTEND] Submitting registration data to Backend API...', {
        name,
        email,
        phone,
      });

      const response = await register({
        name,
        email,
        phone,
        password: form.password,
      });

      // 🔍 Print registered user in browser console with clear formatting
      console.log('========================================================');
      console.log('🎉 [FRONTEND CONSOLE] NEW USER REGISTERED FROM BACKEND!');
      console.log('👤 Name:       ', response?.user?.name || name);
      console.log('📧 Email:      ', response?.user?.email || email);
      console.log('📞 Phone:      ', response?.user?.phone || phone || 'Not provided');
      console.log('👑 Role:       ', response?.user?.role || 'user');
      console.log('🆔 Mongo ID:   ', response?.user?._id || response?.user?.id);
      console.log('🔑 JWT Token:  ', response?.token ? `${response.token.substring(0, 25)}...` : 'Generated');
      console.log('📦 Full Data:  ', response);
      console.log('========================================================');

      setSuccess(`Account created successfully for ${response?.user?.name || name}!`);
      toast.success(`Welcome, ${response?.user?.name || name}! Registration successful.`);

      setTimeout(() => {
        navigate(redirectUrl);
      }, 1200);
    } catch (err) {
      console.error('❌ [FRONTEND] Registration error received from backend:', err);
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="register-page">
      <div className="register-card">
        <div className="register-heading">
          <div className="register-logo">
            <User size={28} />
          </div>

          <h1>Create Account</h1>
          <p>Sign up to get started with your account.</p>

          {redirectUrl && redirectUrl !== '/' && (
            <div
              style={{
                marginTop: '1rem',
                background: 'rgba(99, 102, 241, 0.12)',
                border: '1px solid rgba(99, 102, 241, 0.3)',
                borderRadius: 8,
                padding: '0.65rem 0.9rem',
                color: '#c7d2fe',
                fontSize: '0.85rem',
              }}
            >
              {redirectUrl.includes('checkout')
                ? 'Create an account to complete your checkout. Your bag items are saved!'
                : 'Create an account to proceed to your requested page.'}
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="register-form">
          <div className="register-field">
            <label htmlFor="name">Full Name *</label>
            <div className="register-input-wrap">
              <User size={18} />
              <input
                id="name"
                type="text"
                name="name"
                placeholder="Enter your full name"
                value={form.name}
                onChange={handleChange}
                autoComplete="name"
                required
              />
            </div>
          </div>

          <div className="register-field">
            <label htmlFor="email">Email Address *</label>
            <div className="register-input-wrap">
              <Mail size={18} />
              <input
                id="email"
                type="email"
                name="email"
                placeholder="Enter your email"
                value={form.email}
                onChange={handleChange}
                autoComplete="email"
                required
              />
            </div>
          </div>

          <div className="register-field">
            <label htmlFor="phone">Phone Number (Optional)</label>
            <div className="register-input-wrap">
              <Phone size={18} />
              <input
                id="phone"
                type="tel"
                name="phone"
                placeholder="Enter your mobile number"
                value={form.phone}
                onChange={handleChange}
                autoComplete="tel"
              />
            </div>
          </div>

          <div className="register-field">
            <label htmlFor="password">Password *</label>
            <div className="register-input-wrap">
              <Lock size={18} />
              <input
                id="password"
                type="password"
                name="password"
                placeholder="Create a password (min 6 chars)"
                value={form.password}
                onChange={handleChange}
                autoComplete="new-password"
                minLength={6}
                required
              />
            </div>
          </div>

          <div className="register-field">
            <label htmlFor="confirmPassword">Confirm Password *</label>
            <div className="register-input-wrap">
              <Lock size={18} />
              <input
                id="confirmPassword"
                type="password"
                name="confirmPassword"
                placeholder="Confirm your password"
                value={form.confirmPassword}
                onChange={handleChange}
                autoComplete="new-password"
                required
              />
            </div>
          </div>

          {error && (
            <p className="register-message register-error" role="alert">
              {error}
            </p>
          )}

          {success && (
            <p className="register-message register-success" role="status">
              {success}
            </p>
          )}

          <button
            type="submit"
            className="register-button"
            disabled={busy}
          >
            {busy ? 'Creating account...' : 'Create Account'}
            {!busy && <ArrowRight size={18} />}
          </button>
        </form>

        <p className="register-login">
          Already have an account?{' '}
          <Link
            to={
              redirectUrl && redirectUrl !== '/'
                ? `/login?redirect=${encodeURIComponent(redirectUrl)}`
                : '/login'
            }
          >
            Sign in
          </Link>
        </p>

        <p className="register-demo-note">
          Official Appsica account with secure cloud authentication.
        </p>
      </div>
    </div>
  );
}

export default Register;
