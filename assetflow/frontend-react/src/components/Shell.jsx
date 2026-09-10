import { NavLink, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { canAccess } from '../utils/rbac';

const menuItems = [
  ['Dashboard', 'dashboard', 'fa-gauge'], ['Organization Setup', 'org-setup', 'fa-sitemap'], ['Asset Management', 'assets', 'fa-boxes-stacked'], ['Allocation & Transfer', 'allocation', 'fa-right-left'], ['Resource Booking', 'booking', 'fa-calendar-check'], ['Maintenance', 'maintenance', 'fa-screwdriver-wrench'], ['Audit', 'audit', 'fa-clipboard-check'], ['Reports', 'reports', 'fa-chart-pie'], ['Notifications', 'notifications', 'fa-bell'], ['Profile', 'profile', 'fa-user-gear'], ['Settings', 'settings', 'fa-sliders']
];

function initials(name = 'User') { return name.trim().split(/\s+/).map((part) => part[0]).join('').slice(0, 2).toUpperCase(); }

export function Loader({ show }) { return show ? <div className="loader-wrapper"><span className="loader" /></div> : null; }

export function AppShell({ children, title }) {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const role = user?.role || 'Employee';

  useEffect(() => { document.documentElement.setAttribute('data-theme', theme); localStorage.setItem('theme', theme); }, [theme]);

  const logout = () => { signOut(); navigate('/login'); };
  return <div className="app-wrapper">
    <aside className={`sidebar ${sidebarOpen ? 'active' : ''}`}>
      <div className="sidebar-brand"><NavLink to="/dashboard" className="text-decoration-none d-flex align-items-center"><i className="fa-solid fa-cube text-primary fs-3 me-2" /><span className="fs-4 fw-bold text-dark-custom">AssetFlow</span></NavLink></div>
      <ul className="sidebar-menu">{menuItems.filter(([, path]) => canAccess(role, path)).map(([label, path, icon]) => <li className="sidebar-item" key={path}><NavLink to={`/${path}`} className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`} onClick={() => setSidebarOpen(false)}><i className={`fa-solid ${icon}`} /><span>{role === 'Department Head' && path === 'assets' ? 'Department Assets' : role === 'Employee' && path === 'assets' ? 'My Assets' : label}</span></NavLink></li>)}</ul>
      <div className="sidebar-footer"><div className="d-flex align-items-center"><div className="bg-primary text-white rounded-circle me-3" style={{ width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600 }}>{initials(user?.name || user?.fullName)}</div><div className="overflow-hidden"><h6 className="mb-0 text-truncate">{user?.name || user?.fullName || 'User'}</h6><small className="text-muted text-truncate d-block">{role}</small></div><button className="btn btn-link ms-auto text-danger fs-5 p-0" onClick={logout} title="Log Out"><i className="fa-solid fa-right-from-bracket" /></button></div></div>
    </aside>
    <main className="main-content">
      <nav className="navbar-custom px-4 justify-content-between"><div className="d-flex align-items-center"><button className="navbar-toggler-custom me-3" onClick={() => setSidebarOpen((open) => !open)}><i className="fa-solid fa-bars" /></button><nav aria-label="breadcrumb"><ol className="breadcrumb-custom mb-0"><li className="breadcrumb-item-custom"><NavLink to="/dashboard">Home</NavLink></li><li className="breadcrumb-item-custom active">{title}</li></ol></nav></div><div className="d-flex align-items-center gap-3"><button className="btn btn-icon btn-secondary-custom rounded-circle p-2" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} title="Toggle Theme"><i className={`fa-solid ${theme === 'dark' ? 'fa-sun' : 'fa-moon'}`} /></button><NavLink to="/notifications" className="btn btn-icon btn-secondary-custom rounded-circle p-2" title="Notifications"><i className="fa-solid fa-bell" /></NavLink><NavLink to="/profile" className="btn p-0 border-0"><div className="bg-primary text-white rounded-circle" style={{ width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600 }}>{initials(user?.name || user?.fullName)}</div></NavLink></div></nav>
      {children}
      <footer><div className="container-fluid"><span>&copy; 2026 <strong>AssetFlow</strong>. All rights reserved.</span></div></footer>
    </main>
  </div>;
}

export function Page({ title, subtitle, actions, children }) { return <div className="container-fluid p-4"><div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2"><div><h2 className="fw-bold mb-0">{title}</h2>{subtitle && <p className="text-muted mb-0">{subtitle}</p>}</div>{actions && <div className="d-flex gap-2">{actions}</div>}</div>{children}</div>; }
export function Section({ children, className = '' }) { return <div className={`card-custom ${className}`}>{children}</div>; }
export function StatusBadge({ value }) { const tone = value === 'Approved' || value === 'Active' || value === 'Confirmed' || value === 'Completed' || value === 'Resolved' ? 'bg-success' : value === 'Rejected' || value === 'Cancelled' ? 'bg-danger' : 'bg-warning text-dark'; return <span className={`badge ${tone} rounded-pill px-2.5 py-1`}>{value || 'Unknown'}</span>; }
export function DataTable({ columns, rows, empty = 'No records found.' }) { return <div className="table-custom-wrapper"><table className="table-custom"><thead><tr>{columns.map((column) => <th key={column}>{column}</th>)}</tr></thead><tbody>{rows.length ? rows : <tr><td colSpan={columns.length} className="text-center text-muted py-5">{empty}</td></tr>}</tbody></table></div>; }
export function ErrorState({ error }) { return error ? <div className="alert alert-danger">{error.message || String(error)}</div> : null; }
