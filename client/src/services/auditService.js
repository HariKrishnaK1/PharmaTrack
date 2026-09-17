import API from './api';

export const auditService = {
  getAuditLogs: async (params) => {
    const res = await API.get('/audit-logs', { params });
    return res.data;
  }
};