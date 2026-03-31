import React, { useState } from 'react';
import { useMusic } from '../MusicContext';
import { useAuth } from '../AuthContext';
import { SongCard } from './SongCard';
import { AdminPage } from '../pages/AdminPage';
import { LoginPage } from '../pages/LoginPage';
import { Search as SearchIcon, Heart, AlertCircle, RefreshCw, Clock, Hash } from 'lucide-react';

export const MainView = () => {
  const { currentView, songs, likedSongs, playlists, selectedPlaylistId, isLoading, error, refreshSongs } = useMusic();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredSongs = songs.filter(s => 
    s.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (s.artist && s.artist.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const selectedPlaylist = playlists.find(p => p.id === selectedPlaylistId);

  const handleRetry = async () => {
    refreshSongs();
  };

  return (
    <div className="flex-1 bg-transparent text-white p-4 md:p-8 overflow-y-auto h-full relative scroll-smooth">
      <div className="relative z-10 max-w-7xl mx-auto">
        
        {/* --- HOME VIEW --- */}
        {currentView === 'home' && (
          <div className="flex flex-col gap-6 md:gap-8 animate-fade-in">
            <header className="flex flex-col gap-2">
              <h1 className="text-3xl md:text-5xl font-black tracking-tighter text-white">
                Discover
              </h1>
              <div className="h-1 w-12 md:w-16 bg-accent-primary rounded-full" />
            </header>
            
            {error ? (
              <div className="flex flex-col items-center justify-center py-20 px-6 text-center gap-6 glass-effect rounded-2xl border-red-500/20">
                <div className="p-4 bg-red-500/10 rounded-full">
                  <AlertCircle size={40} className="text-red-500" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold mb-2 text-white">System Error</h2>
                  <p className="text-text-secondary max-w-md">{error}</p>
                </div>
                <button 
                  onClick={handleRetry}
                  className="px-8 py-3 bg-white text-black rounded-full font-bold hover:bg-accent-primary hover:text-white transition-colors flex items-center gap-2"
                >
                  <RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} />
                  Retry
                </button>
              </div>
            ) : isLoading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                {[...Array(10)].map((_, i) => (
                  <div key={i} className="glass-effect p-4 rounded-xl animate-pulse">
                    <div className="aspect-square bg-white/10 rounded-lg mb-4"></div>
                    <div className="h-4 bg-white/10 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-white/10 rounded w-1/2"></div>
                  </div>
                ))}
              </div>
            ) : songs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-32 glass-effect rounded-2xl border-dashed border-white/10">
                <SearchIcon size={48} className="text-white/20 mb-4" />
                <p className="text-xl font-bold text-white/40">No songs found</p>
                <p className="text-text-secondary text-sm mt-2">Upload tracks in Admin to begin.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 pb-32">
                {songs.map(song => (
                  <SongCard key={song.id} song={song} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* --- SEARCH VIEW --- */}
        {currentView === 'search' && (
          <div className="flex flex-col gap-8 animate-fade-in">
            <div className="relative group max-w-2xl">
              <SearchIcon className="absolute left-5 top-1/2 -translate-y-1/2 text-text-secondary group-focus-within:text-accent-primary transition-colors" size={24} />
              <input
                type="text"
                placeholder="Search songs, artists..."
                className="w-full glass-effect text-white py-4 pl-14 pr-6 rounded-xl text-lg outline-none focus:border-accent-primary transition-colors placeholder:text-text-secondary"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
              />
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              {filteredSongs.length > 0 ? (
                filteredSongs.map(song => (
                  <SongCard key={song.id} song={song} />
                ))
              ) : searchQuery && (
                <div className="col-span-full py-20 text-center">
                  <h2 className="text-2xl font-bold text-text-secondary">No results for "{searchQuery}"</h2>
                </div>
              )}
            </div>
          </div>
        )}

        {/* --- LIKED SONGS VIEW --- */}
        {currentView === 'liked' && (
          <div className="flex flex-col gap-8 animate-fade-in">
            <div className="flex flex-col md:flex-row items-end gap-6 glass-effect p-8 rounded-2xl">
              <div className="w-48 h-48 bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center rounded-xl shadow-lg">
                <Heart size={80} fill="white" />
              </div>
              <div className="flex flex-col gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-text-secondary">Playlist</span>
                <h1 className="text-5xl md:text-7xl font-black tracking-tighter">Liked Songs</h1>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-sm font-bold text-white">{user?.username || 'User'}</span>
                  <span className="text-sm text-text-secondary">• {likedSongs.length} songs</span>
                </div>
              </div>
            </div>
            
            <div className="glass-effect rounded-2xl overflow-hidden mb-32">
              <div className="grid grid-cols-[48px_1fr_100px] gap-4 px-8 py-4 text-text-secondary text-xs font-bold uppercase tracking-wider border-b border-white/10">
                <span className="flex items-center"><Hash size={16} /></span>
                <span>Title</span>
                <span className="text-right flex items-center justify-end"><Clock size={16} /></span>
              </div>
              <div className="p-2">
                {likedSongs.length > 0 ? (
                  likedSongs.map((song, index) => (
                    <SongRow key={song.id} song={song} index={index + 1} />
                  ))
                ) : (
                  <div className="py-20 text-center text-text-secondary">No liked songs yet.</div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* --- PLAYLIST VIEW --- */}
        {currentView === 'playlist' && selectedPlaylist && (
          <div className="flex flex-col gap-8 animate-fade-in">
            <div className="flex flex-col md:flex-row items-end gap-6 glass-effect p-8 rounded-2xl">
              <div className="w-48 h-48 bg-white/10 flex items-center justify-center rounded-xl shadow-lg">
                 <span className="text-8xl font-black text-white/50 uppercase">{selectedPlaylist.name[0]}</span>
              </div>
              <div className="flex flex-col gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-text-secondary">Playlist</span>
                <h1 className="text-5xl md:text-7xl font-black tracking-tighter">{selectedPlaylist.name}</h1>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-sm font-bold text-white">{user?.username || 'User'}</span>
                  <span className="text-sm text-text-secondary">• {selectedPlaylist.songs.length} songs</span>
                </div>
              </div>
            </div>
            
            <div className="glass-effect rounded-2xl overflow-hidden mb-32">
              <div className="grid grid-cols-[48px_1fr_120px] gap-4 px-8 py-4 text-text-secondary text-xs font-bold uppercase tracking-wider border-b border-white/10">
                <span>#</span>
                <span>Title</span>
                <span className="text-right">Actions</span>
              </div>
              <div className="p-2">
                {selectedPlaylist.songs.length > 0 ? (
                  selectedPlaylist.songs.map((song, index) => (
                    <SongRow key={song.id} song={song} index={index + 1} playlistId={selectedPlaylist.id} />
                  ))
                ) : (
                  <div className="py-20 text-center text-text-secondary">This playlist is empty.</div>
                )}
              </div>
            </div>
          </div>
        )}

        {currentView === 'admin' && (
          <div className="animate-fade-in">
            {user ? <AdminPage /> : <LoginPage />}
          </div>
        )}
      </div>
    </div>
  );
};

const SongRow = ({ song, index, playlistId }) => {
  const { setCurrentSong, setIsPlaying, toggleLike, likedSongs, removeFromPlaylist, currentSong, isPlaying } = useMusic();
  const isLiked = likedSongs.some(s => s.id === song.id);
  const isCurrent = currentSong?.id === song.id;

  return (
    <div 
      className={`group grid grid-cols-[48px_1fr_120px] items-center gap-4 px-6 py-3 rounded-lg transition-colors cursor-pointer ${
        isCurrent ? 'bg-white/10' : 'hover:bg-white/5'
      }`}
      onClick={() => {
        setCurrentSong(song);
        setIsPlaying(true);
      }}
    >
      <div className="flex items-center justify-center">
        {isCurrent && isPlaying ? (
          <div className="flex items-end gap-0.5 h-4">
            <div className="w-1 bg-accent-primary animate-[bounce_0.6s_infinite] h-full" />
            <div className="w-1 bg-accent-primary animate-[bounce_0.8s_infinite] h-2/3" />
            <div className="w-1 bg-accent-primary animate-[bounce_0.5s_infinite] h-1/2" />
          </div>
        ) : (
          <span className={`text-sm font-bold tabular-nums ${isCurrent ? 'text-accent-primary' : 'text-text-secondary group-hover:text-white'}`}>{index}</span>
        )}
      </div>
      
      <div className="flex items-center gap-4 overflow-hidden">
        <img src={song.thumbnail} alt={song.title} className="w-10 h-10 object-cover rounded" />
        <div className="flex flex-col overflow-hidden">
          <h4 className={`font-bold truncate text-sm ${isCurrent ? 'text-accent-primary' : 'text-white'}`}>{song.title}</h4>
          <p className="text-xs text-text-secondary truncate">
            {song.artist || 'Unknown Artist'}
          </p>
        </div>
      </div>

      <div className="flex justify-end items-center gap-4">
        <button 
          onClick={(e) => {
            e.stopPropagation();
            toggleLike(song);
          }}
          className={`transition-transform hover:scale-110 ${isLiked ? 'text-accent-primary' : 'text-text-secondary opacity-0 group-hover:opacity-100 hover:text-white'}`}
        >
          <Heart size={18} fill={isLiked ? 'currentColor' : 'none'} />
        </button>
        
        {playlistId && (
          <button 
            onClick={(e) => {
              e.stopPropagation();
              removeFromPlaylist(playlistId, song.id);
            }}
            className="text-xs font-bold text-text-secondary hover:text-red-500 opacity-0 group-hover:opacity-100 transition-colors"
          >
            Remove
          </button>
        )}
      </div>
    </div>
  );
};
