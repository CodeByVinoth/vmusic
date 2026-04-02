import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { fetchSongs } from './api';

// Removed TypeScript interfaces to fix [PARSE_ERROR] in JSX environment

const MusicContext = createContext(undefined);

const REPEAT_IMAGES = [
  'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&q=80',
  'https://images.unsplash.com/photo-1493225255756-d9584f8606e9?w=800&q=80',
  'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&q=80',
  'https://images.unsplash.com/photo-1514525253361-bee8718a300a?w=800&q=80',
  'https://images.unsplash.com/photo-1459749411177-042180ce673f?w=800&q=80'
];

const getRepeatedThumbnail = (songId) => {
  if (!songId) return REPEAT_IMAGES[0];
  const idStr = String(songId);
  // Simple stable hash function
  let hash = 0;
  for (let i = 0; i < idStr.length; i++) {
    hash = ((hash << 5) - hash) + idStr.charCodeAt(i);
    hash |= 0; // Convert to 32bit integer
  }
  return REPEAT_IMAGES[Math.abs(hash) % REPEAT_IMAGES.length];
};

const transformSong = (song) => {
  if (!song) return null;
  return {
    ...song,
    thumbnail: song.thumbnail || getRepeatedThumbnail(song.id)
  };
};

export const useMusic = () => {
  const context = useContext(MusicContext);
  if (context === undefined) {
    throw new Error('useMusic must be used within a MusicProvider');
  }
  return context;
};

export const MusicProvider = ({ children }) => {
  const [songs, setSongs] = useState([]);
  const [currentSong, setCurrentSong] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [likedSongs, setLikedSongs] = useState([]);
  const [playlists, setPlaylists] = useState([]);
  const [currentView, setCurrentView] = useState('home');
  const [selectedPlaylistId, setSelectedPlaylist] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const safeSetSongs = useCallback((newSongs) => {
    if (newSongs && Array.isArray(newSongs)) {
      const mappedSongs = newSongs.map((song) => transformSong(song));
      setSongs(mappedSongs);
    }
  }, []);

  const safeSetCurrentSong = useCallback((song) => {
    if (!song) {
      setCurrentSong(null);
      return;
    }
    setCurrentSong(transformSong(song));
  }, []);

  const safeSetIsLoading = useCallback((loading) => {
    setIsLoading(loading);
  }, []);

  const safeSetError = useCallback((err) => {
    setError(err);
  }, []);

  const refreshSongs = useCallback(async () => {
    safeSetIsLoading(true);
    safeSetError(null);
    try {
      const result = await fetchSongs();
      safeSetSongs(result);
      if (result.length === 0) {
        safeSetError('Your library is currently empty. Try adding songs in Admin.');
      }
    } catch (err) {
      console.error('Refresh Songs Error:', err);
      safeSetError('Failed to load music. Please check your connection.');
    } finally {
      safeSetIsLoading(false);
    }
  }, [safeSetSongs, safeSetIsLoading, safeSetError]);

  // Load from localStorage
  useEffect(() => {
    try {
      const savedLikes = localStorage.getItem('likedSongs');
      const savedPlaylists = localStorage.getItem('playlists');
      
      if (savedLikes) {
        const parsedLikes = JSON.parse(savedLikes);
        setLikedSongs(parsedLikes.map(s => transformSong(s)));
      }
      if (savedPlaylists) {
        const parsedPlaylists = JSON.parse(savedPlaylists);
        setPlaylists(parsedPlaylists.map(p => ({
          ...p,
          songs: p.songs.map(s => transformSong(s))
        })));
      }
    } catch (e) {
      console.error('Failed to load from localStorage', e);
    }
  }, []);

  // Initial load
  useEffect(() => {
    refreshSongs();
  }, [refreshSongs]);

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem('likedSongs', JSON.stringify(likedSongs));
  }, [likedSongs]);

  useEffect(() => {
    localStorage.setItem('playlists', JSON.stringify(playlists));
  }, [playlists]);

  const toggleLike = useCallback((song) => {
    setLikedSongs(prev => {
      const isLiked = prev.some(s => s.id === song.id);
      if (isLiked) {
        return prev.filter(s => s.id !== song.id);
      }
      // Ensure the thumbnail is updated and stable via hash
      const updatedSong = transformSong(song);
      return [...prev, updatedSong];
    });
  }, []);

  const createPlaylist = useCallback((name) => {
    const newPlaylist = {
      id: Math.random().toString(36).substr(2, 9),
      name,
      songs: []
    };
    setPlaylists(prev => [...prev, newPlaylist]);
  }, []);

  const addToPlaylist = useCallback((playlistId, song) => {
    setPlaylists(prev => prev.map(p => {
      if (p.id === playlistId) {
        // Prevent duplicate songs in playlist
        if (p.songs.some(s => s.id === song.id)) return p;
        // Ensure the thumbnail is updated and stable via hash
        const updatedSong = transformSong(song);
        return { ...p, songs: [...p.songs, updatedSong] };
      }
      return p;
    }));
  }, []);

  const removeFromPlaylist = useCallback((playlistId, songId) => {
    setPlaylists(prev => prev.map(p => {
      if (p.id === playlistId) {
        return { ...p, songs: p.songs.filter(s => s.id !== songId) };
      }
      return p;
    }));
  }, []);

  const setView = useCallback((view) => {
    setCurrentView(view);
    const mainView = document.querySelector('.overflow-y-auto');
    if (mainView) mainView.scrollTop = 0;
  }, []);

  return (
    <MusicContext.Provider value={{
      songs, currentSong, isPlaying, likedSongs, playlists, currentView, selectedPlaylistId, isLoading, error,
      setSongs: safeSetSongs, setCurrentSong: safeSetCurrentSong, setIsPlaying, toggleLike, createPlaylist, addToPlaylist, removeFromPlaylist, setView, setSelectedPlaylist, setIsLoading: safeSetIsLoading, setError: safeSetError, refreshSongs
    }}>
      {children}
    </MusicContext.Provider>
  );
};
