import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { ROLE_HOME } from '../lib/constants';
import RouteLoader from '../components/common/RouteLoader';

export const PublicOnlyRoute = ({ children }) => {
  const status = useAuthStore((s) => s.status);
  const user = useAuthStore((s) => s.user);

  if (status === 'booting') {
    return <RouteLoader fullPage message="Loading SafeRoute…" />;
  }

  if (status === 'authenticated') {
    const home = (user && ROLE_HOME[user.role]) || '/';
    return <Navigate to={home} replace />;
  }

  return children || <Outlet />;
};

export default PublicOnlyRoute;
