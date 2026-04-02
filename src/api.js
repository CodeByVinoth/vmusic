import api from './axiosInstance';

export const fetchSongs = async (force = false) => {
  try {
    // Cache-busting: add a timestamp to ensure we always get the latest version
    const timestamp = new Date().getTime();
    const url = force ? `/songs?force=true&t=${timestamp}` : `/songs?t=${timestamp}`;
    const response = await api.get(url, {
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
