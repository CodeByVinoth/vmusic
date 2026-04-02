import React from 'react';
import { Play, Heart, Plus, Music } from 'lucide-react';
import { useMusic } from '../MusicContext';

export const SongCard = ({ song }) => {
  const { setCurrentSong, setIsPlaying, toggleLike, likedSongs, addToPlaylist, playlists, currentSong, isPlaying } = useMusic();
  const isLiked = likedSongs.some(s => s.id === song.id);
  const [showPlaylistMenu, setShowPlaylistMenu] = React.useState(false);
  const playlistMenuRef = React.useRef(null);

  const isCurrentSong = currentSong?.id === song.id;
  const isCurrentlyPlaying = isCurrentSong && isPlaying;

  React.useEffect(() => {
    const handleClickOutside = (event) => {
      if (playlistMenuRef.current && !playlistMenuRef.current.contains(event.target)) {
        setShowPlaylistMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div 
      onClick={() => {
        setCurrentSong(song);
        setIsPlaying(true);
      }}
      className={`group relative glass-effect p-3 md:p-4 rounded-2xl transition-all duration-500 cursor-pointer overflow-hidden border border-white/5 hover:border-accent-primary/20 hover:bg-white/5 active:scale-95 active:bg-white/10 ${isCurrentSong ? 'ring-1 ring-accent-primary/50 bg-white/5' : ''}`}
    >
      <div className="relative mb-3 md:mb-4 overflow-hidden rounded-xl aspect-square shadow-2xl">
        {isCurrentSong && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/40 backdrop-blur-[2px]">
            <div className={`relative w-12 h-12 md:w-16 md:h-16 rounded-full border-2 border-accent-primary flex items-center justify-center bg-black/80 shadow-[0_0_20px_rgba(29,185,84,0.4)] ${isCurrentlyPlaying ? 'animate-[spin_6s_linear_infinite]' : ''}`}>
              <Music className="text-accent-primary" size={16} md:size={20} />
              {isCurrentlyPlaying && (
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-accent-primary rounded-full flex items-center justify-center border-2 border-black">
                  <div className="w-1.5 h-1.5 bg-black rounded-full animate-pulse" />
                </div>
              )}
            </div>
          </div>
        )}

        <img 
          src={song.thumbnail} 
          alt={song.title} 
          className={`w-full h-full object-cover transition-all duration-700 group-hover:scale-110 ${isCurrentSong ? 'scale-105 brightness-50' : 'brightness-90 group-hover:brightness-100'}`} 
        />
        
        {/* Professional Play Overlay (Desktop) */}
        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 hidden md:flex items-center justify-center">
          <div className="p-4 bg-accent-primary text-black rounded-full shadow-2xl scale-75 group-hover:scale-100 transition-transform duration-300">
            <Play size={24} fill="currentColor" />
          </div>
        </div>
      </div>
      
      <div className="flex flex-col gap-0.5 md:gap-1 relative z-20">
        <h3 className={`font-black truncate text-xs md:text-sm tracking-tight transition-colors ${isCurrentSong ? 'text-accent-primary' : 'text-white'}`}>
          {song.title}
        </h3>
        <p className="text-[10px] md:text-xs text-text-secondary truncate font-bold opacity-70 group-hover:opacity-100 transition-opacity">
          {song.artist || 'Unknown Artist'}
        </p>
      </div>

      {/* Action Buttons */}
      <div className="mt-3 flex items-center justify-between relative z-20 opacity-100 md:opacity-0 group-hover:opacity-100 transition-all duration-300">
        <button 
          onClick={(e) => {
            e.stopPropagation();
            toggleLike(song);
          }}
          className={`p-2 -ml-2 rounded-full hover:bg-white/10 transition-all active:scale-125 ${isLiked ? 'text-accent-primary' : 'text-text-secondary hover:text-white'}`}
        >
          <Heart size={16} md:size={18} fill={isLiked ? 'currentColor' : 'none'} strokeWidth={isLiked ? 0 : 2.5} />
        </button>
        
        <div className="relative">
          <button 
            onClick={(e) => {
              e.stopPropagation();
              setShowPlaylistMenu(!showPlaylistMenu);
            }}
            className="p-2 -mr-2 text-text-secondary hover:text-white hover:bg-white/10 rounded-full transition-all active:rotate-90"
          >
            <Plus size={16} md:size={18} strokeWidth={2.5} />
          </button>

          {showPlaylistMenu && (
            <div 
              ref={playlistMenuRef} 
              className="absolute bottom-full right-0 mb-2 w-48 bg-[#181818] border border-white/10 rounded-xl shadow-2xl z-50 py-2 animate-slide-down"
            >
              <div className="px-4 py-2 text-[10px] font-black text-text-secondary uppercase tracking-[0.1em] border-b border-white/5 mb-1">Add to Playlist</div>
              <div className="max-h-48 overflow-y-auto custom-scrollbar">
                {playlists.length > 0 ? (
                  playlists.map(p => (
                    <button
                      key={p.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        addToPlaylist(p.id, song);
                        setShowPlaylistMenu(false);
                      }}
                      className="w-full text-left px-4 py-2.5 text-xs font-bold text-white hover:bg-accent-primary hover:text-black transition-all truncate"
                    >
                      {p.name}
                    </button>
                  ))
                ) : (
                  <div className="px-4 py-3 text-xs text-text-secondary italic">No playlists found</div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
