import React, { forwardRef } from 'react';

export const Input = forwardRef(
  (
    {
      className = '',
      hasError = false,
      type = 'text',
      disabled = false,
      rightElement = null,
      ...props
    },
    ref
  ) => {
    if (rightElement) {
      return (
        <div className="relative w-full">
          <input
            ref={ref}
            type={type}
            disabled={disabled}
            className={`w-full min-h-[44px] rounded-xl border bg-surface-card pl-3.5 pr-11 py-2.5 text-sm text-ink placeholder:text-ink-faint transition-colors disabled:cursor-not-allowed disabled:bg-surface-muted disabled:text-ink-faint focus:outline-none focus:ring-2 ${
              hasError
                ? 'border-pastel-rose-text focus:border-pastel-rose-text focus:ring-pastel-rose-bg'
                : 'border-line focus:border-primary-400 focus:ring-primary-100'
            } ${className}`}
            {...props}
          />
          <div className="absolute inset-y-0 right-0 flex items-center pr-1">
            {rightElement}
          </div>
        </div>
      );
    }

    return (
      <input
        ref={ref}
        type={type}
        disabled={disabled}
        className={`w-full min-h-[44px] rounded-xl border bg-surface-card px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-faint transition-colors disabled:cursor-not-allowed disabled:bg-surface-muted disabled:text-ink-faint focus:outline-none focus:ring-2 ${
          hasError
            ? 'border-pastel-rose-text focus:border-pastel-rose-text focus:ring-pastel-rose-bg'
            : 'border-line focus:border-primary-400 focus:ring-primary-100'
        } ${className}`}
        {...props}
      />
    );
  }
);

Input.displayName = 'Input';
export default Input;
