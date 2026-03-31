import axios from 'axios';

const API_URL = '/api';
const API_KEY = import.meta.env.VITE_API_KEY || 'song_app_secret_123';

export const fetchSongs = async () => {
  try {
    const response = await axios.get(`${API_URL}/songs`, {
      timeout: 15000,
      headers: {
        'x-api-key': API_KEY
      }
    });
    
    if (response.data && Array.isArray(response.data)) {
      return response.data;
    }
    return [];
  } catch (error) {
    console.error('API.js Fetch Error Details:', error);
    return [];
  }
};
