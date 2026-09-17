import API from './api';

export const userService = {
  getUsers: async (params) => {
    const res = await API.get('/users', { params });
    return res.data;
  },
  createUser: async (data) => {
    const res = await API.post('/users', data);
    return res.data;
  },
  updateUser: async (id, data) => {
    const res = await API.put(`/users/${id}`, data);
    return res.data;
  },
  toggleStatus: async (id) => {
    const res = await API.patch(`/users/${id}/status`);
    return res.data;
  }
};