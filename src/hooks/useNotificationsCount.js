import { useQuery } from '@tanstack/react-query';
import { notificationsApi } from '../api/notifications';
import { qk } from '../lib/queryKeys';
import { readPagination } from '../lib/pagination';
import { useAuthStore } from '../store/authStore';
import { usePageVisible } from './usePageVisible';

export const useNotificationsCount = () => {
  const isVisible = usePageVisible();
  const isAuthenticated = useAuthStore((s) => s.status === 'authenticated');

  const query = useQuery({
    queryKey: qk.notifications.unreadCount,
    queryFn: async () => {
      const res = await notificationsApi.getNotifications({ is_read: false, size: 1 });
      const { totalItems } = readPagination(res);
      return totalItems || 0;
    },
    enabled: isAuthenticated && isVisible,
    refetchInterval: isVisible ? 45000 : false,
    refetchIntervalInBackground: false,
    staleTime: 30000,
  });

  return {
    unreadCount: query.data ?? 0,
    ...query,
  };
};

export default useNotificationsCount;
