import React from 'react';
import { STATUS_LABELS, STATUS_COLORS } from '../../lib/constants';
import { formatDateTime } from '../../lib/format';

export const StatusTimeline = ({ history = [], className = '' }) => {
  if (!history || history.length === 0) {
    return (
      <div className={`text-xs text-ink-faint py-4 text-center italic ${className}`}>
        No updates yet.
      </div>
    );
  }

  const dotColorClasses = {
    butter: 'bg-pastel-butter-bg border-pastel-butter-text',
    sky: 'bg-pastel-sky-bg border-pastel-sky-text',
    lavender: 'bg-pastel-lavender-bg border-pastel-lavender-text',
    mint: 'bg-pastel-mint-bg border-pastel-mint-text',
    peach: 'bg-pastel-peach-bg border-pastel-peach-text',
    rose: 'bg-pastel-rose-bg border-pastel-rose-text',
    slate: 'bg-pastel-slate-bg border-pastel-slate-text',
  };

  return (
    <div className={`relative pl-6 space-y-6 before:absolute before:left-2 before:top-2.5 before:bottom-2 before:w-0.5 before:bg-line ${className}`}>
      {history.map((entry, index) => {
        const status = entry.new_status;
        const colorKey = STATUS_COLORS[status] || 'slate';
        const dotColor = dotColorClasses[colorKey] || dotColorClasses.slate;
        const statusLabel = STATUS_LABELS[status] || status;
        const actorName = entry.changedByUser?.full_name;
        const actorRole = entry.changedByUser?.role;
        const timestamp = entry.createdAt || entry.created_at;

        return (
          <div key={entry.id || index} className="relative flex items-start gap-3 text-xs">
            {/* Timeline Node Dot */}
            <div
              className={`absolute -left-6 top-1 w-4 h-4 rounded-full border-2 ${dotColor} z-10`}
              aria-hidden="true"
            />

            <div className="flex-1 space-y-1">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                <span className="font-semibold text-ink text-sm">{statusLabel}</span>
                {actorName && (
                  <span className="text-ink-soft">
                    by {actorName} {actorRole ? `· ${actorRole}` : ''}
                  </span>
                )}
                <span className="text-ink-faint">
                  {formatDateTime(timestamp)}
                </span>
              </div>

              {entry.notes && (
                <div className="mt-1 text-xs text-ink-soft bg-surface-muted/80 border border-line/60 p-2.5 rounded-xl leading-relaxed">
                  {entry.notes}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default StatusTimeline;
