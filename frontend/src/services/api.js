import axios from 'axios';

const api = axios.create({ baseURL: import.meta.env.VITE_BASE_URL });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  me: () => api.get('/auth/me'),
};

export const usersAPI = {
  list: () => api.get('/users'),
  create: (data) => api.post('/users', data),
  update: (id, data) => api.put(`/users/${id}`, data),
  remove: (id) => api.delete(`/users/${id}`),
};

export const productsAPI = {
  list: () => api.get('/products'),
  create: (data) => api.post('/products', data),
  update: (id, data) => api.put(`/products/${id}`, data),
  remove: (id) => api.delete(`/products/${id}`),
};

export const inventoryAPI = {
  list: () => api.get('/inventory'),
  create: (data) => api.post('/inventory', data),
  update: (id, data) => api.put(`/inventory/${id}`, data),
  remove: (id) => api.delete(`/inventory/${id}`),
  receive: (data) => api.post('/inventory/receive', data),
  transfer: (data) => api.post('/inventory/transfer', data),
};

export const statsAPI = {
  get: () => api.get('/stats'),
};

export const transactionsAPI = {
  list: (limit) => api.get('/transactions', { params: { limit } }),
};
