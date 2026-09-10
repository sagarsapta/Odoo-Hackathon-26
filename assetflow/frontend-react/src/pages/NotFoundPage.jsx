import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function NotFoundPage() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="auth-wrapper">
      <div className="auth-card text-center py-5">
        <h1 className="display-1 fw-bold text-primary mb-2">404</h1>
        <h3 className="fw-bold mb-3" style={{ color: 'var(--text-color)' }}>Page Not Found</h3>
        <p className="text-muted mb-4">
          The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
        </p>
        <Link
          to={isAuthenticated ? '/dashboard' : '/login'}
          className="btn btn-primary-custom px-4 py-2 text-white"
        >
          <i className="fa-solid fa-house me-2"></i>
          {isAuthenticated ? 'Return to Dashboard' : 'Go to Sign In'}
        </Link>
      </div>
    </div>
  );
}
