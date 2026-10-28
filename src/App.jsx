import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

import { useAuthStore } from './store/authStore';
import { refreshSession, setSessionHandlers } from './api/client';
import { usersApi } from './api/users';
import AppRoutes from './routes/AppRoutes';
import RouteLoader from './components/common/RouteLoader';

export function App() {
  const navigate = useNavigate();
  const status = useAuthStore((s) => s.status);
  const user = useAuthStore((s) => s.user);
  const bootstrap = useAuthStore((s) => s.bootstrap);
  const sessionExpiredNotified = useRef(false);

  useEffect(() => {
    // Set up global session & rate-limit callbacks
    setSessionHandlers({
      onSessionExpired: () => {
        if (!sessionExpiredNotified.current) {
          sessionExpiredNotified.current = true;
          toast.error('Session expired, please log in again.');
          setTimeout(() => {
            sessionExpiredNotified.current = false;
          }, 5000);
        }
        navigate('/login', { replace: true });
      },
      onRateLimited: () => {
        toast.error('Too many attempts. Please wait a few minutes.');
      },
    });

    // Run auth bootstrap once
    bootstrap(refreshSession, usersApi.getProfile);
  }, [bootstrap, navigate]);

  if (status === 'booting' || (status === 'authenticated' && !user)) {
    return <RouteLoader fullPage message="Loading SafeRoute…" />;
  }

  return <AppRoutes />;
}

export default App;
