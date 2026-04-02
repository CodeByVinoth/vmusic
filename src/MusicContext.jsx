import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { fetchSongs } from './api';

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
  let hash = 0;
  for (let i = 0; i < idStr.length; i++) {
    hash = ((hash << 5) - hash) + idStr.charCodeAt(i);
    hash |= 0;
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
  const [currentView, setView] = useState('home');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPlaylistId, setSelectedPlaylist] = useState(null);

  // Playlists State
  const [playlists, setPlaylists] = useState(() => {
    const saved = localStorage.getItem('playlists');
    return saved ? JSON.parse(saved) : [];
  });

  // Liked Songs State
  const [likedSongs, setLikedSongs] = useState(() => {
    const saved = localStorage.getItem('likedSongs');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('playlists', JSON.stringify(playlists));
  }, [playlists]);

  useEffect(() => {
    localStorage.setItem('likedSongs', JSON.stringify(likedSongs));
  }, [likedSongs]);

  const refreshSongs = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchSongs();
      if (data && Array.isArray(data)) {
        const mapped = data.map(s => transformSong(s));
        setSongs(mapped);
      }
    } catch (err) {
      setError('Failed to load songs. Check your connection.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshSongs();
  }, [refreshSongs]);

  const toggleLike = useCallback((song) => {
    setLikedSongs(prev => {
      const isLiked = prev.some(s => s.id === song.id);
      if (isLiked) return prev.filter(s => s.id !== song.id);
      return [...prev, song];
    });
  }, []);

  const createPlaylist = useCallback((name) => {
    const newPlaylist = {
      id: Date.now().toString(),
      name,
      songs: []
    };
    setPlaylists(prev => [...prev, newPlaylist]);
  }, []);

  const addToPlaylist = useCallback((playlistId, song) => {
    setPlaylists(prev => prev.map(p => {
      if (p.id === playlistId) {
        if (p.songs.some(s => s.id === song.id)) return p;
        return { ...p, songs: [...p.songs, song] };
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

  const value = useMemo(() => ({
    songs,
    currentSong,
    isPlaying,
    currentView,
    likedSongs,
    playlists,
    selectedPlaylistId,
    isLoading,
    error,
    setCurrentSong,
    setIsPlaying,
    setView,
    toggleLike,
    createPlaylist,
    addToPlaylist,
    removeFromPlaylist,
    setSelectedPlaylist,
    refreshSongs
  }), [songs, currentSong, isPlaying, currentView, likedSongs, playlists, selectedPlaylistId, isLoading, error, refreshSongs, toggleLike, createPlaylist, addToPlaylist, removeFromPlaylist]);

  return (
    <MusicContext.Provider value={value}>
      {children}
    </MusicContext.Provider>
  );
};
