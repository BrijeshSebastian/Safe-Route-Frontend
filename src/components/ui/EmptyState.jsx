import React from 'react';
import { Inbox } from 'lucide-react';

export const EmptyState = ({
  icon: Icon = Inbox,
  title = 'No records found',
  text = 'There are no items to display at this time.',
  action = null,
  className = '',
}) => {
  return (
    <div
      className={`flex flex-col items-center justify-center p-8 md:p-12 text-center rounded-2xl border border-dashed border-line bg-surface-card ${className}`}
    >
      <div className="w-12 h-12 rounded-2xl bg-primary-50 text-primary-600 flex items-center justify-center mb-4">
        <Icon className="w-6 h-6" aria-hidden="true" />
      </div>
      <h3 className="text-base font-semibold text-ink mb-1">{title}</h3>
      <p className="text-sm text-ink-soft max-w-sm mb-6 leading-relaxed">{text}</p>
      {action && <div className="flex items-center justify-center">{action}</div>}
    </div>
  );
};

export default EmptyState;
