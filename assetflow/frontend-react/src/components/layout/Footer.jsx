import React from 'react';

export function Footer() {
  return (
    <footer>
      <div className="container-fluid">
        <div className="row align-items-center">
          <div className="col-md-6 text-md-start mb-2 mb-md-0">
            <span>&copy; 2026 <strong>AssetFlow</strong>. All rights reserved.</span>
          </div>
          <div className="col-md-6 text-md-end">
            <a href="#terms" className="text-muted text-decoration-none me-3 small">Terms of Service</a>
            <a href="#privacy" className="text-muted text-decoration-none small">Privacy Policy</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
