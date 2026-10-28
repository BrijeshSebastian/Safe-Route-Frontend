import React from 'react';
import { NavLink } from 'react-router-dom';

export const BottomNav = ({ items = [] }) => {
  if (!items || items.length === 0) return null;

  return (
    <nav
      aria-label="Mobile Bottom Navigation"
      className="lg:hidden fixed bottom-0 left-0 right-0 z-30 h-16 bg-surface-card border-t border-line px-2 flex items-center justify-around"
    >
      {items.slice(0, 4).map((item) => {
        const Icon = item.icon;
        return (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end !== undefined ? item.end : true}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center flex-1 h-full py-1 text-[11px] font-medium transition-colors ${
                isActive ? 'text-primary-600 font-semibold' : 'text-ink-faint hover:text-ink'
              }`
            }
          >
            {Icon && <Icon className="w-5 h-5 mb-0.5 shrink-0" aria-hidden="true" />}
            <span className="truncate max-w-[70px]">{item.label}</span>
          </NavLink>
        );
      })}
    </nav>
  );
};

export default BottomNav;
