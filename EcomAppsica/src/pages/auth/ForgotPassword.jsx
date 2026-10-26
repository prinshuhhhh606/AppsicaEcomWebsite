import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { authService } from '../../services/authService';

function readableError(error, fallback) {
  return error?.response?.data?.message || error?.message || fallback;
}

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError('');
    setMessage('');
    try {
      await authService.forgotPassword(email);
      setMessage('If an account exists for that email, password reset instructions have been sent.');
    } catch (requestError) {
      setError(readableError(requestError, 'We could not request a password reset.'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="container store-page auth-page single-auth">
      <div className="auth-panel">
        <span className="eyebrow">ACCOUNT HELP</span>
        <h1>Reset password</h1>
        <p>We’ll send reset instructions to your email address.</p>
        <form className="store-form" onSubmit={submit}>
          <label className="form-group">
            <span className="form-label">Email address</span>
            <input
              className="form-input"
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </label>
          {error && <div className="form-alert">{error}</div>}
          {message && <div className="form-success">{message}</div>}
          <button className="btn btn-primary btn-full btn-lg" disabled={busy}>
            {busy ? 'Sending…' : 'Send reset instructions'}
          </button>
        </form>
        <p className="auth-switch">
          <Link to="/login">Back to sign in</Link>
        </p>
      </div>
    </div>
  );
}
