import { apiClient } from './client';

export const notificationsApi = {
  getNotifications: async (params = {}) => {
    const res = await apiClient.get('/notifications', { params });
    return res.data;
  },

  getNotification: async (id) => {
    const res = await apiClient.get(`/notifications/${id}`);
    return res.data;
  },

  markRead: async (id) => {
    const res = await apiClient.patch(`/notifications/${id}/read`);
    return res.data;
  },

  markAllRead: async () => {
    const res = await apiClient.patch('/notifications/read-all');
    return res.data;
  },

  deleteNotification: async (id) => {
    const res = await apiClient.delete(`/notifications/${id}`);
    return res.data;
  },
};

export default notificationsApi;
