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
      className="group relative glass-effect p-3 md:p-4 rounded-xl hover:bg-white/10 transition-all duration-300 cursor-pointer"
    >
      <div className="relative mb-3 md:mb-4 overflow-hidden rounded-lg aspect-square">
        {isCurrentSong && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div className={`relative w-12 h-12 md:w-20 md:h-20 rounded-full border-2 border-accent-primary/30 flex items-center justify-center bg-black shadow-lg ${isCurrentlyPlaying ? 'animate-[spin_4s_linear_infinite]' : ''}`}>
              <div className="absolute inset-0 rounded-full border border-dashed border-accent-primary/50 opacity-50"></div>
              <Music className="text-accent-primary" size={16} md:size={24} />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 md:w-3 md:h-3 bg-black rounded-full border border-accent-primary/30"></div>
            </div>
          </div>
        )}

        <img 
          src={song.thumbnail} 
          alt={song.title} 
          className={`w-full h-full object-cover transition-transform duration-500 group-hover:scale-110 ${isCurrentSong ? 'opacity-50' : ''}`} 
        />
        <div className="absolute bottom-2 right-2 p-2 md:p-3 bg-accent-primary text-black rounded-full shadow-lg opacity-100 md:opacity-0 translate-y-0 md:translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 hover:scale-105 z-20">
          <Play size={16} md:size={20} fill="currentColor" className="ml-0.5" />
        </div>
      </div>
      
      <div className="flex flex-col gap-0.5 md:gap-1">
        <h3 className="font-bold text-white truncate text-xs md:text-sm">{song.title}</h3>
        <p className="text-[10px] md:text-xs text-text-secondary truncate">{song.artist || 'Unknown Artist'}</p>
      </div>

      <div className="mt-2 md:mt-3 flex items-center justify-between opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <button 
          onClick={(e) => {
            e.stopPropagation();
            toggleLike(song);
          }}
          className={`hover:scale-110 transition-transform ${isLiked ? 'text-accent-primary' : 'text-text-secondary hover:text-white'}`}
        >
          <Heart size={16} md:size={18} fill={isLiked ? 'currentColor' : 'none'} />
        </button>
        
        <div className="relative">
          <button 
            onClick={(e) => {
              e.stopPropagation();
              setShowPlaylistMenu(!showPlaylistMenu);
            }}
            className="text-text-secondary hover:text-white transition-colors"
          >
            <Plus size={16} md:size={18} />
          </button>

          {showPlaylistMenu && (
            <div ref={playlistMenuRef} className="absolute bottom-full right-0 mb-2 w-48 glass-effect rounded-lg shadow-xl z-50 py-1">
              <div className="px-3 py-2 text-[10px] font-bold text-text-secondary uppercase tracking-wider border-b border-white/10">Add to Playlist</div>
              {playlists.length > 0 ? (
                playlists.map(p => (
                  <button
                    key={p.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      addToPlaylist(p.id, song);
                      setShowPlaylistMenu(false);
                    }}
                    className="w-full text-left px-3 py-2 text-xs text-white hover:bg-white/10 transition-colors truncate"
                  >
                    {p.name}
                  </button>
                ))
              ) : (
                <div className="px-3 py-2 text-xs text-text-secondary italic">No playlists</div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
