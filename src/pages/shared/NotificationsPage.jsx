import React from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import {
  Bell,
  Check,
  CheckCheck,
  Trash2,
  ShieldCheck,
  AlertTriangle,
  MapPin,
  Navigation,
  UserCheck,
  XCircle,
  Clock,
  ExternalLink,
} from 'lucide-react';

import PageHeader from '../../components/layout/PageHeader';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import IconButton from '../../components/ui/IconButton';
import Tabs from '../../components/ui/Tabs';
import EmptyState from '../../components/ui/EmptyState';
import ErrorState from '../../components/ui/ErrorState';
import Skeleton from '../../components/ui/Skeleton';
import Pagination from '../../components/ui/Pagination';

import {
  useNotifications,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
  useDeleteNotification,
} from '../../hooks/useNotifications';
import { useNotificationsCount } from '../../hooks/useNotificationsCount';
import { useAuthStore } from '../../store/authStore';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { readPagination, readList } from '../../lib/pagination';
import { formatRelativeTime } from '../../lib/format';
import { resolveNotificationTarget } from '../../lib/notificationRoutes';

const getNotificationMeta = (type) => {
  switch (type) {
    case 'incident_verified':
      return {
        icon: ShieldCheck,
        bg: 'bg-pastel-sky-bg text-pastel-sky-text',
      };
    case 'incident_rejected':
      return {
        icon: XCircle,
        bg: 'bg-pastel-rose-bg text-pastel-rose-text',
      };
    case 'responder_assigned':
      return {
        icon: UserCheck,
        bg: 'bg-pastel-lavender-bg text-pastel-lavender-text',
      };
    case 'responder_en_route':
      return {
        icon: Navigation,
        bg: 'bg-pastel-butter-bg text-pastel-butter-text',
      };
    case 'responder_arrived':
      return {
        icon: MapPin,
        bg: 'bg-pastel-sky-bg text-pastel-sky-text',
      };
    case 'incident_resolved':
      return {
        icon: ShieldCheck,
        bg: 'bg-pastel-mint-bg text-pastel-mint-text',
      };
    case 'new_dispatch':
      return {
        icon: AlertTriangle,
        bg: 'bg-pastel-peach-bg text-pastel-peach-text',
      };
    default:
      return {
        icon: Bell,
        bg: 'bg-primary-100 text-primary-700',
      };
  }
};

