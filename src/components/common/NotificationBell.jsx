import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell } from 'lucide-react';
import { useNotificationsCount } from '../../hooks/useNotificationsCount';
import IconButton from '../ui/IconButton';

export const NotificationBell = ({ className = '' }) => {
  const navigate = useNavigate();
  const { unreadCount } = useNotificationsCount();

  return (
    <div className={`relative inline-flex items-center ${className}`}>
      <IconButton
        icon={Bell}
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
        variant="ghost"
        onClick={() => navigate('/notifications')}
      />
      {unreadCount > 0 && (
        <span
          className="absolute top-1.5 right-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-pastel-rose-text px-1 text-[10px] font-bold text-white pointer-events-none ring-2 ring-surface-card"
          aria-hidden="true"
        >
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      )}
    </div>
  );
};

export default NotificationBell;
