import api from './api';

export const addressService = {
  getAddresses: async () => { const res = await api.get('/addresses'); return res.data; },
  addAddress: async (data) => { const res = await api.post('/addresses', data); return res.data; },
  updateAddress: async (id, data) => { const res = await api.put(`/addresses/${id}`, data); return res.data; },
  deleteAddress: async (id) => { const res = await api.delete(`/addresses/${id}`); return res.data; },
  setDefault: async (id) => { const res = await api.put(`/addresses/${id}/default`); return res.data; },
};