export const NotificationsPage = () => {
  useDocumentTitle('Notifications');

  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);

  const activeTab = searchParams.get('filter') || 'all';
  const page = parseInt(searchParams.get('page') || '1', 10);
  const size = 15;

  const queryParams = {
    page,
    size,
    ...(activeTab === 'unread' ? { is_read: false } : {}),
  };

  const { data, isLoading, isError, error, refetch } = useNotifications(queryParams);
  const { unreadCount } = useNotificationsCount();

  const markReadMutation = useMarkNotificationRead();
  const markAllReadMutation = useMarkAllNotificationsRead();
  const deleteMutation = useDeleteNotification();

  const notifications = readList(data, 'notifications');
  const pagination = readPagination(data);

  const handleTabChange = (key) => {
    const next = new URLSearchParams(searchParams);
    if (key === 'all') {
      next.delete('filter');
    } else {
      next.set('filter', key);
    }
    next.set('page', '1');
    setSearchParams(next);
  };

  const handlePageChange = (newPage) => {
    const next = new URLSearchParams(searchParams);
    next.set('page', String(newPage));
    setSearchParams(next);
  };

  const handleNotificationClick = async (notification) => {
    if (!notification.is_read) {
      markReadMutation.mutate(notification.id);
    }
    const targetUrl = await resolveNotificationTarget(user, notification, queryClient);
    if (targetUrl) {
      navigate(targetUrl);
    }
  };

  const tabs = [
    { id: 'all', key: 'all', label: 'All Notifications' },
    {
      id: 'unread',
      key: 'unread',
      label: `Unread${unreadCount > 0 ? ` (${unreadCount})` : ''}`,
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Notifications"
        subtitle="Emergency dispatch updates, assignments, and alerts"
        action={
          unreadCount > 0 ? (
            <Button
              variant="secondary"
              icon={CheckCheck}
              loading={markAllReadMutation.isPending}
              onClick={() => markAllReadMutation.mutate()}
            >
              Mark all as read
            </Button>
          ) : null
        }
      />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-line pb-4">
        <Tabs tabs={tabs} activeTab={activeTab} onChange={handleTabChange} />
        {pagination.totalItems > 0 && (
          <p className="text-xs text-ink-faint">
            Showing {notifications.length} of {pagination.totalItems} notifications
          </p>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <Card key={i} className="p-4 flex items-start gap-4">
              <Skeleton className="w-10 h-10 rounded-xl flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-24" />
              </div>
            </Card>
          ))}
        </div>
      ) : isError ? (
        <Card className="p-8">
          <ErrorState
            title="Failed to load notifications"
            message={error?.response?.data?.message || error?.message || 'Please check your connection and try again.'}
            onRetry={refetch}
          />
        </Card>
      ) : notifications.length === 0 ? (
        <Card className="p-12">
          <EmptyState
            icon={Bell}
            title={activeTab === 'unread' ? 'No unread notifications' : 'No notifications yet'}
            text={
              activeTab === 'unread'
                ? 'You are all caught up! Updates will appear here as incidents progress.'
                : 'Emergency alerts and status updates will be delivered here.'
            }
          />
        </Card>
      ) : (
        <div className="space-y-3" role="feed" aria-label="Notifications list">
          {notifications.map((n) => {
            const meta = getNotificationMeta(n.type);
            const Icon = meta.icon;
            const isUnread = !n.is_read;

            return (
              <div
                key={n.id}
                role="article"
                aria-label={`${isUnread ? 'Unread: ' : ''}${n.title}`}
                className={`group relative flex items-start gap-4 p-4 rounded-2xl border transition-all duration-150 ${
                  isUnread
                    ? 'bg-surface-card border-primary-200 shadow-soft'
                    : 'bg-surface-card/60 border-line hover:border-line-dark'
                }`}
              >
                {/* Type Icon */}
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${meta.bg}`}
                  aria-hidden="true"
                >
                  <Icon className="w-5 h-5" />
                </div>

                {/* Content */}
                <div
                  className="flex-1 min-w-0 cursor-pointer"
                  onClick={() => handleNotificationClick(n)}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <h3
                      className={`text-sm truncate ${
                        isUnread ? 'font-semibold text-ink' : 'font-medium text-ink-soft'
                      }`}
                    >
                      {n.title}
                    </h3>
                    {isUnread && (
                      <span
                        className="inline-block w-2 h-2 rounded-full bg-primary-500 flex-shrink-0"
                        title="Unread notification"
                      />
                    )}
                  </div>
                  <p className="text-xs text-ink-soft leading-relaxed break-words mb-2">
                    {n.message}
                  </p>
                  <div className="flex items-center gap-3 text-[11px] text-ink-faint">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" aria-hidden="true" />
                      {formatRelativeTime(n.created_at || n.createdAt)}
                    </span>
                    {n.reference_id && (
                      <span className="inline-flex items-center gap-0.5 text-primary-600 font-medium hover:underline">
                        View incident
                        <ExternalLink className="w-2.5 h-2.5 ml-0.5" aria-hidden="true" />
                      </span>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-1 flex-shrink-0">
                  {isUnread && (
                    <IconButton
                      icon={Check}
                      size="sm"
                      variant="ghost"
                      aria-label="Mark as read"
                      title="Mark as read"
                      disabled={markReadMutation.isPending}
                      onClick={(e) => {
                        e.stopPropagation();
                        markReadMutation.mutate(n.id);
                      }}
                    />
                  )}
                  <IconButton
                    icon={Trash2}
                    size="sm"
                    variant="ghost"
                    aria-label="Delete notification"
                    title="Delete notification"
                    disabled={deleteMutation.isPending}
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteMutation.mutate(n.id);
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {pagination.totalPages > 1 && (
        <div className="pt-2 flex justify-center">
          <Pagination
            currentPage={pagination.currentPage}
            totalPages={pagination.totalPages}
            onPageChange={handlePageChange}
          />
        </div>
      )}
    </div>
  );
};

export default NotificationsPage;
