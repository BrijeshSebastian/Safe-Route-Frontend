import React, { forwardRef } from 'react';
import { Link } from 'react-router-dom';
import Spinner from './Spinner';

export const Button = forwardRef(
  (
    {
      as,
      children,
      variant = 'primary',
      size = 'md',
      loading = false,
      disabled = false,
      leftIcon = null,
      icon = null,
      rightIcon: RightIcon = null,
      className = '',
      type,
      ...props
    },
    ref
  ) => {
    const Component = as || (props.to ? Link : 'button');
    const LeftIcon = leftIcon || icon;
    const isButton = Component === 'button';

    const baseClasses =
      'inline-flex items-center justify-center font-medium transition-colors cursor-pointer select-none disabled:opacity-60 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-300';

    const variantClasses = {
      primary: 'bg-primary-600 text-white hover:bg-primary-700 active:bg-primary-800 shadow-sm',
      secondary: 'bg-surface-card text-ink border border-line hover:bg-surface-muted active:bg-surface-muted/80',
      soft: 'bg-primary-50 text-primary-700 hover:bg-primary-100 active:bg-primary-200',
      danger: 'bg-pastel-rose-bg text-pastel-rose-text hover:bg-opacity-90 active:bg-opacity-80 border border-pastel-rose-text/10',
      ghost: 'bg-transparent text-ink hover:bg-surface-muted active:bg-surface-muted/80',
    }[variant] || '';

    const sizeClasses = {
      sm: 'px-3 py-2 text-xs rounded-xl min-h-[44px] gap-1.5',
      md: 'px-4 py-2.5 text-sm rounded-xl min-h-[44px] gap-2',
      lg: 'px-6 py-3 text-base rounded-xl min-h-[48px] gap-2.5',
    }[size] || 'px-4 py-2.5 text-sm rounded-xl min-h-[44px] gap-2';

    const componentProps = {
      ref,
      className: `${baseClasses} ${variantClasses} ${sizeClasses} ${className}`,
      ...props,
    };

    if (isButton) {
      componentProps.type = type || 'button';
      componentProps.disabled = disabled || loading;
    } else {
      if (type) componentProps.type = type;
      if (disabled || loading) {
        componentProps['aria-disabled'] = true;
        componentProps.tabIndex = -1;
        componentProps.className += ' pointer-events-none opacity-60';
        componentProps.onClick = (e) => {
          e.preventDefault();
        };
      }
    }

    return (
      <Component {...componentProps}>
        {loading ? (
          <Spinner size={size === 'sm' ? 'sm' : 'sm'} className="mr-1 text-current" />
        ) : LeftIcon ? (
          <LeftIcon className="w-4 h-4 shrink-0" aria-hidden="true" />
        ) : null}
        <span>{children}</span>
        {!loading && RightIcon ? (
          <RightIcon className="w-4 h-4 shrink-0" aria-hidden="true" />
        ) : null}
      </Component>
    );
  }
);

Button.displayName = 'Button';
export default Button;
