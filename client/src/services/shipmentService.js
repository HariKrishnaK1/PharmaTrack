import API from './api';

export const shipmentService = {
  getShipments: async (params) => {
    const res = await API.get('/shipments', { params });
    return res.data;
  },
  getShipmentById: async (id) => {
    const res = await API.get(`/shipments/${id}`);
    return res.data;
  },
  createShipment: async (data) => {
    const res = await API.post('/shipments', data);
    return res.data;
  },
  updateStatus: async (id, status, note) => {
    const res = await API.patch(`/shipments/${id}/status`, { status, note });
    return res.data;
  }
};