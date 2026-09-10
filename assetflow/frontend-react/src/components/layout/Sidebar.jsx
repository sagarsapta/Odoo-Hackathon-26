import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { canAccess } from '../../utils/rbac';

const menuItems = [
  { name: 'Dashboard', path: 'dashboard', icon: 'fa-gauge' },
  { name: 'Organization Setup', path: 'org-setup', icon: 'fa-sitemap' },
  { name: 'Asset Management', path: 'assets', icon: 'fa-boxes-stacked' },
  { name: 'Allocation & Transfer', path: 'allocation', icon: 'fa-right-left' },
  { name: 'Resource Booking', path: 'booking', icon: 'fa-calendar-check' },
  { name: 'Maintenance', path: 'maintenance', icon: 'fa-screwdriver-wrench' },
  { name: 'Audit', path: 'audit', icon: 'fa-clipboard-check' },
  { name: 'Reports', path: 'reports', icon: 'fa-chart-pie' },
  { name: 'Notifications', path: 'notifications', icon: 'fa-bell' },
  { name: 'Profile', path: 'profile', icon: 'fa-user-gear' },
  { name: 'Settings', path: 'settings', icon: 'fa-sliders' }
];

function getUserInitials(name) {
  if (!name) return 'U';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function Sidebar({ isOpen, onClose }) {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const role = user?.role || 'Employee';
  const name = user?.fullName || user?.name || 'Rahul Sharma';

  const handleLogout = (e) => {
    e.preventDefault();
    signOut();
    navigate('/login');
  };

  return (
    <>
      {isOpen && (
        <div
          className="d-lg-none position-fixed top-0 start-0 w-100 h-100"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 999 }}
          onClick={onClose}
        />
      )}
      <aside className={`sidebar ${isOpen ? 'active' : ''}`}>
        <div className="sidebar-brand">
          <NavLink to="/dashboard" className="text-decoration-none d-flex align-items-center" onClick={onClose}>
            <i className="fa-solid fa-cube text-primary fs-3 me-2"></i>
            <span className="fs-4 fw-bold" style={{ color: 'var(--text-color)' }}>
              AssetFlow
            </span>
          </NavLink>
        </div>

        <ul className="sidebar-menu">
          {menuItems.map((item) => {
            if (!canAccess(role, item.path)) return null;

            // Role-specific display name matching original frontend
            let displayName = item.name;
            if (role === 'Department Head' || role === 'DepartmentHead') {
              if (item.path === 'assets') displayName = 'Department Assets';
              if (item.path === 'allocation') displayName = 'Allocation Requests';
              if (item.path === 'reports') displayName = 'Department Reports';
            } else if (role === 'Employee') {
              if (item.path === 'assets') displayName = 'My Assets';
              if (item.path === 'maintenance') displayName = 'Maintenance Requests';
            }

            return (
              <li className="sidebar-item" key={item.path}>
                <NavLink
                  to={`/${item.path}`}
                  className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
                  onClick={onClose}
                >
                  <i className={`fa-solid ${item.icon}`}></i>
                  <span>{displayName}</span>
                </NavLink>
              </li>
            );
          })}
        </ul>

        <div className="sidebar-footer">
          <div className="d-flex align-items-center">
            <div className="position-relative me-3">
              <div
                className="bg-primary text-white rounded-circle"
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
              <span
                className="position-absolute bottom-0 end-0 bg-success border border-white rounded-circle p-1"
                style={{ width: 8, height: 8 }}
              ></span>
            </div>
            <div className="overflow-hidden">
              <h6 className="mb-0 text-truncate font-weight-bold" style={{ color: 'var(--text-color)' }}>
                {name}
              </h6>
              <small className="text-muted text-truncate d-block">{role}</small>
            </div>
            <button
              className="btn btn-link ms-auto text-danger fs-5 p-0 border-0 text-decoration-none"
              onClick={handleLogout}
              title="Log Out"
            >
              <i className="fa-solid fa-right-from-bracket"></i>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
