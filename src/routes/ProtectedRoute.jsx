import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import RouteLoader from '../components/common/RouteLoader';

export const ProtectedRoute = ({ children }) => {
  const status = useAuthStore((s) => s.status);
  const user = useAuthStore((s) => s.user);
  const location = useLocation();

  if (status === 'booting' || (status === 'authenticated' && !user)) {
    return <RouteLoader fullPage message="Loading SafeRoute…" />;
  }

  if (status !== 'authenticated') {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children || <Outlet />;
};

export default ProtectedRoute;
