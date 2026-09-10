import React from 'react';
import { Link } from 'react-router-dom';
import heroImage from '../../assets/images/hero-diagram.jpg';

export function LandingPage() {
  const modules = [
    { name: 'Asset Tracking', icon: 'fa-boxes-stacked', text: 'Monitor location, value, ownership, serial numbers, and lifecycle of equipment.' },
    { name: 'Resource Booking', icon: 'fa-calendar-check', text: 'Allow teams to book shared resources with conflict prevention.' },
    { name: 'Maintenance Logs', icon: 'fa-screwdriver-wrench', text: 'Schedule maintenance, routine tune-ups, and track repair expenses.' },
    { name: 'Compliance Auditing', icon: 'fa-clipboard-check', text: 'Conduct hardware verification and track compliance progress.' },
    { name: 'Asset Allocations', icon: 'fa-right-left', text: 'Track assignments, loans, and team-to-team asset transfers with approvals.' },
    { name: 'Analytics & Reports', icon: 'fa-chart-pie', text: 'Monitor valuation, department distribution, utilization, and operational KPIs.' }
  ];

  const stats = [
    { value: '99.9%', label: 'Service Uptime' },
    { value: '40%', label: 'Reduced Asset Waste' },
    { value: '10k+', label: 'Managed Assets' },
    { value: '150+', label: 'Global Enterprises' }
  ];

  return (
    <div className="min-vh-100 d-flex flex-column" style={{ backgroundColor: 'var(--bg-color)', color: 'var(--text-color)' }}>
      {/* Top Navbar */}
      <nav className="navbar navbar-expand-lg border-bottom py-3 sticky-top" style={{ backgroundColor: 'var(--card-bg)' }}>
        <div className="container">
          <Link className="navbar-brand d-flex align-items-center text-decoration-none" to="/">
            <i className="fa-solid fa-cube text-primary fs-3 me-2"></i>
            <span className="fs-4 fw-bold" style={{ color: 'var(--text-color)' }}>AssetFlow</span>
          </Link>
          <div className="d-flex align-items-center gap-3 ms-auto">
            <a className="nav-link fw-semibold d-none d-md-block" href="#features" style={{ color: 'var(--text-muted)' }}>
              Features
            </a>
            <a className="nav-link fw-semibold d-none d-md-block" href="#stats" style={{ color: 'var(--text-muted)' }}>
              Impact
            </a>
            <Link className="btn btn-secondary-custom px-3 py-2" to="/login">
              Sign In
            </Link>
            <Link className="btn btn-primary-custom px-3 py-2 text-white" to="/login">
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-5 my-auto">
        <div className="container py-lg-4">
          <div className="row align-items-center g-5">
            <div className="col-lg-6 text-center text-lg-start">
              <span className="badge bg-primary-subtle text-primary rounded-pill px-3 py-1.5 fw-bold mb-3 fs-8">
                Enterprise Resource Management ERP
              </span>
              <h1 className="display-4 fw-bold mb-4" style={{ lineHeight: 1.2, color: 'var(--text-color)' }}>
                Streamline Enterprise <span className="text-primary">Assets & Resources</span> effortlessly.
              </h1>
              <p className="lead text-muted mb-4">
                Track hardware inventory, manage software compliance, book meeting rooms, schedule maintenance, and coordinate audits. All in one unified platform.
              </p>
              <div className="d-flex gap-3 justify-content-center justify-content-lg-start flex-wrap">
                <Link to="/login" className="btn btn-primary-custom px-4 py-2.5 text-white fs-6">
                  <i className="fa-solid fa-arrow-right-to-bracket me-2"></i>Access Workspace
                </Link>
                <a href="#features" className="btn btn-secondary-custom px-4 py-2.5 fs-6">
                  Explore Features
                </a>
              </div>
            </div>
            <div className="col-lg-6 text-center">
              <img
                src={heroImage}
                alt="AssetFlow Enterprise Resource ERP Diagram"
                className="img-fluid rounded-4 shadow-lg border"
                style={{ maxHeight: 420, objectFit: 'cover' }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-5 border-top" style={{ backgroundColor: 'var(--sidebar-hover)' }}>
        <div className="container py-4">
          <div className="text-center mx-auto mb-5" style={{ maxWidth: 650 }}>
            <h2 className="fw-bold mb-3" style={{ color: 'var(--text-color)' }}>Enterprise-Grade Modules</h2>
            <p className="text-muted">Take complete control over your resource lifecycle, from requisition to disposal.</p>
          </div>
          <div className="row g-4">
            {modules.map((m) => (
              <div className="col-md-4" key={m.name}>
                <div className="card-custom h-100 p-4 mb-0">
                  <div className="bg-primary-subtle text-primary rounded-3 p-3 mb-4 d-inline-block" style={{ width: 56, height: 56, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <i className={`fa-solid ${m.icon} fs-4`}></i>
                  </div>
                  <h5 className="fw-bold mb-2" style={{ color: 'var(--text-color)' }}>{m.name}</h5>
                  <p className="text-muted mb-0 small">{m.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section id="stats" className="py-5 border-top">
        <div className="container py-4">
          <div className="row g-4 text-center">
            {stats.map((s) => (
              <div className="col-md-3 col-6" key={s.label}>
                <div className="card-custom p-4 mb-0">
                  <h2 className="fw-bold text-primary mb-1">{s.value}</h2>
                  <div className="text-muted small fw-medium">{s.label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto py-4 border-top" style={{ backgroundColor: 'var(--card-bg)' }}>
        <div className="container text-center text-muted small">
          &copy; 2026 <strong>AssetFlow</strong>. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
