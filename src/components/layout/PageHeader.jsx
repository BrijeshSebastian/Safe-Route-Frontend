import React from 'react';

export const PageHeader = ({ title, subtitle = '', action = null, className = '' }) => {
  return (
    <div className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 ${className}`}>
      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-ink">{title}</h1>
        {subtitle && <div className="text-sm text-ink-soft mt-1">{subtitle}</div>}
      </div>
      {action && <div className="flex items-center gap-3 shrink-0">{action}</div>}
    </div>
  );
};

export default PageHeader;
