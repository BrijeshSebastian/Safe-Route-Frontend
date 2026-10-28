import { apiClient } from './client';

export const respondersApi = {
  getResponderDashboard: async () => {
    const res = await apiClient.get('/responders/dashboard');
    return res.data;
  },

  getAssignments: async (params = {}) => {
    const res = await apiClient.get('/responders/incidents', { params });
    return res.data;
  },

  getCompletedAssignments: async (params = {}) => {
    const res = await apiClient.get('/responders/incidents/completed', { params });
    return res.data;
  },

  getAssignment: async (id) => {
    const res = await apiClient.get(`/responders/incidents/${id}`);
    return res.data;
  },

  acceptAssignment: async (id) => {
    const res = await apiClient.patch(`/responders/incidents/${id}/accept`);
    return res.data;
  },

  rejectAssignment: async (id, notes) => {
    const body = notes ? { notes } : {};
    const res = await apiClient.patch(`/responders/incidents/${id}/reject`, body);
    return res.data;
  },

  startTravel: async (id) => {
    const res = await apiClient.patch(`/responders/incidents/${id}/start-travel`);
    return res.data;
  },

  markArrived: async (id) => {
    const res = await apiClient.patch(`/responders/incidents/${id}/arrived`);
    return res.data;
  },

  resolveAssignment: async (id, notes) => {
    const body = notes ? { notes } : {};
    const res = await apiClient.patch(`/responders/incidents/${id}/resolve`, body);
    return res.data;
  },

  sendLocation: async (latitude, longitude) => {
    const res = await apiClient.post('/responders/location', {
      latitude: Number(latitude),
      longitude: Number(longitude),
    });
    return res.data;
  },
};

export default respondersApi;
