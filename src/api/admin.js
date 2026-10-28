import { apiClient } from './client';

export const adminApi = {
  getAdminDashboard: async () => {
    const res = await apiClient.get('/admin/dashboard');
    return res.data;
  },

  getAnalytics: async () => {
    const res = await apiClient.get('/admin/analytics');
    return res.data;
  },

  getMonthlyReport: async (params = {}) => {
    const res = await apiClient.get('/admin/reports/monthly', { params });
    return res.data;
  },

  getAdminIncidents: async (params = {}) => {
    const res = await apiClient.get('/admin/incidents', { params });
    return res.data;
  },

  getAdminIncident: async (id) => {
    const res = await apiClient.get(`/admin/incidents/${id}`);
    return res.data;
  },

  verifyIncident: async (id) => {
    const res = await apiClient.patch(`/admin/incidents/${id}/verify`);
    return res.data;
  },

  rejectIncident: async (id, reason) => {
    const payload = reason ? { reason } : {};
    const res = await apiClient.patch(`/admin/incidents/${id}/reject`, payload);
    return res.data;
  },

  assignResponder: async (id, responderId) => {
    const res = await apiClient.post(`/admin/incidents/${id}/assign`, {
      responder_id: Number(responderId),
    });
    return res.data;
  },

  reassignResponder: async (id, responderId) => {
    const res = await apiClient.post(`/admin/incidents/${id}/reassign`, {
      responder_id: Number(responderId),
    });
    return res.data;
  },

  cancelAssignment: async (assignmentId) => {
    const res = await apiClient.delete(`/admin/assignments/${assignmentId}`);
    return res.data;
  },

  getAvailableResponders: async (type) => {
    const params = type ? { responder_type: type } : {};
    const res = await apiClient.get('/admin/responders/available', { params });
    return res.data;
  },

  createResponder: async (data) => {
    const res = await apiClient.post('/admin/responders', data);
    return res.data;
  },

  getUsers: async (params = {}) => {
    const res = await apiClient.get('/admin/users', { params });
    return res.data;
  },

  getUser: async (id) => {
    const res = await apiClient.get(`/admin/users/${id}`);
    return res.data;
  },

  updateUser: async (id, data) => {
    const res = await apiClient.put(`/admin/users/${id}`, data);
    return res.data;
  },

  disableUser: async (id) => {
    const res = await apiClient.patch(`/admin/users/${id}/disable`);
    return res.data;
  },

  getNearbyIncidents: async (params = {}) => {
    const res = await apiClient.get('/incidents/nearby', { params });
    return res.data;
  },
};

export default adminApi;
