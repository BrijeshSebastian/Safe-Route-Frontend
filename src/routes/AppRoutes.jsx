import React, { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { ROLE_HOME } from '../lib/constants';

import ProtectedRoute from './ProtectedRoute';
import RoleRoute from './RoleRoute';
import PublicOnlyRoute from './PublicOnlyRoute';
import RoleLayout from './RoleLayout';
import RouteLoader from '../components/common/RouteLoader';

// Lazy-loaded Pages
// Auth
const LoginPage = lazy(() => import('../pages/auth/LoginPage'));
const RegisterPage = lazy(() => import('../pages/auth/RegisterPage'));
const ForgotPasswordPage = lazy(() => import('../pages/auth/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('../pages/auth/ResetPasswordPage'));

// Reporter
const ReportIncidentPage = lazy(() => import('../pages/reporter/ReportIncidentPage'));
const MyIncidentsPage = lazy(() => import('../pages/reporter/MyIncidentsPage'));
const ReporterIncidentDetailPage = lazy(() => import('../pages/reporter/ReporterIncidentDetailPage'));
const EditIncidentPage = lazy(() => import('../pages/reporter/EditIncidentPage'));

// Responder
const ResponderDashboardPage = lazy(() => import('../pages/responder/ResponderDashboardPage'));
const AssignmentsPage = lazy(() => import('../pages/responder/AssignmentsPage'));
const AssignmentDetailPage = lazy(() => import('../pages/responder/AssignmentDetailPage'));
const HistoryPage = lazy(() => import('../pages/responder/HistoryPage'));

// Admin
const AdminDashboardPage = lazy(() => import('../pages/admin/AdminDashboardPage'));
const AdminIncidentsPage = lazy(() => import('../pages/admin/AdminIncidentsPage'));
const AdminIncidentDetailPage = lazy(() => import('../pages/admin/AdminIncidentDetailPage'));
const NearbyMapPage = lazy(() => import('../pages/admin/NearbyMapPage'));
const AnalyticsPage = lazy(() => import('../pages/admin/AnalyticsPage'));
const MonthlyReportPage = lazy(() => import('../pages/admin/MonthlyReportPage'));
const UsersPage = lazy(() => import('../pages/admin/UsersPage'));
const UserDetailPage = lazy(() => import('../pages/admin/UserDetailPage'));
const CreateResponderPage = lazy(() => import('../pages/admin/CreateResponderPage'));

// Shared
const ProfilePage = lazy(() => import('../pages/shared/ProfilePage'));
const NotificationsPage = lazy(() => import('../pages/shared/NotificationsPage'));
const NotFoundPage = lazy(() => import('../pages/shared/NotFoundPage'));

// Root Index Component
const RootRedirect = () => {
  const status = useAuthStore((s) => s.status);
  const user = useAuthStore((s) => s.user);

  if (status === 'booting') {
    return <RouteLoader fullPage message="Loading SafeRoute…" />;
  }

  if (status === 'authenticated') {
    const home = (user && ROLE_HOME[user.role]) || '/reporter/incidents';
    return <Navigate to={home} replace />;
  }

  return <Navigate to="/login" replace />;
};

export const AppRoutes = () => {
  return (
    <Suspense fallback={<RouteLoader />}>
      <Routes>
        {/* Root Redirect */}
        <Route path="/" element={<RootRedirect />} />

        {/* Public-Only Auth Routes */}
        <Route element={<PublicOnlyRoute />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
        </Route>

        {/* Authenticated Protected Routes with Dynamic RoleLayout */}
        <Route element={<ProtectedRoute />}>
          <Route element={<RoleLayout />}>
            {/* Shared Authenticated Routes */}
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/notifications" element={<NotificationsPage />} />

            {/* Reporter Routes */}
            <Route element={<RoleRoute allow={['reporter']} />}>
              <Route path="/reporter/report" element={<ReportIncidentPage />} />
              <Route path="/reporter/incidents" element={<MyIncidentsPage />} />
              <Route path="/reporter/incidents/:id" element={<ReporterIncidentDetailPage />} />
              <Route path="/reporter/incidents/:id/edit" element={<EditIncidentPage />} />
            </Route>

            {/* Responder Routes */}
            <Route element={<RoleRoute allow={['responder']} />}>
              <Route path="/responder" element={<ResponderDashboardPage />} />
              <Route path="/responder/assignments" element={<AssignmentsPage />} />
              <Route path="/responder/assignments/:id" element={<AssignmentDetailPage />} />
              <Route path="/responder/history" element={<HistoryPage />} />
            </Route>

            {/* Admin Routes */}
            <Route element={<RoleRoute allow={['admin']} />}>
              <Route path="/admin" element={<AdminDashboardPage />} />
              <Route path="/admin/incidents" element={<AdminIncidentsPage />} />
              <Route path="/admin/incidents/:id" element={<AdminIncidentDetailPage />} />
              <Route path="/admin/map" element={<NearbyMapPage />} />
              <Route path="/admin/analytics" element={<AnalyticsPage />} />
              <Route path="/admin/reports" element={<MonthlyReportPage />} />
              <Route path="/admin/users" element={<UsersPage />} />
              <Route path="/admin/users/:id" element={<UserDetailPage />} />
              <Route path="/admin/responders/new" element={<CreateResponderPage />} />
            </Route>
          </Route>
        </Route>

        {/* 404 Catch-All Route */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  );
};

export default AppRoutes;
