import API from './api';

export const aiService = {
  askAssistant: async (query) => {
    const res = await API.post('/ai/query', { query });
    return res.data;
  }
};