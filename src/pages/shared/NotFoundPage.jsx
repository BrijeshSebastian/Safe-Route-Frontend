import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, Compass } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { ROLE_HOME } from '../../lib/constants';
import Button from '../../components/ui/Button';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';

export const NotFoundPage = () => {
  useDocumentTitle('Page Not Found');
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const homePath = (user && ROLE_HOME[user.role]) || '/login';

  return (
    <div className="min-h-screen bg-surface-page flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-surface-card rounded-2xl border border-line p-8 shadow-soft text-center">
        <div className="w-16 h-16 rounded-2xl bg-primary-50 text-primary-600 flex items-center justify-center mx-auto mb-4">
          <Compass className="w-8 h-8" aria-hidden="true" />
        </div>
        <h1 className="text-3xl font-bold text-ink mb-2">404</h1>
        <h2 className="text-lg font-semibold text-ink mb-2">Page Not Found</h2>
        <p className="text-sm text-ink-soft mb-6 leading-relaxed">
          The page you are looking for doesn't exist or has been moved.
        </p>
        <div className="flex items-center justify-center">
          <Button
            variant="primary"
            size="md"
            leftIcon={Home}
            onClick={() => navigate(homePath)}
          >
            Go to my home
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;
