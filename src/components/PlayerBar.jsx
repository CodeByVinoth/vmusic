import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Repeat,
  Shuffle,
  Volume2,
  VolumeX,
  Maximize2,
  ListMusic,
  Heart,
  ChevronUp,
  ChevronDown,
  Music,
} from 'lucide-react';
import { useMusic } from '../MusicContext';

export const PlayerBar = () => {
  const { currentSong, isPlaying, setIsPlaying, setCurrentSong, songs, likedSongs, toggleLike } = useMusic();
  const audioRef = useRef(null);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(() => {
    const saved = localStorage.getItem('volume');
    return saved ? Number(saved) : 0.5;
  });
  const [isShuffle, setIsShuffle] = useState(false);
  const [isRepeat, setIsRepeat] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  // Save volume preference
  useEffect(() => {
    localStorage.setItem('volume', volume.toString());
  }, [volume]);

  // Sync audio element with state
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;

      if (isPlaying && currentSong?.url) {
        const playPromise = audioRef.current.play();
        if (playPromise !== undefined) {
          playPromise.catch((error) => {
            if (error.name !== 'AbortError') {
              console.error('Playback error:', error);
              setIsPlaying(false);
            }
          });
        }
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlaying, currentSong?.url, volume, isMuted, setIsPlaying]);

  const onTimeUpdate = () => {
    if (audioRef.current) {
      setProgress(audioRef.current.currentTime);
    }
  };

  const onLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleScrub = (e) => {
    const time = Number(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setProgress(time);
    }
  };

  const handleSkipForward = useCallback(() => {
    if (!currentSong || songs.length === 0) return;
    const currentIndex = songs.findIndex((s) => s.id === currentSong.id);
    let nextIndex;
    if (isShuffle) {
      nextIndex = Math.floor(Math.random() * songs.length);
    } else {
      nextIndex = (currentIndex + 1) % songs.length;
    }
    setCurrentSong(songs[nextIndex]);
    setIsPlaying(true);
  }, [currentSong, songs, isShuffle, setCurrentSong, setIsPlaying]);

  const handleSkipBack = () => {
    if (!currentSong || songs.length === 0) return;
    if (audioRef.current && audioRef.current.currentTime > 3) {
      audioRef.current.currentTime = 0;
      return;
    }
    const currentIndex = songs.findIndex((s) => s.id === currentSong.id);
    const prevIndex = (currentIndex - 1 + songs.length) % songs.length;
    setCurrentSong(songs[prevIndex]);
    setIsPlaying(true);
  };

  const formatTime = (time) => {
    if (!time || isNaN(time)) return '0:00';
    const min = Math.floor(time / 60);
    const sec = Math.floor(time % 60);
    return `${min}:${sec.toString().padStart(2, '0')}`;
  };

  const isLiked = currentSong && likedSongs.some((s) => s.id === currentSong.id);

  // ── MOBILE MINI PLAYER ──
  if (!currentSong) return null;

  return (
    <footer className="fixed bottom-0 left-0 right-0 w-full z-[100] select-none pb-safe">
      <audio
        ref={audioRef}
        src={currentSong?.url}
        onTimeUpdate={onTimeUpdate}
        onLoadedMetadata={onLoadedMetadata}
        onEnded={() =>
          isRepeat
            ? ((audioRef.current.currentTime = 0), audioRef.current.play())
            : handleSkipForward()
        }
      />

      {/* ════════════════════════════════════
            MOBILE MINI PLAYER
        ════════════════════════════════════ */}
      <div className="md:hidden px-2 pb-2 pt-1">
        <div
          className="
            relative bg-[#181818]/97 backdrop-blur-xl border border-white/10
            rounded-2xl overflow-hidden shadow-2xl
          "
          style={{ height: 'var(--player-height-mobile)' }}
        >
          {/* Progress bar at bottom */}
          <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-white/10">
            <div
              className="h-full bg-accent-primary transition-all duration-100 ease-linear"
              style={{ width: `${duration > 0 ? (progress / duration) * 100 : 0}%` }}
            />
          </div>

          <div className="flex items-center justify-between h-full px-2">
            {/* Song info */}
            <div className="flex items-center gap-2.5 min-w-0 flex-1">
              <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 shadow-md">
                {currentSong.thumbnail ? (
                  <img
                    src={currentSong.thumbnail}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-[#282828] flex items-center justify-center">
                    <Music size={16} className="text-[#b3b3b3]" />
                  </div>
                )}
              </div>
              <div className="flex flex-col min-w-0">
                <span className="font-bold text-sm text-white truncate">
                  {currentSong.title}
                </span>
                <span className="text-xs text-[#b3b3b3] truncate">
                  {currentSong.artist || 'Unknown Artist'}
                </span>
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-2">
              {/* Like button */}
              <button
                onClick={() => toggleLike(currentSong)}
                className={`
                  w-9 h-9 flex items-center justify-center rounded-full transition-all
                  ${isLiked
                    ? 'text-accent-primary'
                    : 'text-[#b3b3b3] hover:text-white'
                  }
                `}
                aria-label={isLiked ? 'Unlike' : 'Like'}
              >
                <Heart size={18} fill={isLiked ? 'currentColor' : 'none'} />
              </button>

              {/* Play/Pause button */}
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="w-10 h-10 flex items-center justify-center text-white"
                aria-label={isPlaying ? 'Pause' : 'Play'}
              >
                {isPlaying ? (
                  <Pause size={24} fill="currentColor" />
                ) : (
                  <Play size={24} fill="currentColor" className="ml-0.5" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ════════════════════════════════════
            DESKTOP FULL PLAYER
        ════════════════════════════════════ */}
      <div className="hidden md:flex h-[var(--player-height-desktop)] bg-[#181818]/95 backdrop-blur-xl border-t border-white/10 px-4 items-center">
        <div className="w-full flex items-center justify-between gap-4 max-w-[1800px] mx-auto">

          {/* ── LEFT: Song Info ── */}
          <div className="flex items-center gap-3 w-[30%] min-w-[180px] max-w-xs">
            {currentSong ? (
              <>
                <div className="w-14 h-14 rounded-md overflow-hidden shadow-lg flex-shrink-0">
                  <img
                    src={currentSong.thumbnail}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="font-bold text-sm text-white truncate hover:underline cursor-pointer">
                    {currentSong.title}
                  </span>
                  <span className="text-xs text-[#b3b3b3] truncate hover:text-white hover:underline cursor-pointer">
                    {currentSong.artist || 'Unknown Artist'}
                  </span>
                </div>
                <button
                  onClick={() => toggleLike(currentSong)}
                  className={`
                    ml-2 w-8 h-8 flex items-center justify-center rounded-full transition-all
                    ${isLiked
                      ? 'text-accent-primary'
                      : 'text-[#b3b3b3] hover:text-white hover:bg-white/10'
                    }
                  `}
                  aria-label={isLiked ? 'Unlike' : 'Like'}
                >
                  <Heart size={16} fill={isLiked ? 'currentColor' : 'none'} />
                </button>
              </>
            ) : (
              <div className="flex items-center gap-3 opacity-30">
                <div className="w-14 h-14 bg-[#282828] rounded-md" />
                <div className="flex flex-col gap-2">
                  <div className="w-24 h-3 bg-[#282828] rounded" />
                  <div className="w-16 h-2 bg-[#282828] rounded" />
                </div>
              </div>
            )}
          </div>

          {/* ── CENTER: Controls ── */}
          <div className="flex flex-col items-center gap-2 flex-1 max-w-[722px]">
            {/* Control buttons */}
            <div className="flex items-center gap-5">
              <button
                onClick={() => setIsShuffle(!isShuffle)}
                className={`
                  w-8 h-8 flex items-center justify-center rounded-full transition-all
                  ${isShuffle
                    ? 'text-accent-primary'
                    : 'text-[#b3b3b3] hover:text-white'
                  }
                `}
                aria-label="Shuffle"
                title="Shuffle"
              >
                <Shuffle size={16} />
              </button>

              <button
                onClick={handleSkipBack}
                className="text-[#b3b3b3] hover:text-white transition-colors"
                aria-label="Previous"
                title="Previous"
              >
                <SkipBack size={20} fill="currentColor" />
              </button>

              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="w-9 h-9 rounded-full bg-white text-black flex items-center justify-center hover:scale-105 active:scale-95 transition-transform shadow-lg"
                aria-label={isPlaying ? 'Pause' : 'Play'}
              >
                {isPlaying ? (
                  <Pause size={18} fill="currentColor" />
                ) : (
                  <Play size={18} fill="currentColor" className="ml-0.5" />
                )}
              </button>

              <button
                onClick={handleSkipForward}
                className="text-[#b3b3b3] hover:text-white transition-colors"
                aria-label="Next"
                title="Next"
              >
                <SkipForward size={20} fill="currentColor" />
              </button>

              <button
                onClick={() => setIsRepeat(!isRepeat)}
                className={`
                  w-8 h-8 flex items-center justify-center rounded-full transition-all
                  ${isRepeat
                    ? 'text-accent-primary'
                    : 'text-[#b3b3b3] hover:text-white'
                  }
                `}
                aria-label="Repeat"
                title="Repeat"
              >
                <Repeat size={16} />
              </button>
            </div>

            {/* Progress bar */}
            <div className="flex w-full items-center gap-2 group">
              <span className="text-[11px] text-[#b3b3b3] min-w-[40px] text-right font-mono">
                {formatTime(progress)}
              </span>
              <div className="relative flex-1 h-1 flex items-center">
                <div className="absolute w-full h-1 bg-white/20 rounded-full" />
                <div
                  className="absolute h-1 bg-white group-hover:bg-accent-primary rounded-full transition-colors"
                  style={{ width: `${duration > 0 ? (progress / duration) * 100 : 0}%` }}
                />
                <input
                  type="range"
                  min="0"
                  max={duration || 0}
                  value={progress}
                  onChange={handleScrub}
                  className="absolute w-full z-10 opacity-0 cursor-pointer"
                  aria-label="Seek"
                />
              </div>
              <span className="text-[11px] text-[#b3b3b3] min-w-[40px] font-mono">
                {formatTime(duration)}
              </span>
            </div>
          </div>

          {/* ── RIGHT: Volume & Extra ── */}
          <div className="flex items-center justify-end gap-3 w-[30%] min-w-[180px] max-w-xs">
            <button
              className="text-[#b3b3b3] hover:text-white transition-colors"
              aria-label="Queue"
              title="Queue"
            >
              <ListMusic size={18} />
            </button>

            <div className="flex items-center gap-2 group w-32">
              <button
                onClick={() => setIsMuted(!isMuted)}
                className="text-[#b3b3b3] hover:text-white transition-colors"
                aria-label={isMuted ? 'Unmute' : 'Mute'}
              >
                {isMuted || volume === 0 ? (
                  <VolumeX size={18} />
                ) : (
                  <Volume2 size={18} />
                )}
              </button>
              <div className="relative flex-1 h-1 flex items-center">
                <div className="absolute w-full h-1 bg-white/20 rounded-full" />
                <div
                  className="absolute h-1 bg-white group-hover:bg-accent-primary rounded-full transition-colors"
                  style={{ width: `${isMuted ? 0 : volume * 100}%` }}
                />
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={isMuted ? 0 : volume}
                  onChange={(e) => {
                    setVolume(Number(e.target.value));
                    setIsMuted(false);
                  }}
                  className="absolute w-full z-10 opacity-0 cursor-pointer"
                  aria-label="Volume"
                />
              </div>
            </div>

            <button
              className="text-[#b3b3b3] hover:text-white transition-colors"
              aria-label="Full screen"
              title="Full screen"
            >
              <Maximize2 size={16} />
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};