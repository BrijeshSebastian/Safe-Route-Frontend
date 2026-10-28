import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShieldCheck, Menu, LogOut, User as UserIcon } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { authApi } from '../../api/auth';
import { REFRESH_TOKEN_KEY } from '../../lib/constants';
import NotificationBell from '../common/NotificationBell';
import LocationStatusChip from '../responder/LocationStatusChip';
import Avatar from '../ui/Avatar';
import IconButton from '../ui/IconButton';

export const TopBar = ({ title = '', onToggleMobileNav = null, showMobileToggle = false }) => {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const clearSession = useAuthStore((s) => s.clearSession);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const handleLogout = async () => {
    try {
      const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
      if (refreshToken) {
        await authApi.logout(refreshToken);
      }
    } catch {
      // Ignore logout errors
    } finally {
      clearSession();
      navigate('/login');
    }
  };

  return (
    <>
      <header className="sticky top-0 z-30 h-16 bg-surface-card border-b border-line px-4 md:px-6 flex items-center justify-between">
      <div className="flex items-center gap-3">
        {showMobileToggle && (
          <IconButton
            icon={Menu}
            aria-label="Open navigation menu"
            variant="ghost"
            size="sm"
            className="lg:hidden"
            onClick={onToggleMobileNav}
          />
        )}
        <div className="flex items-center gap-2 lg:hidden">
          <ShieldCheck className="w-6 h-6 text-primary-600" aria-hidden="true" />
          <span className="font-semibold text-primary-600 text-lg">SafeRoute</span>
        </div>
        <div className="hidden lg:block">
          <span className="text-base font-medium text-ink">{title}</span>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-4">
        {user?.role === 'responder' && (
          <div className="hidden md:block">
            <LocationStatusChip />
          </div>
        )}

        <NotificationBell />

        <div className="relative">
          <button
            type="button"
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2.5 p-1 rounded-xl hover:bg-surface-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-300"
            aria-label="User menu"
            aria-expanded={dropdownOpen}
          >
            <Avatar src={user?.profile_image} name={user?.full_name} size="sm" />
            <div className="hidden md:flex flex-col text-left">
              <span className="text-xs font-semibold text-ink leading-tight">
                {user?.full_name || 'User'}
              </span>
              <span className="text-[10px] text-ink-faint capitalize">
                {user?.role || 'Guest'}
              </span>
            </div>
          </button>

          {dropdownOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setDropdownOpen(false)}
              />
              <div className="absolute right-0 mt-2 w-48 bg-surface-card rounded-2xl border border-line shadow-soft py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
                <div className="px-4 py-2 border-b border-line md:hidden">
                  <p className="text-xs font-semibold text-ink">{user?.full_name}</p>
                  <p className="text-[10px] text-ink-faint capitalize">{user?.role}</p>
                </div>
                <Link
                  to="/profile"
                  onClick={() => setDropdownOpen(false)}
                  className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-ink hover:bg-surface-muted transition-colors"
                >
                  <UserIcon className="w-4 h-4 text-ink-soft" />
                  <span>Profile Settings</span>
                </Link>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-pastel-rose-text hover:bg-pastel-rose-bg/30 transition-colors"
                >
                  <LogOut className="w-4 h-4 text-pastel-rose-text" />
                  <span>Log Out</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>

    {user?.role === 'responder' && (
      <div className="md:hidden px-4 py-2 bg-surface-card border-b border-line flex justify-center">
        <LocationStatusChip />
      </div>
    )}
  </>
  );
};

export default TopBar;
