import { useState, useContext } from 'react';
import { Link, useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import {
  User,
  Mail,
  Phone,
  Lock,
  ArrowRight,
  Bike,
  Store,
  Clock,
  ShieldCheck,
  CheckCircle,
  Truck,
  MapPin,
  FileText,
} from 'lucide-react';
import { AuthContext } from '../../context/AuthContextValue';
import { NotificationContext } from '../../context/NotificationContextValue';
import { deliveryService } from '../../services/deliveryService';
import './Register.css';

function Register() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const redirectUrl = searchParams.get('redirect') || location.state?.from || '/';

  // Support pre-selecting role from query param ?role=delivery
  const initialRole = searchParams.get('role') === 'delivery' ? 'delivery' : 'customer';
  const [accountType, setAccountType] = useState(initialRole);

  const { register } = useContext(AuthContext);
  const { toast } = useContext(NotificationContext);

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    // Delivery partner specific fields
    vehicleType: 'bike',
    vehicleNumber: '',
    drivingLicenseNumber: '',
    deliveryCity: 'Mumbai',
    emergencyContact: '',
  });

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [busy, setBusy] = useState(false);
  const [submittedDeliveryData, setSubmittedDeliveryData] = useState(null);

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

    // Validation for Delivery Partner
    if (accountType === 'delivery') {
      if (!phone) {
        setError('Mobile phone number is required for delivery partners.');
        return;
      }
      if (!form.vehicleNumber.trim()) {
        setError('Vehicle registration number is required (e.g. MH-02-AB-1234).');
        return;
      }
      if (!form.drivingLicenseNumber.trim()) {
        setError('Driving license number is required for verification.');
        return;
      }
    }

    setBusy(true);

    // ==========================================
    // 1. DELIVERY PARTNER REGISTRATION
    // ==========================================
    if (accountType === 'delivery') {
      try {
        console.log('📤 [FRONTEND] Submitting Delivery Partner application...', {
          name,
          email,
          phone,
          vehicleType: form.vehicleType,
          vehicleNumber: form.vehicleNumber,
          drivingLicenseNumber: form.drivingLicenseNumber,
          deliveryCity: form.deliveryCity,
        });

        const response = await deliveryService.register({
          name,
          email,
          phone,
          password: form.password,
          vehicleType: form.vehicleType,
          vehicleNumber: form.vehicleNumber.trim().toUpperCase(),
          drivingLicenseNumber: form.drivingLicenseNumber.trim().toUpperCase(),
          deliveryCity: form.deliveryCity.trim(),
          emergencyContact: form.emergencyContact.trim(),
        });

        console.log('✅ [FRONTEND] Delivery Partner application response:', response);

        setSubmittedDeliveryData({
          name,
          email,
          phone,
          vehicleType: form.vehicleType,
          vehicleNumber: form.vehicleNumber.trim().toUpperCase(),
          drivingLicenseNumber: form.drivingLicenseNumber.trim().toUpperCase(),
          deliveryCity: form.deliveryCity.trim(),
        });

        setSuccess(
          response?.message ||
            'Your Delivery Partner application is awaiting Admin approval. Your account will be activated once verified.'
        );
        toast.info('Delivery Partner application submitted! Awaiting administrator approval.');
      } catch (err) {
        console.error('❌ [FRONTEND] Delivery registration error:', err);
        setError(
          err?.response?.data?.message || err?.message || 'Delivery Partner registration failed.'
        );
      } finally {
        setBusy(false);
      }
      return;
    }

    // ==========================================
    // 2. CUSTOMER REGISTRATION
    // ==========================================
    try {
      console.log('📤 [FRONTEND] Submitting customer registration data...', {
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

      console.log('========================================================');
      console.log('🎉 [FRONTEND CONSOLE] NEW USER REGISTERED FROM BACKEND!');
      console.log('👤 Name:       ', response?.user?.name || name);
      console.log('📧 Email:      ', response?.user?.email || email);
      console.log('📞 Phone:      ', response?.user?.phone || phone || 'Not provided');
      console.log('👑 Role:       ', response?.user?.role || 'user');
      console.log('🆔 Mongo ID:   ', response?.user?._id || response?.user?.id);
      console.log('========================================================');

      setSuccess(`Account created successfully for ${response?.user?.name || name}!`);
      toast.success(`Welcome, ${response?.user?.name || name}! Registration successful.`);

      setTimeout(() => {
        navigate(redirectUrl);
      }, 1200);
    } catch (err) {
      console.error('❌ [FRONTEND] Registration error received from backend:', err);
      setError(err?.response?.data?.message || err.message || 'Registration failed. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  // ==========================================
  // VIEW: DELIVERY APPLICATION SUBMITTED CARD
  // ==========================================
  if (submittedDeliveryData) {
    return (
      <div className="register-page">
        <div
          className="register-card"
          style={{ maxWidth: '580px', border: '1px solid rgba(245, 158, 11, 0.4)' }}
        >
          <div className="register-submitted-card">
            <div className="register-submitted-icon">
              <Clock size={34} />
            </div>

            <div className="register-submitted-badge">
              <Clock size={14} /> Pending Administrator Verification
            </div>

            <h1 style={{ fontSize: '1.6rem', marginBottom: '0.5rem', color: '#f8fafc' }}>
              Application Awaiting Approval
            </h1>
            <p
              style={{
                color: '#cbd5e1',
                fontSize: '0.9rem',
                lineHeight: 1.6,
                margin: '0 auto 1.25rem',
              }}
            >
              <strong>Your Delivery Partner application is awaiting Admin approval.</strong> Our operations team
              verifies driver identities, driving license, and vehicle registration before activating delivery access.
            </p>

            {/* Application Summary Box */}
            <div className="register-submitted-details">
              <div>
                <span
                  style={{
                    color: '#94a3b8',
                    display: 'block',
                    fontSize: '0.72rem',
                    textTransform: 'uppercase',
                    fontWeight: 600,
                  }}
                >
                  Applicant Name
                </span>
                <strong style={{ color: '#f8fafc' }}>{submittedDeliveryData.name}</strong>
              </div>

              <div>
                <span
                  style={{
                    color: '#94a3b8',
                    display: 'block',
                    fontSize: '0.72rem',
                    textTransform: 'uppercase',
                    fontWeight: 600,
                  }}
                >
                  Contact Email
                </span>
                <span style={{ color: '#e2e8f0' }}>{submittedDeliveryData.email}</span>
              </div>

              <div>
                <span
                  style={{
                    color: '#94a3b8',
                    display: 'block',
                    fontSize: '0.72rem',
                    textTransform: 'uppercase',
                    fontWeight: 600,
                  }}
                >
                  Mobile Phone
                </span>
                <span style={{ color: '#e2e8f0' }}>{submittedDeliveryData.phone}</span>
              </div>

              <div>
                <span
                  style={{
                    color: '#94a3b8',
                    display: 'block',
                    fontSize: '0.72rem',
                    textTransform: 'uppercase',
                    fontWeight: 600,
                  }}
                >
                  Vehicle
                </span>
                <span style={{ color: '#38bdf8', fontWeight: 600, textTransform: 'capitalize' }}>
                  {submittedDeliveryData.vehicleType} ({submittedDeliveryData.vehicleNumber})
                </span>
              </div>

              <div>
                <span
                  style={{
                    color: '#94a3b8',
                    display: 'block',
                    fontSize: '0.72rem',
                    textTransform: 'uppercase',
                    fontWeight: 600,
                  }}
                >
                  Driving License
                </span>
                <span style={{ color: '#f59e0b', fontWeight: 600 }}>
                  {submittedDeliveryData.drivingLicenseNumber}
                </span>
              </div>

              <div>
                <span
                  style={{
                    color: '#94a3b8',
                    display: 'block',
                    fontSize: '0.72rem',
                    textTransform: 'uppercase',
                    fontWeight: 600,
                  }}
                >
                  Operating City
                </span>
                <span style={{ color: '#e2e8f0' }}>{submittedDeliveryData.deliveryCity}</span>
              </div>
            </div>

            <div
              style={{
                background: 'rgba(56, 189, 248, 0.08)',
                border: '1px solid rgba(56, 189, 248, 0.25)',
                borderRadius: '10px',
                padding: '0.85rem 1rem',
                fontSize: '0.82rem',
                color: '#bae6fd',
                textAlign: 'left',
                lineHeight: 1.5,
              }}
            >
              ℹ️ <strong>What happens next?</strong> The administrator will review your application in the Admin
              Dashboard. Once approved, you can log in to access the Delivery Partner Dashboard and accept order
              assignments.
            </div>

            <div className="register-submitted-actions">
              <Link
                to="/delivery/login"
                className="register-button"
                style={{ textAlign: 'center', textDecoration: 'none' }}
              >
                Go to Delivery Partner Login <ArrowRight size={18} />
              </Link>
              <Link
                to="/"
                style={{
                  color: '#94a3b8',
                  fontSize: '0.85rem',
                  textDecoration: 'none',
                  padding: '6px',
                }}
              >
                Back to Appsica Store
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // VIEW: REGISTRATION FORM
  // ==========================================
  return (
    <div className="register-page">
      <div
        className="register-card"
        style={{ maxWidth: accountType === 'delivery' ? '560px' : '490px' }}
      >
        {/* Role Selector Tabs */}
        <div className="register-role-tabs">
          <button
            type="button"
            className={`register-role-tab ${accountType === 'customer' ? 'active' : ''}`}
            onClick={() => {
              setAccountType('customer');
              setError('');
              setSuccess('');
            }}
          >
            <User size={15} /> Customer
          </button>

          <button
            type="button"
            className={`register-role-tab ${accountType === 'delivery' ? 'active-delivery' : ''}`}
            onClick={() => {
              setAccountType('delivery');
              setError('');
              setSuccess('');
            }}
          >
            <Bike size={15} /> Delivery Partner
          </button>

          <Link
            to="/vendor/register"
            className="register-role-tab"
            title="Become a Seller"
          >
            <Store size={15} /> Seller Store
          </Link>
        </div>

        <div className="register-heading">
          <div
            className="register-logo"
            style={{
              color: accountType === 'delivery' ? '#38bdf8' : '#c3bfff',
              background:
                accountType === 'delivery'
                  ? 'rgba(56, 189, 248, 0.16)'
                  : 'rgba(99, 102, 241, 0.16)',
            }}
          >
            {accountType === 'delivery' ? <Bike size={28} /> : <User size={28} />}
          </div>

          <h1>{accountType === 'delivery' ? 'Delivery Partner Registration' : 'Create Account'}</h1>
          <p>
            {accountType === 'delivery'
              ? 'Join our delivery fleet, earn competitive payouts, and deliver with flexibility.'
              : 'Sign up to get started with your account.'}
          </p>

          {accountType === 'delivery' && (
            <div
              style={{
                marginTop: '1rem',
                background: 'rgba(245, 158, 11, 0.12)',
                border: '1px solid rgba(245, 158, 11, 0.3)',
                borderRadius: 8,
                padding: '0.65rem 0.9rem',
                color: '#fbbf24',
                fontSize: '0.82rem',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                textAlign: 'left',
              }}
            >
              <Clock size={16} style={{ flexShrink: 0 }} />
              <span>
                <strong>Admin Approval Required:</strong> All Delivery Partner accounts must be approved by
                the administrator before activation.
              </span>
            </div>
          )}

          {accountType === 'customer' && redirectUrl && redirectUrl !== '/' && (
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
                placeholder={
                  accountType === 'delivery'
                    ? 'Enter your legal full name'
                    : 'Enter your full name'
                }
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
            <label htmlFor="phone">
              Mobile Phone Number {accountType === 'delivery' ? '*' : '(Optional)'}
            </label>
            <div className="register-input-wrap">
              <Phone size={18} />
              <input
                id="phone"
                type="tel"
                name="phone"
                placeholder="e.g. 9876543210"
                value={form.phone}
                onChange={handleChange}
                autoComplete="tel"
                required={accountType === 'delivery'}
              />
            </div>
          </div>

          {/* DELIVERY PARTNER SPECIFIC FIELDS */}
          {accountType === 'delivery' && (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="register-field">
                  <label htmlFor="vehicleType">Vehicle Type *</label>
                  <select
                    id="vehicleType"
                    name="vehicleType"
                    value={form.vehicleType}
                    onChange={handleChange}
                    required
                  >
                    <option value="bike">Motorcycle / Bike</option>
                    <option value="scooter">Scooter</option>
                    <option value="ev">Electric Vehicle (EV)</option>
                    <option value="van">Delivery Van</option>
                    <option value="car">Car</option>
                    <option value="bicycle">Bicycle</option>
                  </select>
                </div>

                <div className="register-field">
                  <label htmlFor="deliveryCity">Operating City *</label>
                  <input
                    id="deliveryCity"
                    type="text"
                    name="deliveryCity"
                    placeholder="e.g. Mumbai, Delhi"
                    value={form.deliveryCity}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="register-field">
                <label htmlFor="vehicleNumber">Vehicle Registration Number *</label>
                <div className="register-input-wrap">
                  <Truck size={18} />
                  <input
                    id="vehicleNumber"
                    type="text"
                    name="vehicleNumber"
                    placeholder="e.g. MH02AB1234"
                    value={form.vehicleNumber}
                    onChange={handleChange}
                    style={{ textTransform: 'uppercase' }}
                    required
                  />
                </div>
              </div>

              <div className="register-field">
                <label htmlFor="drivingLicenseNumber">Driving License Number *</label>
                <div className="register-input-wrap">
                  <FileText size={18} />
                  <input
                    id="drivingLicenseNumber"
                    type="text"
                    name="drivingLicenseNumber"
                    placeholder="e.g. DL-1420110012345"
                    value={form.drivingLicenseNumber}
                    onChange={handleChange}
                    style={{ textTransform: 'uppercase' }}
                    required
                  />
                </div>
              </div>

              <div className="register-field">
                <label htmlFor="emergencyContact">Emergency Contact (Optional)</label>
                <div className="register-input-wrap">
                  <Phone size={18} />
                  <input
                    id="emergencyContact"
                    type="tel"
                    name="emergencyContact"
                    placeholder="e.g. Family member phone"
                    value={form.emergencyContact}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </>
          )}

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
            style={
              accountType === 'delivery'
                ? {
                    background: '#0284c7',
                    boxShadow: '0 8px 24px rgba(2, 132, 199, 0.35)',
                  }
                : undefined
            }
          >
            {busy
              ? accountType === 'delivery'
                ? 'Submitting Application...'
                : 'Creating account...'
              : accountType === 'delivery'
              ? 'Submit Delivery Partner Application'
              : 'Create Account'}
            {!busy && <ArrowRight size={18} />}
          </button>
        </form>

        <p className="register-login">
          Already have an account?{' '}
          <Link
            to={
              accountType === 'delivery'
                ? '/delivery/login'
                : redirectUrl && redirectUrl !== '/'
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
