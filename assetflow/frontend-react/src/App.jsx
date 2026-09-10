import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { canAccess } from './utils/rbac';
import { AppShell } from './components/Shell';
import { LandingPage, LoginPage, RecoveryPage, OtpPage, ResetPasswordPage, NotFoundPage, DashboardPage, AssetsPage, AllocationPage, BookingPage, MaintenancePage, AuditPage, ReportsPage, NotificationsPage, OrgSetupPage, ProfilePage, SettingsPage } from './pages/Pages';

function Protected({ page, title, children }) {
  const { isAuthenticated, user } = useAuth();
  const location = useLocation();
  if (!isAuthenticated) return <Navigate to="/login" state={{ from: location }} replace />;
  if (page && !canAccess(user?.role, page)) return <Navigate to="/dashboard" replace />;
  return <AppShell title={title}>{children}</AppShell>;
}

export default function App() {
  return <Routes>
    <Route path="/" element={<LandingPage />} />
    <Route path="/login" element={<LoginPage />} />
    <Route path="/forgot-password" element={<RecoveryPage />} />
    <Route path="/otp-verification" element={<OtpPage />} />
    <Route path="/reset-password" element={<ResetPasswordPage />} />
    <Route path="/dashboard" element={<Protected page="dashboard" title="Dashboard"><DashboardPage /></Protected>} />
    <Route path="/org-setup" element={<Protected page="org-setup" title="Organization Setup"><OrgSetupPage /></Protected>} />
    <Route path="/assets" element={<Protected page="assets" title="Asset Management"><AssetsPage /></Protected>} />
    <Route path="/allocation" element={<Protected page="allocation" title="Allocation & Transfer"><AllocationPage /></Protected>} />
    <Route path="/booking" element={<Protected page="booking" title="Resource Booking"><BookingPage /></Protected>} />
    <Route path="/maintenance" element={<Protected page="maintenance" title="Maintenance"><MaintenancePage /></Protected>} />
    <Route path="/audit" element={<Protected page="audit" title="Audit"><AuditPage /></Protected>} />
    <Route path="/reports" element={<Protected page="reports" title="Reports"><ReportsPage /></Protected>} />
    <Route path="/notifications" element={<Protected page="notifications" title="Notifications"><NotificationsPage /></Protected>} />
    <Route path="/profile" element={<Protected page="profile" title="Profile"><ProfilePage /></Protected>} />
    <Route path="/settings" element={<Protected page="settings" title="Settings"><SettingsPage /></Protected>} />
    <Route path="*" element={<NotFoundPage />} />
  </Routes>;
}
