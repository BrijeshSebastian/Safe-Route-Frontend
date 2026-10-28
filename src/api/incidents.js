import { apiClient } from './client';

export const incidentsApi = {
  createIncident: async (data) => {
    const res = await apiClient.post('/incidents', data);
    return res.data;
  },

  uploadIncidentImages: async (id, files) => {
    const formData = new FormData();
    const fileList = Array.isArray(files) ? files : Array.from(files || []);
    for (const file of fileList) {
      formData.append('images', file);
    }
    const res = await apiClient.post(`/incidents/${id}/images`, formData);
    return res.data;
  },

  getMyIncidents: async (params = {}) => {
    const res = await apiClient.get('/incidents/my', { params });
    return res.data;
  },

  getIncident: async (id) => {
    const res = await apiClient.get(`/incidents/${id}`);
    return res.data;
  },

  getIncidentHistory: async (id) => {
    const res = await apiClient.get(`/incidents/${id}/status-history`);
    return res.data;
  },

  getResponderLocation: async (id) => {
    const res = await apiClient.get(`/incidents/${id}/responder-location`);
    return res.data;
  },

  updateIncident: async (id, data) => {
    const res = await apiClient.put(`/incidents/${id}`, data);
    return res.data;
  },

  cancelIncident: async (id) => {
    const res = await apiClient.patch(`/incidents/${id}/cancel`);
    return res.data;
  },

  deleteIncident: async (id) => {
    const res = await apiClient.delete(`/incidents/${id}`);
    return res.data;
  },
};

export default incidentsApi;
