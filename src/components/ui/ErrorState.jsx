import React from 'react';
import { AlertCircle, RotateCcw } from 'lucide-react';
import Button from './Button';

export const ErrorState = ({
  title = 'Something went wrong',
  message = 'Failed to load data. Please check your connection and try again.',
  onRetry = null,
  retryLabel = 'Try again',
  className = '',
}) => {
  return (
    <div
      className={`flex flex-col items-center justify-center p-8 md:p-12 text-center rounded-2xl border border-line bg-surface-card ${className}`}
      role="alert"
    >
      <div className="w-12 h-12 rounded-2xl bg-pastel-rose-bg text-pastel-rose-text flex items-center justify-center mb-4">
        <AlertCircle className="w-6 h-6" aria-hidden="true" />
      </div>
      <h3 className="text-base font-semibold text-ink mb-1">{title}</h3>
      <p className="text-sm text-ink-soft max-w-sm mb-6 leading-relaxed">{message}</p>
      {onRetry && (
        <Button
          variant="secondary"
          size="md"
          onClick={onRetry}
          leftIcon={RotateCcw}
        >
          {retryLabel}
        </Button>
      )}
    </div>
  );
};

export default ErrorState;
