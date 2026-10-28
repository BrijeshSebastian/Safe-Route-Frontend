import React, { useState } from 'react';
import { WifiOff } from 'lucide-react';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import BottomNav from './BottomNav';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';

export const AppShell = ({
  children,
  navItems = [],
  bottomNavItems = [],
  title = '',
  role = 'reporter',
}) => {
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const isOnline = useOnlineStatus();
  const isAdmin = role === 'admin';

  return (
    <div className="min-h-screen bg-surface-page text-ink flex flex-col font-sans">
      {/* Offline Alert Banner */}
      {!isOnline && (
        <div
          role="status"
          aria-live="polite"
          className="bg-pastel-butter-bg text-pastel-butter-text px-4 py-2 text-xs font-semibold text-center border-b border-pastel-butter-text/20 flex items-center justify-center gap-2 sticky top-0 z-50 shadow-sm"
        >
          <WifiOff className="w-4 h-4 shrink-0" aria-hidden="true" />
          <span>You are offline. Changes will not be saved.</span>
        </div>
      )}

      {/* Desktop Sidebar */}
      <Sidebar navItems={navItems} />

      {/* Admin Mobile Drawer */}
      {isAdmin && (
        <Sidebar
          navItems={navItems}
          isDrawer
          isOpen={mobileDrawerOpen}
          onClose={() => setMobileDrawerOpen(false)}
        />
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col lg:pl-[264px]">
        <TopBar
          title={title}
          showMobileToggle={isAdmin}
          onToggleMobileNav={() => setMobileDrawerOpen(true)}
        />

        <main className="flex-1 w-full max-w-[1200px] mx-auto px-4 md:px-6 py-6 pb-24 lg:pb-8">
          {children}
        </main>

        {/* Mobile Bottom Navigation for Reporter & Responder */}
        {!isAdmin && bottomNavItems.length > 0 && (
          <BottomNav items={bottomNavItems} />
        )}
      </div>
    </div>
  );
};

export default AppShell;
