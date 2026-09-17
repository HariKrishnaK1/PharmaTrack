import API from './api';

export const warehouseService = {
  getWarehouses: async (params) => {
    const res = await API.get('/warehouses', { params });
    return res.data;
  },
  getWarehouseById: async (id) => {
    const res = await API.get(`/warehouses/${id}`);
    return res.data;
  },
  createWarehouse: async (data) => {
    const res = await API.post('/warehouses', data);
    return res.data;
  },
  updateWarehouse: async (id, data) => {
    const res = await API.put(`/warehouses/${id}`, data);
    return res.data;
  }
};