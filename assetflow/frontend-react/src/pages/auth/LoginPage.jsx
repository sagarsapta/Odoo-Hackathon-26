import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { useAuth } from '../../context/AuthContext';
import { dataService } from '../../services/dataService';

export function LoginPage() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '', role: '' });
  const [busy, setBusy] = useState(false);

  const update = (key, val) => {
    setForm((prev) => ({ ...prev, [key]: val }));
  };

  const handleDemoFill = (role, email) => {
    setForm({
      role,
      email,
      password: 'Password123!'
    });
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!form.role) {
      return Swal.fire('Role Required', 'Please select your role from the dropdown.', 'warning');
    }
    if (!form.email || !form.password) {
      return Swal.fire('Missing Fields', 'Please provide email and password.', 'warning');
    }

    setBusy(true);
    try {
      const data = await dataService.auth.login(form);
      signIn(data);
      navigate('/dashboard');
    } catch (err) {
      Swal.fire({
        title: 'Sign In Failed',
        text: err.message || 'Unable to log in. Please check credentials.',
        icon: 'error',
        confirmButtonColor: '#2563EB'
      });
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
          <h4 className="fw-bold mb-1" style={{ color: 'var(--text-color)' }}>Welcome Back!</h4>
          <p className="text-muted small">Sign in to your enterprise workspace</p>
        </div>

        {/* Quick Demo Credentials Autofill Helper */}
        <div className="mb-3 p-2 rounded-3 border bg-body-tertiary">
          <div className="d-flex justify-content-between align-items-center mb-1.5">
            <span className="fs-8 fw-bold text-muted text-uppercase">⚡ Quick Demo Login</span>
            <span className="badge bg-primary-subtle text-primary fs-8">1-Click Fill</span>
          </div>
          <div className="d-flex flex-wrap gap-1.5">
            <button
              type="button"
              className="btn btn-outline-secondary btn-sm py-0 px-2 fs-8"
              onClick={() => handleDemoFill('Admin', 'admin@assetflow.com')}
            >
              Admin
            </button>
            <button
              type="button"
              className="btn btn-outline-secondary btn-sm py-0 px-2 fs-8"
              onClick={() => handleDemoFill('Asset Manager', 'assetmanager@assetflow.com')}
            >
              Asset Mgr
            </button>
            <button
              type="button"
              className="btn btn-outline-secondary btn-sm py-0 px-2 fs-8"
              onClick={() => handleDemoFill('Department Head', 'it.head@assetflow.com')}
            >
              Dept Head
            </button>
            <button
              type="button"
              className="btn btn-outline-secondary btn-sm py-0 px-2 fs-8"
              onClick={() => handleDemoFill('Employee', 'employee.it@assetflow.com')}
            >
              Employee
            </button>
          </div>
        </div>

        <form onSubmit={submit} noValidate>
          <div className="mb-3">
            <label className="form-label-custom">Select Role <span className="text-danger">*</span></label>
            <select
              className="form-select form-control-custom"
              value={form.role}
              onChange={(e) => update('role', e.target.value)}
              required
            >
              <option value="">Choose your role...</option>
              <option value="Admin">Admin</option>
              <option value="Asset Manager">Asset Manager</option>
              <option value="Department Head">Department Head</option>
              <option value="Employee">Employee</option>
            </select>
          </div>

          <div className="mb-3">
            <label className="form-label-custom">Email Address <span className="text-danger">*</span></label>
            <input
              type="email"
              className="form-control form-control-custom"
              placeholder="name@company.com"
              value={form.email}
              onChange={(e) => update('email', e.target.value)}
              required
            />
          </div>

          <div className="mb-3">
            <div className="d-flex justify-content-between align-items-center mb-1">
              <label className="form-label-custom mb-0">Password <span className="text-danger">*</span></label>
              <Link to="/forgot-password" className="small text-primary text-decoration-none">
                Forgot Password?
              </Link>
            </div>
            <input
              type="password"
              className="form-control form-control-custom"
              placeholder="••••••••"
              value={form.password}
              onChange={(e) => update('password', e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary-custom w-100 py-2.5 text-white fw-semibold mt-2"
            disabled={busy}
          >
            {busy ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                Signing In...
              </>
            ) : (
              'Sign In'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
