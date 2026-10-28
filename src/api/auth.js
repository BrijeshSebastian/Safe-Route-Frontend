import { apiClient } from './client';

export const authApi = {
  register: async (data) => {
    const res = await apiClient.post('/auth/register', data);
    return res.data;
  },

  login: async (credentials) => {
    const res = await apiClient.post('/auth/login', credentials);
    return res.data;
  },

  logout: async (refreshToken) => {
    const res = await apiClient.post('/auth/logout', { refreshToken });
    return res.data;
  },

  forgotPassword: async (email) => {
    const res = await apiClient.post('/auth/forgot-password', { email });
    return res.data;
  },

  resetPassword: async ({ token, newPassword }) => {
    const res = await apiClient.post('/auth/reset-password', { token, newPassword });
    return res.data;
  },

  changePassword: async ({ currentPassword, newPassword }) => {
    const res = await apiClient.post('/auth/change-password', { currentPassword, newPassword });
    return res.data;
  },
};

export default authApi;
