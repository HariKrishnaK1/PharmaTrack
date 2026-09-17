import API from './api';

export const inventoryService = {
  getInventory: async (params) => {
    const res = await API.get('/inventory', { params });
    return res.data;
  },
  recordMovement: async (data) => {
    const res = await API.post('/inventory/movement', data);
    return res.data;
  },
  getMovements: async (params) => {
    const res = await API.get('/inventory/movements', { params });
    return res.data;
  }
};