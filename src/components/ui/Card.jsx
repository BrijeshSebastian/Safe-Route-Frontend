import React, { forwardRef } from 'react';

export const Card = forwardRef(
  ({ children, className = '', title, subtitle, action, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={`rounded-2xl border border-line bg-surface-card p-4 shadow-soft transition-shadow md:p-6 ${className}`}
        {...props}
      >
        {(title || subtitle || action) && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-3 border-b border-line/60">
            <div>
              {title && (
                <div className="font-bold text-base text-ink">
                  {title}
                </div>
              )}
              {subtitle && (
                <p className="text-xs text-ink-muted mt-0.5">{subtitle}</p>
              )}
            </div>
            {action && <div className="shrink-0">{action}</div>}
          </div>
        )}
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';
export default Card;
