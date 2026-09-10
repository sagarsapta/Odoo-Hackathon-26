import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { dataService } from '../../services/dataService';

export function ResetPassPage() {
  const [form, setForm] = useState({
    email: localStorage.getItem('verification_email') || '',
    otp: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();

  const update = (key, val) => setForm((prev) => ({ ...prev, [key]: val }));

  const submit = async (e) => {
    e.preventDefault();
    if (form.newPassword !== form.confirmPassword) {
      return Swal.fire('Mismatch', 'Passwords do not match.', 'warning');
    }
    if (form.newPassword.length < 8) {
      return Swal.fire('Weak Password', 'Password must be at least 8 characters.', 'warning');
    }

    setBusy(true);
    try {
      await dataService.auth.resetPassword(form.email, form.otp, form.newPassword);
      await Swal.fire({
        title: 'Password Updated!',
        text: 'Your password was successfully reset. You may now sign in.',
        icon: 'success',
        confirmButtonColor: '#2563EB'
      });
      navigate('/login');
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
          <h4 className="fw-bold mb-1" style={{ color: 'var(--text-color)' }}>Reset Password</h4>
          <p className="text-muted small">Choose a strong new password for your account</p>
        </div>

        <form onSubmit={submit}>
          <div className="mb-3">
            <label className="form-label-custom">Email Address</label>
            <input
              type="email"
              className="form-control form-control-custom"
              value={form.email}
              onChange={(e) => update('email', e.target.value)}
              required
            />
          </div>

          <div className="mb-3">
            <label className="form-label-custom">Verification Code / OTP</label>
            <input
              type="text"
              className="form-control form-control-custom"
              placeholder="e.g. 123456"
              value={form.otp}
              onChange={(e) => update('otp', e.target.value)}
              required
            />
          </div>

          <div className="mb-3">
            <label className="form-label-custom">New Password</label>
            <input
              type="password"
              className="form-control form-control-custom"
              placeholder="Min. 8 characters"
              value={form.newPassword}
              onChange={(e) => update('newPassword', e.target.value)}
              required
            />
          </div>

          <div className="mb-3">
            <label className="form-label-custom">Confirm New Password</label>
            <input
              type="password"
              className="form-control form-control-custom"
              placeholder="Re-enter password"
              value={form.confirmPassword}
              onChange={(e) => update('confirmPassword', e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary-custom w-100 py-2.5 text-white fw-semibold mb-2"
            disabled={busy}
          >
            {busy ? 'Updating...' : 'Update Password'}
          </button>

          <Link to="/login" className="btn btn-secondary-custom w-100 py-2">
            Back to Sign In
          </Link>
        </form>
      </div>
    </div>
  );
}
