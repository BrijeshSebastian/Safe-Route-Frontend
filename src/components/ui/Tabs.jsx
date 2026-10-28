import React from 'react';

export const Tabs = ({
  tabs = [],
  activeTab,
  onChange,
  className = '',
}) => {
  return (
    <div className={`border-b border-line ${className}`}>
      <div className="flex space-x-1 sm:space-x-2 overflow-x-auto no-scrollbar" role="tablist">
        {tabs.map((tab) => {
          const tabId = tab.id || tab.key;
          const isActive = tabId === activeTab;
          const Icon = tab.icon;

          return (
            <button
              key={tabId}
              role="tab"
              aria-selected={isActive}
              onClick={() => onChange?.(tabId)}
              className={`flex items-center gap-2 py-3 px-3 sm:px-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap min-h-[44px] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-300 ${
                isActive
                  ? 'border-primary-600 text-primary-700 font-semibold'
                  : 'border-transparent text-ink-soft hover:text-ink hover:border-line'
              }`}
            >
              {Icon && <Icon className="w-4 h-4 shrink-0" aria-hidden="true" />}
              <span>{tab.label}</span>
              {typeof tab.count === 'number' && (
                <span
                  className={`text-xs px-2 py-0.5 rounded-full ${
                    isActive
                      ? 'bg-primary-100 text-primary-700'
                      : 'bg-surface-muted text-ink-faint'
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default Tabs;
