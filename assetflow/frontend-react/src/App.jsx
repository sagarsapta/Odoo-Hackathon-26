import React from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { canAccess } from './utils/rbac';
import { AppLayout } from './components/layout/AppLayout';

import { LandingPage } from './pages/auth/LandingPage';
import { LoginPage } from './pages/auth/LoginPage';
import { ForgotPassPage } from './pages/auth/ForgotPassPage';
import { OtpPage } from './pages/auth/OtpPage';
import { ResetPassPage } from './pages/auth/ResetPassPage';
import { NotFoundPage } from './pages/NotFoundPage';

import { DashboardPage } from './pages/DashboardPage';
import { AssetsPage } from './pages/AssetsPage';
import { AllocationPage } from './pages/AllocationPage';
import { BookingPage } from './pages/BookingPage';
import { MaintenancePage } from './pages/MaintenancePage';
import { AuditPage } from './pages/AuditPage';
import { ReportsPage } from './pages/ReportsPage';
import { NotificationsPage } from './pages/NotificationsPage';
import { OrgSetupPage } from './pages/OrgSetupPage';
import { ProfilePage } from './pages/ProfilePage';
import { SettingsPage } from './pages/SettingsPage';

function Protected({ page, title, children }) {
  const { isAuthenticated, user } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (page && !canAccess(user?.role, page)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <AppLayout title={title}>{children}</AppLayout>;
}

export default function App() {
  return (
    <Routes>
      {/* Public / Auth Routes */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/forgot-password" element={<ForgotPassPage />} />
      <Route path="/otp-verification" element={<OtpPage />} />
      <Route path="/reset-password" element={<ResetPassPage />} />

      {/* Protected Enterprise Routes */}
      <Route
        path="/dashboard"
        element={
          <Protected page="dashboard" title="Dashboard">
            <DashboardPage />
          </Protected>
        }
      />
      <Route
        path="/org-setup"
        element={
          <Protected page="org-setup" title="Organization Setup">
            <OrgSetupPage />
          </Protected>
        }
      />
      <Route
        path="/assets"
        element={
          <Protected page="assets" title="Asset Management">
            <AssetsPage />
          </Protected>
        }
      />
      <Route
        path="/allocation"
        element={
          <Protected page="allocation" title="Allocation & Transfer">
            <AllocationPage />
          </Protected>
        }
      />
      <Route
        path="/booking"
        element={
          <Protected page="booking" title="Resource Booking">
            <BookingPage />
          </Protected>
        }
      />
      <Route
        path="/maintenance"
        element={
          <Protected page="maintenance" title="Maintenance Log">
            <MaintenancePage />
          </Protected>
        }
      />
      <Route
        path="/audit"
        element={
          <Protected page="audit" title="Compliance Auditing">
            <AuditPage />
          </Protected>
        }
      />
      <Route
        path="/reports"
        element={
          <Protected page="reports" title="Reports & Analytics">
            <ReportsPage />
          </Protected>
        }
      />
      <Route
        path="/notifications"
        element={
          <Protected page="notifications" title="Notifications">
            <NotificationsPage />
          </Protected>
        }
      />
      <Route
        path="/profile"
        element={
          <Protected page="profile" title="Profile">
            <ProfilePage />
          </Protected>
        }
      />
      <Route
        path="/settings"
        element={
          <Protected page="settings" title="Settings">
            <SettingsPage />
          </Protected>
        }
      />

      {/* Fallback 404 Route */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
