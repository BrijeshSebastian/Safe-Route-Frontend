import { apiClient } from './client';

export const usersApi = {
  getProfile: async () => {
    const res = await apiClient.get('/users/profile');
    return res.data;
  },

  updateProfile: async (data) => {
    const res = await apiClient.put('/users/profile', data);
    return res.data;
  },

  uploadAvatar: async (file) => {
    const formData = new FormData();
    formData.append('profile_image', file);
    const res = await apiClient.post('/users/profile/image', formData);
    return res.data;
  },

  removeAvatar: async () => {
    const res = await apiClient.delete('/users/profile/image');
    return res.data;
  },

  deleteAccount: async () => {
    const res = await apiClient.delete('/users/account');
    return res.data;
  },

  logoutAll: async () => {
    const res = await apiClient.post('/users/logout-all');
    return res.data;
  },
};

export default usersApi;
