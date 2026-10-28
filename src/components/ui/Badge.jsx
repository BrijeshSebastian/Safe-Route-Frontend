import React from 'react';

const PASTEL_VARIANTS = {
  mint: 'bg-pastel-mint-bg text-pastel-mint-text border-pastel-mint-text/10',
  sky: 'bg-pastel-sky-bg text-pastel-sky-text border-pastel-sky-text/10',
  lavender: 'bg-pastel-lavender-bg text-pastel-lavender-text border-pastel-lavender-text/10',
  peach: 'bg-pastel-peach-bg text-pastel-peach-text border-pastel-peach-text/10',
  butter: 'bg-pastel-butter-bg text-pastel-butter-text border-pastel-butter-text/10',
  rose: 'bg-pastel-rose-bg text-pastel-rose-text border-pastel-rose-text/10',
  slate: 'bg-pastel-slate-bg text-pastel-slate-text border-pastel-slate-text/10',
};

export const Badge = ({
  children,
  variant = 'slate',
  size = 'md',
  className = '',
  icon: Icon = null,
}) => {
  const colorClasses = PASTEL_VARIANTS[variant] || PASTEL_VARIANTS.slate;
  const sizeClasses =
    size === 'sm'
      ? 'px-2 py-0.5 text-xs gap-1'
      : size === 'lg'
      ? 'px-3 py-1 text-sm gap-1.5'
      : 'px-2.5 py-1 text-xs gap-1.5';

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full border ${colorClasses} ${sizeClasses} ${className}`}
    >
      {Icon && <Icon className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />}
      <span>{children}</span>
    </span>
  );
};

export default Badge;
