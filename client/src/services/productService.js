import API from './api';

export const productService = {
  getProducts: async (params) => {
    const res = await API.get('/products', { params });
    return res.data;
  },
  getProductById: async (id) => {
    const res = await API.get(`/products/${id}`);
    return res.data;
  },
  createProduct: async (data) => {
    const res = await API.post('/products', data);
    return res.data;
  },
  updateProduct: async (id, data) => {
    const res = await API.put(`/products/${id}`, data);
    return res.data;
  },
  deleteProduct: async (id) => {
    const res = await API.delete(`/products/${id}`);
    return res.data;
  }
};