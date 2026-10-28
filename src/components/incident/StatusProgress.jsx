import React from 'react';
import { Check, XCircle, Ban } from 'lucide-react';

const HAPPY_PATH = [
  { key: 'pending', label: 'Reported' },
  { key: 'verified', label: 'Verified' },
  { key: 'assigned', label: 'Assigned' },
  { key: 'accepted', label: 'Accepted' },
  { key: 'on_the_way', label: 'On the way' },
  { key: 'reached', label: 'Reached' },
  { key: 'resolved', label: 'Resolved' },
];

export const StatusProgress = ({ status, reason = '', className = '' }) => {
  if (status === 'rejected') {
    return (
      <div
        role="status"
        className={`rounded-2xl bg-pastel-rose-bg text-pastel-rose-text border border-pastel-rose-text/20 p-4 flex items-start gap-3 text-sm leading-relaxed ${className}`}
      >
        <XCircle className="w-5 h-5 shrink-0 mt-0.5 text-pastel-rose-text" aria-hidden="true" />
        <div>
          <h4 className="font-semibold text-sm">Emergency Report Rejected</h4>
          <p className="text-xs text-pastel-rose-text/90 mt-0.5">
            {reason || 'This emergency report was reviewed and marked rejected by administrators.'}
          </p>
        </div>
      </div>
    );
  }

  if (status === 'cancelled') {
    return (
      <div
        role="status"
        className={`rounded-2xl bg-pastel-slate-bg text-pastel-slate-text border border-pastel-slate-text/20 p-4 flex items-start gap-3 text-sm leading-relaxed ${className}`}
      >
        <Ban className="w-5 h-5 shrink-0 mt-0.5 text-pastel-slate-text" aria-hidden="true" />
        <div>
          <h4 className="font-semibold text-sm">Emergency Report Cancelled</h4>
          <p className="text-xs text-pastel-slate-text/90 mt-0.5">
            This incident was cancelled by the reporter.
          </p>
        </div>
      </div>
    );
  }

  const currentIndex = HAPPY_PATH.findIndex((s) => s.key === status);
  const activeIndex = currentIndex !== -1 ? currentIndex : 0;

  return (
    <div className={`overflow-x-auto no-scrollbar py-2 ${className}`}>
      <div className="flex items-center min-w-[580px] justify-between px-2">
        {HAPPY_PATH.map((step, index) => {
          const isCompleted = index < activeIndex;
          const isCurrent = index === activeIndex;

          return (
            <React.Fragment key={step.key}>
              {/* Step Circle & Label */}
              <div className="flex flex-col items-center text-center relative z-10 shrink-0">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                    isCompleted
                      ? 'bg-pastel-mint-bg text-pastel-mint-text border border-pastel-mint-text/30'
                      : isCurrent
                      ? 'bg-primary-600 text-white shadow-sm ring-4 ring-primary-100'
                      : 'bg-surface-card text-ink-faint border border-line'
                  }`}
                  aria-current={isCurrent ? 'step' : undefined}
                >
                  {isCompleted ? (
                    <Check className="w-4 h-4 stroke-[3]" aria-hidden="true" />
                  ) : (
                    <span>{index + 1}</span>
                  )}
                </div>

                <span
                  className={`mt-2 text-[11px] font-medium whitespace-nowrap ${
                    isCurrent
                      ? 'text-primary-700 font-semibold'
                      : isCompleted
                      ? 'text-ink'
                      : 'text-ink-faint'
                  }`}
                >
                  {step.label}
                </span>
              </div>

              {/* Connecting Line between steps */}
              {index < HAPPY_PATH.length - 1 && (
                <div
                  className={`flex-1 h-0.5 mx-2 -mt-5 transition-colors ${
                    index < activeIndex ? 'bg-pastel-mint-text/60' : 'bg-line'
                  }`}
                  aria-hidden="true"
                />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};

export default StatusProgress;
