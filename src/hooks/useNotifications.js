import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationsApi } from '../api/notifications';
import { qk } from '../lib/queryKeys';
import { usePageVisible } from './usePageVisible';
import { useAuthStore } from '../store/authStore';
import toast from 'react-hot-toast';

export const useNotifications = (params = {}) => {
  const isVisible = usePageVisible();
  const isAuthenticated = useAuthStore((s) => s.status === 'authenticated');

  return useQuery({
    queryKey: qk.notifications.list(params),
    queryFn: () => notificationsApi.getNotifications(params),
    enabled: isAuthenticated && isVisible,
    refetchInterval: isVisible ? 30000 : false,
    refetchIntervalInBackground: false,
    staleTime: 15000,
  });
};

export const useMarkNotificationRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id) => notificationsApi.markRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.notifications.all });
      queryClient.invalidateQueries({ queryKey: qk.notifications.unreadCount });
    },
  });
};

export const useMarkAllNotificationsRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => notificationsApi.markAllRead(),
    onSuccess: () => {
      toast.success('All notifications marked as read');
      queryClient.invalidateQueries({ queryKey: qk.notifications.all });
      queryClient.invalidateQueries({ queryKey: qk.notifications.unreadCount });
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to mark notifications as read');
    },
  });
};

export const useDeleteNotification = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id) => notificationsApi.deleteNotification(id),
    onSuccess: () => {
      toast.success('Notification removed');
      queryClient.invalidateQueries({ queryKey: qk.notifications.all });
      queryClient.invalidateQueries({ queryKey: qk.notifications.unreadCount });
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to delete notification');
    },
  });
};
