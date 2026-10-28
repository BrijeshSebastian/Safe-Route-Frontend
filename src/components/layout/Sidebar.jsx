import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { ShieldCheck, LogOut, X } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { authApi } from '../../api/auth';
import { REFRESH_TOKEN_KEY } from '../../lib/constants';
import Avatar from '../ui/Avatar';
import IconButton from '../ui/IconButton';

export const Sidebar = ({
  navItems = [],
  isOpen = false,
  onClose = () => {},
  isDrawer = false,
}) => {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const clearSession = useAuthStore((s) => s.clearSession);

  const handleLogout = async () => {
    try {
      const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
      if (refreshToken) {
        await authApi.logout(refreshToken);
      }
    } catch {
      // Ignore error
    } finally {
      clearSession();
      navigate('/login');
    }
  };

  const navContent = (
    <div className="flex flex-col h-full bg-surface-card border-r border-line w-[264px]">
      {/* Brand Header */}
      <div className="h-16 flex items-center justify-between px-6 border-b border-line shrink-0">
        <div className="flex items-center gap-2.5">
          <ShieldCheck className="w-6 h-6 text-primary-600" aria-hidden="true" />
          <span className="font-bold text-primary-600 text-lg tracking-tight">SafeRoute</span>
        </div>
        {isDrawer && (
          <IconButton
            icon={X}
            aria-label="Close navigation"
            variant="ghost"
            size="sm"
            onClick={onClose}
          />
        )}
      </div>

      {/* Nav Items */}
      <nav className="flex-1 overflow-y-auto px-4 py-4 space-y-1" aria-label="Main Navigation">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end !== undefined ? item.end : true}
              onClick={() => {
                if (isDrawer) onClose();
              }}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-primary-50 text-primary-700 font-semibold'
                    : 'text-ink-soft hover:text-ink hover:bg-surface-muted'
                }`
              }
            >
              {Icon && <Icon className="w-5 h-5 shrink-0" aria-hidden="true" />}
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* User Card + Logout */}
      <div className="p-4 border-t border-line shrink-0 space-y-3">
        <div className="flex items-center gap-3 px-2 py-1">
          <Avatar src={user?.profile_image} name={user?.full_name} size="sm" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-ink truncate">{user?.full_name || 'User'}</p>
            <p className="text-[10px] text-ink-faint truncate capitalize">{user?.role || 'Guest'}</p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleLogout}
          className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-pastel-rose-text rounded-xl hover:bg-pastel-rose-bg/50 transition-colors cursor-pointer"
        >
          <LogOut className="w-4 h-4 shrink-0" aria-hidden="true" />
          <span>Log out</span>
        </button>
      </div>
    </div>
  );

  if (isDrawer) {
    if (!isOpen) return null;
    return (
      <div className="fixed inset-0 z-50 lg:hidden flex">
        <div
          className="fixed inset-0 bg-ink/30 backdrop-blur-xs transition-opacity"
          onClick={onClose}
        />
        <div className="relative z-10 animate-in slide-in-from-left duration-200">
          {navContent}
        </div>
      </div>
    );
  }

  return (
    <aside className="hidden lg:block fixed left-0 top-0 bottom-0 z-30">
      {navContent}
    </aside>
  );
};

export default Sidebar;
