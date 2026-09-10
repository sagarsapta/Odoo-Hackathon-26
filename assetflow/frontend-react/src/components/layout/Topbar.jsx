import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { dataService } from '../../services/dataService';
import { DataBadge } from '../ui/DataBadge';

function getUserInitials(name) {
  if (!name) return 'U';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function Topbar({ title, onToggleSidebar }) {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');
  const [notifications, setNotifications] = useState([]);
  const [notifOpen, setNotifOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const name = user?.fullName || user?.name || 'Rahul Sharma';
  const email = user?.email || 'admin@assetflow.com';

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    let alive = true;
    dataService.notifications.list().then((list) => {
      if (alive && Array.isArray(list)) {
        setNotifications(list);
      }
    });
    return () => {
      alive = false;
    };
  }, []);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const handleLogout = () => {
    signOut();
    navigate('/login');
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <nav className="navbar-custom px-4 justify-content-between">
      <div className="d-flex align-items-center">
        <button
          className="navbar-toggler-custom me-3"
          onClick={onToggleSidebar}
          aria-label="Toggle navigation"
        >
          <i className="fa-solid fa-bars"></i>
        </button>

        <div className="d-none d-md-flex align-items-center">
          <nav aria-label="breadcrumb">
            <ol className="breadcrumb-custom mb-0">
              <li className="breadcrumb-item-custom">
                <NavLink to="/dashboard">Home</NavLink>
              </li>
              <li className="breadcrumb-item-custom active" aria-current="page">
                {title || 'Dashboard'}
              </li>
            </ol>
          </nav>
        </div>
      </div>

      <div className="d-flex align-items-center gap-3">
        {/* Quick Search */}
        <div className="position-relative d-none d-md-block" style={{ width: 230 }}>
          <input
            type="text"
            className="form-control-custom w-100 ps-5"
            placeholder="Search assets, resource..."
            onKeyDown={(e) => {
              if (e.key === 'Enter' && e.target.value.trim()) {
                navigate(`/assets?q=${encodeURIComponent(e.target.value.trim())}`);
              }
            }}
          />
          <i
            className="fa-solid fa-magnifying-glass position-absolute text-muted"
            style={{ left: 15, top: 12 }}
          ></i>
        </div>

        {/* Live / Demo Mode Badge */}
        <DataBadge />

        {/* Dark Mode Toggle */}
        <button
          className="btn btn-icon btn-secondary-custom rounded-circle p-2"
          onClick={toggleTheme}
          title="Toggle Theme"
          style={{ width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <i className={`fa-solid ${theme === 'dark' ? 'fa-sun text-warning' : 'fa-moon'}`}></i>
        </button>

        {/* Notifications Dropdown */}
        <div className="position-relative">
          <button
            className="btn btn-icon btn-secondary-custom rounded-circle p-2 position-relative"
            onClick={() => {
              setNotifOpen(!notifOpen);
              setUserMenuOpen(false);
            }}
            title="Notifications"
            style={{ width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <i className="fa-solid fa-bell"></i>
            {unreadCount > 0 && (
              <span
                className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger border border-white"
                style={{ fontSize: '0.65rem' }}
              >
                {unreadCount}
              </span>
            )}
          </button>

          {notifOpen && (
            <div
              className="position-absolute end-0 mt-2 shadow-lg border p-2 bg-white"
              style={{
                width: 320,
                borderRadius: 'var(--border-radius)',
                backgroundColor: 'var(--card-bg)',
                borderColor: 'var(--border-color)',
                zIndex: 1050
              }}
            >
              <div className="d-flex justify-content-between align-items-center px-3 py-2 border-bottom mb-2">
                <h6 className="mb-0 fw-bold" style={{ color: 'var(--text-color)' }}>
                  Notifications
                </h6>
                <NavLink
                  to="/notifications"
                  className="text-primary text-decoration-none small fw-semibold"
                  onClick={() => setNotifOpen(false)}
                >
                  View all
                </NavLink>
              </div>
              <div style={{ maxHeight: 260, overflowY: 'auto' }}>
                {notifications.slice(0, 4).map((n) => (
                  <div
                    key={n.id}
                    className="p-2 border-bottom text-start"
                    style={{ fontSize: '0.85rem', cursor: 'pointer' }}
                    onClick={() => {
                      dataService.notifications.markAsRead(n.id);
                      setNotifications((prev) =>
                        prev.map((item) => (item.id === n.id ? { ...item, read: true } : item))
                      );
                    }}
                  >
                    <div className="d-flex justify-content-between align-items-center mb-1">
                      <strong style={{ color: 'var(--text-color)' }}>{n.title}</strong>
                      {!n.read && <span className="badge bg-primary rounded-circle p-1"></span>}
                    </div>
                    <p className="text-muted mb-1 text-truncate">{n.message}</p>
                    <small className="text-muted fs-8">{n.date}</small>
                  </div>
                ))}
                {notifications.length === 0 && (
                  <div className="text-center text-muted py-3 small">No notifications</div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Profile Dropdown */}
        <div className="position-relative">
          <button
            className="btn p-0 border-0 d-flex align-items-center gap-2"
            type="button"
            onClick={() => {
              setUserMenuOpen(!userMenuOpen);
              setNotifOpen(false);
            }}
          >
            <div
              className="bg-primary text-white rounded-circle shadow-sm"
              style={{
                width: 40,
                height: 40,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 600
              }}
            >
              {getUserInitials(name)}
            </div>
          </button>

          {userMenuOpen && (
            <div
              className="position-absolute end-0 mt-2 shadow-lg border p-2 bg-white"
              style={{
                width: 220,
                borderRadius: 'var(--border-radius)',
                backgroundColor: 'var(--card-bg)',
                borderColor: 'var(--border-color)',
                zIndex: 1050
              }}
            >
              <div className="px-3 py-2 border-bottom mb-2">
                <h6 className="mb-0 fw-bold text-truncate" style={{ color: 'var(--text-color)' }}>
                  {name}
                </h6>
                <small className="text-muted text-truncate d-block">{email}</small>
              </div>
              <NavLink
                to="/profile"
                className="dropdown-item rounded-2 py-2 px-3 d-flex align-items-center"
                style={{ color: 'var(--text-color)' }}
                onClick={() => setUserMenuOpen(false)}
              >
                <i className="fa-solid fa-user me-2 text-muted"></i> My Profile
              </NavLink>
              <NavLink
                to="/settings"
                className="dropdown-item rounded-2 py-2 px-3 d-flex align-items-center"
                style={{ color: 'var(--text-color)' }}
                onClick={() => setUserMenuOpen(false)}
              >
                <i className="fa-solid fa-gear me-2 text-muted"></i> Settings
              </NavLink>
              <hr className="dropdown-divider my-1" />
              <button
                className="dropdown-item text-danger rounded-2 py-2 px-3 d-flex align-items-center border-0 bg-transparent w-100 text-start"
                onClick={handleLogout}
              >
                <i className="fa-solid fa-right-from-bracket me-2"></i> Log Out
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
