import API from './api';

export const alertService = {
  getAlerts: async (params) => {
    const res = await API.get('/alerts', { params });
    return res.data;
  },
  markRead: async (id) => {
    const res = await API.patch(`/alerts/${id}/read`);
    return res.data;
  },
  resolveAlert: async (id, resolutionNote) => {
    const res = await API.patch(`/alerts/${id}/resolve`, { resolutionNote });
    return res.data;
  },
  evaluateAlerts: async () => {
    const res = await API.post('/alerts/evaluate');
    return res.data;
  }
};