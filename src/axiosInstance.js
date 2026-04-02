import axios from 'axios';

const API_KEY = import.meta.env.VITE_API_KEY;

const api = axios.create({
  baseURL: '/api',
  headers: {
    'x-api-key': API_KEY,
    'Content-Type': 'application/json'
  }
});

// Add a request interceptor to include the Bearer token if it exists
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

export default api;
