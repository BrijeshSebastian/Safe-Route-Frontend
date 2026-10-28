import React, { forwardRef } from 'react';
import Spinner from './Spinner';

export const IconButton = forwardRef(
  (
    {
      icon: Icon,
      'aria-label': ariaLabel,
      variant = 'ghost',
      size = 'md',
      loading = false,
      disabled = false,
      className = '',
      type = 'button',
      ...props
    },
    ref
  ) => {
    if (!ariaLabel) {
      console.warn('IconButton requires an "aria-label" attribute for accessibility.');
    }

    const baseClasses =
      'inline-flex items-center justify-center rounded-xl transition-colors cursor-pointer select-none disabled:opacity-60 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-300';

    const variantClasses = {
      primary: 'bg-primary-600 text-white hover:bg-primary-700 active:bg-primary-800 shadow-sm',
      secondary: 'bg-surface-card text-ink border border-line hover:bg-surface-muted active:bg-surface-muted/80',
      soft: 'bg-primary-50 text-primary-700 hover:bg-primary-100',
      danger: 'bg-pastel-rose-bg text-pastel-rose-text hover:opacity-90',
      ghost: 'bg-transparent text-ink-soft hover:text-ink hover:bg-surface-muted active:bg-surface-muted/80',
    }[variant] || '';

    const sizeClasses = {
      sm: 'w-9 h-9 min-h-[44px] min-w-[44px] text-xs',
      md: 'w-11 h-11 min-h-[44px] min-w-[44px] text-sm',
      lg: 'w-12 h-12 min-h-[48px] min-w-[48px] text-base',
    }[size] || 'w-11 h-11 min-h-[44px] min-w-[44px] text-sm';

    return (
      <button
        ref={ref}
        type={type}
        aria-label={ariaLabel}
        disabled={disabled || loading}
        className={`${baseClasses} ${variantClasses} ${sizeClasses} ${className}`}
        {...props}
      >
        {loading ? (
          <Spinner size="sm" className="text-current" />
        ) : Icon ? (
          <Icon className="w-5 h-5 shrink-0" aria-hidden="true" />
        ) : null}
      </button>
    );
  }
);

IconButton.displayName = 'IconButton';
export default IconButton;
