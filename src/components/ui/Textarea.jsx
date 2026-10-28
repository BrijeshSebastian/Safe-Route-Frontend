import React, { forwardRef } from 'react';

export const Textarea = forwardRef(
  ({ className = '', hasError = false, rows = 3, disabled = false, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        rows={rows}
        disabled={disabled}
        className={`w-full rounded-xl border bg-surface-card px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-faint transition-colors disabled:cursor-not-allowed disabled:bg-surface-muted disabled:text-ink-faint focus:outline-none focus:ring-2 ${
          hasError
            ? 'border-pastel-rose-text focus:border-pastel-rose-text focus:ring-pastel-rose-bg'
            : 'border-line focus:border-primary-400 focus:ring-primary-100'
        } ${className}`}
        {...props}
      />
    );
  }
);

Textarea.displayName = 'Textarea';
export default Textarea;
