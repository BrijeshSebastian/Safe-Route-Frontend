import React, { useEffect, useRef } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuthStore } from '../store/authStore';
import { ROLE_HOME } from '../lib/constants';

export const RoleRoute = ({ allow = [], children }) => {
  const status = useAuthStore((s) => s.status);
  const user = useAuthStore((s) => s.user);
  const toastShown = useRef(false);

  const isReady = status !== 'booting' && (status !== 'authenticated' || Boolean(user));
  const hasAccess = Boolean(user && allow.includes(user.role));

  useEffect(() => {
    if (isReady && !hasAccess && !toastShown.current) {
      toastShown.current = true;
      toast.error('You do not have access to that page.');
    }
  }, [isReady, hasAccess]);

  if (!isReady) {
    return null;
  }

  if (!hasAccess) {
    const home = (user && ROLE_HOME[user.role]) || '/login';
    return <Navigate to={home} replace />;
  }

  return children || <Outlet />;
};

export default RoleRoute;
