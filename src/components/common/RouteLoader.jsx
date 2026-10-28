import React from 'react';
import Spinner from '../ui/Spinner';

export const RouteLoader = ({ message = 'Loading SafeRoute…', fullPage = false }) => {
  return (
    <div
      className={`flex flex-col items-center justify-center gap-3 p-8 ${
        fullPage ? 'fixed inset-0 bg-surface-page z-50' : 'min-h-[50vh] w-full'
      }`}
      role="status"
    >
      <Spinner size="lg" className="text-primary-600" />
      <p className="text-sm font-medium text-ink-soft select-none animate-pulse">
        {message}
      </p>
    </div>
  );
};

export default RouteLoader;
