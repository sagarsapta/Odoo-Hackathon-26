import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { dataService } from '../../services/dataService';

export function OtpPage() {
  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();
  const email = localStorage.getItem('verification_email') || 'your registered email';

  const handleDigitChange = (index, value) => {
    if (value.length > 1) value = value.slice(-1);
    const updated = [...digits];
    updated[index] = value;
    setDigits(updated);

    // Auto-focus next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-input-${index + 1}`);
      if (nextInput) nextInput.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      const prevInput = document.getElementById(`otp-input-${index - 1}`);
      if (prevInput) prevInput.focus();
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    const otp = digits.join('');
    if (otp.length < 6) return Swal.fire('Invalid OTP', 'Please enter all 6 digits.', 'warning');

    setBusy(true);
    try {
      await dataService.auth.verifyOtp(email, otp);
      await Swal.fire({
        title: 'OTP Verified!',
        text: 'Proceeding to password reset.',
        icon: 'success',
        confirmButtonColor: '#2563EB'
      });
      navigate('/reset-password');
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
          <h4 className="fw-bold mb-1" style={{ color: 'var(--text-color)' }}>Verify OTP</h4>
          <p className="text-muted small">
            Enter the 6-digit code dispatched to <strong>{email}</strong>
          </p>
        </div>

        <form onSubmit={submit}>
          <div className="otp-input-container my-4">
            {digits.map((digit, i) => (
              <input
                key={i}
                id={`otp-input-${i}`}
                type="text"
                inputMode="numeric"
                maxLength={1}
                className="otp-digit"
                value={digit}
                onChange={(e) => handleDigitChange(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                required
              />
            ))}
          </div>

          <button
            type="submit"
            className="btn btn-primary-custom w-100 py-2.5 text-white fw-semibold mb-2"
            disabled={busy}
          >
            {busy ? 'Verifying...' : 'Verify Code'}
          </button>

          <button
            type="button"
            className="btn btn-link w-100 text-decoration-none small text-primary"
            onClick={() => {
              dataService.auth.resendOtp(email);
              Swal.fire('Code Sent', 'A fresh code was sent to your email.', 'info');
            }}
          >
            Resend Verification Code
          </button>
        </form>
      </div>
    </div>
  );
}
