import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, WifiOff } from 'lucide-react';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';

export const AuthLayout = ({
  title,
  subtitle,
  children,
  footer = null,
}) => {
  const isOnline = useOnlineStatus();

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-surface-page to-pastel-mint-bg flex flex-col justify-center items-center p-4 sm:p-6 font-sans">
      {!isOnline && (
        <div
          role="status"
          aria-live="polite"
          className="fixed top-0 inset-x-0 bg-pastel-butter-bg text-pastel-butter-text px-4 py-2 text-xs font-semibold text-center border-b border-pastel-butter-text/20 flex items-center justify-center gap-2 z-50 shadow-sm"
        >
          <WifiOff className="w-4 h-4 shrink-0" aria-hidden="true" />
          <span>You are offline. Changes will not be saved.</span>
        </div>
      )}
      <div className="w-full max-w-md flex flex-col items-center mb-6 text-center">
        <Link
          to="/"
          className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary-100 text-primary-600 mb-3 shadow-xs hover:bg-primary-200 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-300"
          aria-label="SafeRoute Home"
        >
          <ShieldCheck className="w-8 h-8" aria-hidden="true" />
        </Link>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-ink">SafeRoute</h1>
        <p className="text-sm text-ink-soft mt-1">Report emergencies. Get help faster.</p>
      </div>

      <div className="w-full max-w-md bg-surface-card rounded-2xl shadow-soft border border-line p-6 md:p-8">
        {(title || subtitle) && (
          <div className="mb-6 text-left">
            {title && <h2 className="text-xl font-bold text-ink">{title}</h2>}
            {subtitle && <p className="text-xs sm:text-sm text-ink-soft mt-1">{subtitle}</p>}
          </div>
        )}

        {children}
      </div>

      {footer && (
        <div className="w-full max-w-md mt-6 text-center text-xs sm:text-sm text-ink-soft">
          {footer}
        </div>
      )}
    </div>
  );
};

export default AuthLayout;
