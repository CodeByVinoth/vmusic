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
  Heart,
  ChevronDown,
  Music,
  ListMusic,
} from 'lucide-react';
import { useMusic } from '../MusicContext';

export const FullScreenPlayer = ({ isOpen, onClose }) => {
  const { 
    currentSong, 
    isPlaying, 
    setIsPlaying, 
    songs, 
    likedSongs, 
    toggleLike,
    progress,
    duration,
    seek,
    skipForward,
    skipBack,
    isShuffle,
    setIsShuffle,
    isRepeat,
    setIsRepeat,
    isMuted,
    setIsMuted,
    volume,
    setVolume
  } = useMusic();

  const isLiked = currentSong && likedSongs.some((s) => s.id === currentSong.id);

  if (!isOpen || !currentSong) return null;

  const formatTime = (time) => {
    if (!time || isNaN(time)) return '0:00';
    const min = Math.floor(time / 60);
    const sec = Math.floor(time % 60);
    return `${min}:${sec.toString().padStart(2, '0')}`;
  };

  const handleScrub = (e) => {
    seek(Number(e.target.value));
  };

  return (
    <div className="fixed inset-0 z-[200] bg-black flex flex-col animate-slide-up">
      {/* ── Header ── */}
      <div className="flex items-center justify-between px-4 py-3 pt-6 md:pt-4">
        <button
          onClick={onClose}
          className="w-12 h-12 flex items-center justify-center rounded-full text-white/80 hover:text-white hover:bg-white/10 transition-all touch-manipulation"
          aria-label="Close full screen player"
        >
          <ChevronDown size={28} />
        </button>
        <span className="text-[10px] font-bold text-white/60 uppercase tracking-wider">
          Now Playing
        </span>
        <button
          className="w-12 h-12 flex items-center justify-center rounded-full text-white/80 hover:text-white hover:bg-white/10 transition-all touch-manipulation"
          aria-label="Queue"
        >
          <ListMusic size={22} />
        </button>
      </div>

      {/* ── Content ── */}
      <div className="flex-1 flex flex-col px-6 pb-8 overflow-y-auto">
        {/* Album Art */}
        <div className="flex-1 flex items-center justify-center py-8">
          <div className="relative w-full max-w-sm aspect-square rounded-2xl overflow-hidden shadow-2xl">
            {currentSong.thumbnail ? (
              <img
                src={currentSong.thumbnail}
                alt={currentSong.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-[#282828] flex items-center justify-center">
                <Music size={64} className="text-[#b3b3b3]" />
              </div>
            )}
            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
          </div>
        </div>

        {/* Song Info */}
        <div className="flex items-center justify-between mt-6 mb-4">
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-bold text-white truncate">
              {currentSong.title}
            </h2>
            <p className="text-sm text-[#b3b3b3] truncate mt-1">
              {currentSong.artist || 'Unknown Artist'}
            </p>
          </div>
          <button
            onClick={() => toggleLike(currentSong)}
            className={`
              w-12 h-12 flex items-center justify-center rounded-full transition-all
              ${isLiked
                ? 'text-accent-primary'
                : 'text-white/60 hover:text-white'
              }
            `}
            aria-label={isLiked ? 'Unlike' : 'Like'}
          >
            <Heart size={24} fill={isLiked ? 'currentColor' : 'none'} />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="mb-2">
          <div className="relative w-full h-1 bg-white/20 rounded-full mb-2">
            <div
              className="absolute h-full bg-accent-primary rounded-full transition-all duration-100"
              style={{ width: `${duration > 0 ? (progress / duration) * 100 : 0}%` }}
            />
            <input
              type="range"
              min="0"
              max={duration || 0}
              value={progress}
              onChange={handleScrub}
              className="absolute w-full h-full opacity-0 cursor-pointer"
              aria-label="Seek"
            />
          </div>
          <div className="flex items-center justify-between text-xs text-[#b3b3b3] font-mono">
            <span>{formatTime(progress)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between mt-6 mb-8">
          {/* Shuffle */}
          <button
            onClick={() => setIsShuffle(!isShuffle)}
            className={`
              w-10 h-10 flex items-center justify-center rounded-full transition-all
              ${isShuffle
                ? 'text-accent-primary'
                : 'text-white/60 hover:text-white'
              }
            `}
            aria-label="Shuffle"
          >
            <Shuffle size={20} />
          </button>

          {/* Previous */}
          <button
            onClick={skipBack}
            className="w-14 h-14 flex items-center justify-center text-white/80 hover:text-white transition-colors"
            aria-label="Previous"
          >
            <SkipBack size={28} fill="currentColor" />
          </button>

          {/* Play/Pause */}
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="w-18 h-18 rounded-full bg-accent-primary text-black flex items-center justify-center hover:scale-105 active:scale-95 transition-transform shadow-xl shadow-accent-primary/30"
            aria-label={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? (
              <Pause size={28} fill="currentColor" />
            ) : (
              <Play size={28} fill="currentColor" className="ml-1" />
            )}
          </button>

          {/* Next */}
          <button
            onClick={skipForward}
            className="w-14 h-14 flex items-center justify-center text-white/80 hover:text-white transition-colors"
            aria-label="Next"
          >
            <SkipForward size={28} fill="currentColor" />
          </button>

          {/* Repeat */}
          <button
            onClick={() => setIsRepeat(!isRepeat)}
            className={`
              w-10 h-10 flex items-center justify-center rounded-full transition-all
              ${isRepeat
                ? 'text-accent-primary'
                : 'text-white/60 hover:text-white'
              }
            `}
            aria-label="Repeat"
          >
            <Repeat size={20} />
          </button>
        </div>

        {/* Volume */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsMuted(!isMuted)}
            className="text-white/60 hover:text-white transition-colors flex-shrink-0"
            aria-label={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted || volume === 0 ? (
              <VolumeX size={20} />
            ) : (
              <Volume2 size={20} />
            )}
          </button>
          <div className="flex-1 relative h-1 bg-white/20 rounded-full">
            <div
              className="absolute h-full bg-white/60 rounded-full"
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
              className="absolute w-full h-full opacity-0 cursor-pointer"
              aria-label="Volume"
            />
          </div>
        </div>
      </div>
    </div>
  );
};