import axios from 'axios';

const API_KEY = import.meta.env.VITE_API_KEY || 'song_app_secret_123';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'x-api-key': API_KEY,
    'Content-Type': 'application/json'
  }
});

export default api;
