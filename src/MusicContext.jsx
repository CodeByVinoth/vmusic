import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
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
  
  // Safety net: Clean up titles that might contain timestamps or messy underscores
  const cleanTitle = song.title
    .replace(/(^|[_ ])\d{10,}([_ ]|$)/g, ' ') // Remove 10+ digit numbers (timestamps)
    .replace(/_/g, ' ')                       // Underscores to spaces
    .replace(/\s+/g, ' ')                     // Multiple spaces to single space
    .trim();

  return {
    ...song,
    title: cleanTitle,
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

  const refreshSongs = useCallback(async (force = false) => {
    if (!songs.length) {
      setIsLoading(true);
    }
    setError(null);
    try {
      const data = await fetchSongs(force);
      if (data && Array.isArray(data)) {
        const mapped = data.map(s => transformSong(s));
        setSongs(mapped);
      }
    } catch (err) {
      setError('Failed to load songs. Check your connection.');
    } finally {
      setIsLoading(false);
    }
  }, [songs.length]);

  useEffect(() => {
    refreshSongs();
  }, [refreshSongs]);
  
  // Central Audio Management
  const audioRef = useRef(new Audio());
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isScrubbing, setIsScrubbing] = useState(false);
  const [volume, setVolume] = useState(() => {
    const saved = localStorage.getItem('volume');
    return saved ? Number(saved) : 0.5;
  });
  const [isMuted, setIsMuted] = useState(false);
  const [isRepeat, setIsRepeat] = useState(false);
  const [isShuffle, setIsShuffle] = useState(false);

  // Sync audio with current song
  useEffect(() => {
    if (currentSong?.url) {
      audioRef.current.src = currentSong.url;
      if (isPlaying) {
        audioRef.current.play().catch(err => console.error("Playback failed", err));
      }
    }
  }, [currentSong?.id]);

  // Sync play/pause state
  useEffect(() => {
    if (isPlaying) {
      audioRef.current.play().catch(err => console.error("Playback failed", err));
    } else {
      audioRef.current.pause();
    }
  }, [isPlaying]);

  // Sync volume
  useEffect(() => {
    audioRef.current.volume = isMuted ? 0 : volume;
    localStorage.setItem('volume', volume.toString());
  }, [volume, isMuted]);

  // Audio Event Listeners
  useEffect(() => {
    const audio = audioRef.current;
    
    const handleTimeUpdate = () => {
      if (!isScrubbing) {
        setProgress(audio.currentTime);
      }
    };

    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
    };

    const handleEnded = () => {
      if (isRepeat) {
        audio.currentTime = 0;
        audio.play();
      } else {
        skipForward();
      }
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [isScrubbing, isRepeat]);

  const seek = useCallback((time) => {
    setIsScrubbing(true);
    audioRef.current.currentTime = time;
    setProgress(time);
    // Use a small delay to prevent the 'jump' back to old time before timeupdate catches up
    setTimeout(() => setIsScrubbing(false), 100);
  }, []);

  const skipForward = useCallback(() => {
    if (!songs.length || !currentSong) return;
    const currentIndex = songs.findIndex(s => s.id === currentSong.id);
    let nextIndex;
    if (isShuffle) {
      nextIndex = Math.floor(Math.random() * songs.length);
    } else {
      nextIndex = (currentIndex + 1) % songs.length;
    }
    setCurrentSong(songs[nextIndex]);
    setIsPlaying(true);
  }, [songs, currentSong, isShuffle]);

  const skipBack = useCallback(() => {
    if (!songs.length || !currentSong) return;
    if (audioRef.current.currentTime > 3) {
      audioRef.current.currentTime = 0;
      return;
    }
    const currentIndex = songs.findIndex(s => s.id === currentSong.id);
    const prevIndex = (currentIndex - 1 + songs.length) % songs.length;
    setCurrentSong(songs[prevIndex]);
    setIsPlaying(true);
  }, [songs, currentSong]);

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
    progress,
    duration,
    volume,
    isMuted,
    isRepeat,
    isShuffle,
    setCurrentSong,
    setIsPlaying,
    setView,
    toggleLike,
    createPlaylist,
    addToPlaylist,
    removeFromPlaylist,
    setSelectedPlaylist,
    refreshSongs,
    seek,
    skipForward,
    skipBack,
    setVolume,
    setIsMuted,
    setIsRepeat,
    setIsShuffle
  }), [songs, currentSong, isPlaying, currentView, likedSongs, playlists, selectedPlaylistId, isLoading, error, progress, duration, volume, isMuted, isRepeat, isShuffle, refreshSongs, toggleLike, createPlaylist, addToPlaylist, removeFromPlaylist, seek, skipForward, skipBack]);

  return (
    <MusicContext.Provider value={value}>
      {children}
    </MusicContext.Provider>
  );
};
