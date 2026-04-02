import React from 'react';
import { Play, Pause, Heart, Music } from 'lucide-react';
import { useMusic } from '../MusicContext';

export const SongCard = ({ song }) => {
  const { currentSong, isPlaying, setCurrentSong, setIsPlaying, toggleLike, likedSongs } = useMusic();

  const isCurrentSong = currentSong?.id === song.id;
  const isCurrentlyPlaying = isCurrentSong && isPlaying;
  const isLiked = likedSongs.some(s => s.id === song.id);

  const handlePlay = (e) => {
    e.stopPropagation();
    if (isCurrentSong) {
      setIsPlaying(!isPlaying);
    } else {
      setCurrentSong(song);
      setIsPlaying(true);
    }
  };

  const handleLike = (e) => {
    e.stopPropagation();
    toggleLike(song);
  };

  return (
    <div
      onClick={handlePlay}
      className={`
        group relative flex flex-col gap-3 p-3 sm:p-4 rounded-xl cursor-pointer
        transition-all duration-200 select-none
        ${isCurrentSong
          ? 'bg-white/10 border border-white/10'
          : 'bg-[#181818] hover:bg-[#282828] border border-transparent hover:border-white/5'
        }
      `}
    >
      {/* ── Thumbnail ── */}
      <div className="relative aspect-square w-full overflow-hidden rounded-lg shadow-lg flex-shrink-0">
        {song.thumbnail ? (
          <img
            src={song.thumbnail}
            alt={song.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full bg-[#282828] flex items-center justify-center">
            <Music size={32} className="text-[#b3b3b3]" />
          </div>
        )}

        {/* ── Playing Indicator Overlay ── */}
        {isCurrentSong && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            {isCurrentlyPlaying ? (
              <div className="playing-bars">
                <div className="playing-bar" />
                <div className="playing-bar" />
                <div className="playing-bar" />
              </div>
            ) : (
              <Play size={32} className="text-white" fill="white" />
            )}
          </div>
        )}

        {/* ── Play/Pause Button (hover) ── */}
        <div
          className={`
            absolute bottom-2 right-2 transition-all duration-200
            ${isCurrentSong
              ? 'opacity-100 translate-y-0'
              : 'opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0'
            }
          `}
        >
          <button
            onClick={handlePlay}
            className="w-11 h-11 bg-accent-primary text-black rounded-full flex items-center justify-center shadow-xl hover:scale-105 active:scale-95 transition-transform"
            aria-label={isCurrentlyPlaying ? 'Pause' : 'Play'}
          >
            {isCurrentlyPlaying
              ? <Pause size={20} fill="currentColor" />
              : <Play size={20} fill="currentColor" className="ml-0.5" />
            }
          </button>
        </div>

        {/* ── Like Button (hover) ── */}
        <div
          className={`
            absolute top-2 right-2 transition-all duration-200
            ${isLiked
              ? 'opacity-100'
              : 'opacity-0 group-hover:opacity-100'
            }
          `}
        >
          <button
            onClick={handleLike}
            className={`
              w-8 h-8 rounded-full flex items-center justify-center
              transition-all duration-150 active:scale-90
              ${isLiked
                ? 'bg-accent-primary/20 text-accent-primary'
                : 'bg-black/60 text-white hover:text-accent-primary'
              }
            `}
            aria-label={isLiked ? 'Unlike' : 'Like'}
          >
            <Heart size={14} fill={isLiked ? 'currentColor' : 'none'} />
          </button>
        </div>
      </div>

      {/* ── Song Info ── */}
      <div className="flex flex-col gap-0.5 min-w-0">
        <h3
          className={`
            font-bold text-sm leading-tight truncate
            ${isCurrentSong ? 'text-accent-primary' : 'text-white'}
          `}
          title={song.title}
        >
          {song.title}
        </h3>
        <p
          className="text-xs text-[#b3b3b3] truncate font-medium group-hover:text-white/70 transition-colors"
          title={song.artist || 'Unknown Artist'}
        >
          {song.artist || 'Unknown Artist'}
        </p>
      </div>
    </div>
  );
};