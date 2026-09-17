import API from './api';

export const analyticsService = {
  getDashboard: async () => {
    const res = await API.get('/analytics/dashboard');
    return res.data;
  },
  getReports: async (timeframe = '30d') => {
    const res = await API.get('/analytics/reports', { params: { timeframe } });
    return res.data;
  }
};