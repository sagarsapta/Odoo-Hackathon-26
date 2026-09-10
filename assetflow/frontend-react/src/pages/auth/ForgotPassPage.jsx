import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { dataService } from '../../services/dataService';

export function ForgotPassPage() {
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    if (!email) return Swal.fire('Error', 'Please enter your email.', 'error');

    setBusy(true);
    try {
      await dataService.auth.forgotPassword(email);
      localStorage.setItem('verification_email', email);
      await Swal.fire({
        title: 'Reset Code Sent',
        text: 'A password reset code has been dispatched to your email.',
        icon: 'success',
        confirmButtonColor: '#2563EB'
      });
      navigate('/otp-verification');
    } catch (err) {
      Swal.fire('Error', err.message, 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-card">
        <div className="text-center mb-4">
          <Link to="/" className="text-decoration-none d-inline-flex align-items-center mb-3">
            <i className="fa-solid fa-cube text-primary fs-2 me-2"></i>
            <span className="fs-3 fw-bold" style={{ color: 'var(--text-color)' }}>
              AssetFlow
            </span>
          </Link>
          <h4 className="fw-bold mb-1" style={{ color: 'var(--text-color)' }}>Forgot Password?</h4>
          <p className="text-muted small">Enter your email address to recover your account</p>
        </div>

        <form onSubmit={submit}>
          <div className="mb-3">
            <label className="form-label-custom">Email Address</label>
            <input
              type="email"
              className="form-control form-control-custom"
              placeholder="name@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary-custom w-100 py-2.5 text-white fw-semibold mb-2"
            disabled={busy}
          >
            {busy ? 'Sending Code...' : 'Send Recovery Code'}
          </button>

          <Link to="/login" className="btn btn-secondary-custom w-100 py-2">
            Back to Sign In
          </Link>
        </form>
      </div>
    </div>
  );
}
