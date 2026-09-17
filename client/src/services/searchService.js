import API from './api';

export const searchService = {
  searchGlobal: async (q) => {
    const res = await API.get('/search', { params: { q } });
    return res.data;
  }
};