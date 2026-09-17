import API from './api';

export const batchService = {
  getBatches: async (params) => {
    const res = await API.get('/batches', { params });
    return res.data;
  },
  getBatchById: async (id) => {
    const res = await API.get(`/batches/${id}`);
    return res.data;
  },
  createBatch: async (data) => {
    const res = await API.post('/batches', data);
    return res.data;
  },
  updateBatch: async (id, data) => {
    const res = await API.put(`/batches/${id}`, data);
    return res.data;
  },
  getFefoRecommendations: async (productId, quantity, warehouseId) => {
    const res = await API.get(`/batches/fefo-recommendations/${productId}`, {
      params: { quantity, warehouseId }
    });
    return res.data;
  }
};