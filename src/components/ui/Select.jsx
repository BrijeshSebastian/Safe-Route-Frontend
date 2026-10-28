import React, { forwardRef } from 'react';

export const Select = forwardRef(
  ({ children, className = '', hasError = false, disabled = false, ...props }, ref) => {
    return (
      <div className="relative w-full">
        <select
          ref={ref}
          disabled={disabled}
          className={`w-full min-h-[44px] appearance-none rounded-xl border bg-surface-card px-3.5 py-2.5 pr-8 text-sm text-ink transition-colors disabled:cursor-not-allowed disabled:bg-surface-muted disabled:text-ink-faint focus:outline-none focus:ring-2 ${
            hasError
              ? 'border-pastel-rose-text focus:border-pastel-rose-text focus:ring-pastel-rose-bg'
              : 'border-line focus:border-primary-400 focus:ring-primary-100'
          } ${className}`}
          {...props}
        >
          {children}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-ink-faint">
          <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
            <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
          </svg>
        </div>
      </div>
    );
  }
);

Select.displayName = 'Select';
export default Select;
