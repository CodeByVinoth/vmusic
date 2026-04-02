import api from './axiosInstance';

export const fetchSongs = async () => {
  try {
    const response = await api.get('/songs', {
      timeout: 15000
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
