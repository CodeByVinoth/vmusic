import React, { useState, useEffect } from 'react';
import { useMusic } from '../MusicContext';
import { useAuth } from '../AuthContext';
import { SongCard } from './SongCard';
import { AdminPage } from '../pages/AdminPage';
import { LoginPage } from '../pages/LoginPage';
import { 
  Search as SearchIcon, 
  Heart, 
  AlertCircle, 
  RefreshCw, 
  Clock, 
  Hash, 
  Music, 
  Play,
  Filter,
  ChevronLeft,
  ChevronRight,
  User,
  MoreHorizontal
} from 'lucide-react';

export const MainView = () => {
  const { currentView, setView, songs, likedSongs, playlists, selectedPlaylistId, isLoading, error, refreshSongs } = useMusic();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [isScrolled, setIsScrolled] = useState(false);

  // Handle scroll effect for header
  const handleScroll = (e) => {
    setIsScrolled(e.target.scrollTop > 50);
  };

  const filteredSongs = songs.filter(s => 
    (s.title && s.title.toLowerCase().includes(searchQuery.toLowerCase())) || 
    (s.artist && s.artist.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const selectedPlaylist = playlists.find(p => p.id === selectedPlaylistId);

  // Dynamic Background Colors based on View
  const getViewStyles = () => {
    switch(currentView) {
      case 'liked': return 'from-[#5038a0]';
      case 'playlist': return 'from-[#2e3033]';
      case 'admin': return 'from-[#1e3264]';
      default: return 'from-[#121212]';
    }
  };

  return (
    <div 
      onScroll={handleScroll}
      className="flex-1 bg-black overflow-hidden flex flex-col h-full relative"
    >
      {/* Dynamic Header Background */}
      <div 
        className={`absolute top-0 left-0 w-full h-[300px] bg-gradient-to-b ${getViewStyles()} to-bg-base/20 transition-colors duration-500`} 
      />

      {/* Sticky Top Bar */}
      <header className={`sticky top-0 z-40 flex items-center justify-between px-8 py-4 transition-all duration-300 ${isScrolled ? 'bg-[#070707]' : 'bg-transparent'}`}>
        <div className="flex items-center gap-4">
          <div className="flex gap-2">
            <button className="w-8 h-8 rounded-full bg-black/40 flex items-center justify-center text-white/40 cursor-not-allowed">
              <ChevronLeft size={24} />
            </button>
            <button className="w-8 h-8 rounded-full bg-black/40 flex items-center justify-center text-white/40 cursor-not-allowed">
              <ChevronRight size={24} />
            </button>
          </div>
          
          {currentView === 'search' && (
            <div className="relative group max-w-md ml-4">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-white" size={20} />
              <input 
                type="text" 
                placeholder="What do you want to listen to?" 
                className="w-[364px] bg-bg-highlight hover:bg-[#3e3e3e] border-none focus:ring-2 focus:ring-white text-white py-3 pl-10 pr-4 rounded-full text-sm outline-none transition-all placeholder:text-text-muted"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          )}
        </div>

        <div className="flex items-center gap-4">
          <button className="text-sm font-bold text-text-muted hover:text-white hover:scale-105 transition-all">Support</button>
          <button className="w-8 h-8 rounded-full bg-bg-highlight flex items-center justify-center text-text-muted hover:text-white hover:scale-105 transition-all">
            <User size={20} />
          </button>
        </div>
      </header>

      <div className="relative z-10 flex-1 overflow-y-auto custom-scrollbar px-8 pb-32">
        {/* --- HOME VIEW --- */}
        {currentView === 'home' && (
          <div className="flex flex-col gap-8 animate-slide-up">
            <h1 className="text-3xl font-bold tracking-tight mt-4">Good Afternoon</h1>
            
            <section>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {songs.slice(0, 6).map((song) => (
                  <div key={song.id} className="flex items-center gap-4 bg-white/5 hover:bg-white/10 transition-colors rounded overflow-hidden group cursor-pointer">
                    <img src={song.thumbnail} alt="" className="w-20 h-20 object-cover shadow-lg" />
                    <span className="font-bold truncate pr-4">{song.title}</span>
                    <button className="ml-auto mr-4 w-12 h-12 rounded-full bg-accent-primary flex items-center justify-center shadow-xl opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0 text-black">
                      <Play fill="black" size={24} />
                    </button>
                  </div>
                ))}
              </div>
            </section>

            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold hover:underline cursor-pointer">Made For You</h2>
                <button className="text-sm font-bold text-text-muted hover:underline">Show all</button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-6">
                {isLoading ? (
                  Array(6).fill(0).map((_, i) => <SongCardSkeleton key={i} />)
                ) : error ? (
                  <ErrorState message={error} onRetry={refreshSongs} />
                ) : (
                  songs.map((song, index) => <SongCard key={`${song.id}-${index}`} song={song} />)
                )}
              </div>
            </section>
          </div>
        )}

        {/* --- SEARCH VIEW --- */}
        {currentView === 'search' && (
          <div className="flex flex-col gap-8 animate-slide-up pt-4">
            <h2 className="text-2xl font-bold">Browse all</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-6">
              {searchQuery ? (
                filteredSongs.map((song, index) => <SongCard key={`${song.id}-${index}`} song={song} />)
              ) : (
                ['Pop', 'Rock', 'Hip-Hop', 'Jazz', 'Indie', 'Classical'].map((genre, i) => (
                  <div key={genre} className={`h-48 rounded-lg p-4 relative overflow-hidden cursor-pointer hover:brightness-110 transition-all ${
                    ['bg-pink-600', 'bg-blue-600', 'bg-orange-600', 'bg-emerald-600', 'bg-purple-600', 'bg-red-600'][i]
                  }`}>
                    <span className="text-2xl font-bold">{genre}</span>
                    <div className="absolute -right-4 -bottom-2 w-24 h-24 bg-white/20 rotate-[25deg] shadow-2xl" />
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* --- LIKED & PLAYLIST VIEW --- */}
        {(currentView === 'liked' || (currentView === 'playlist' && selectedPlaylist)) && (
          <div className="flex flex-col gap-8 animate-slide-up pt-8">
            <header className="flex flex-col md:flex-row items-end gap-6 pb-8">
              <div className="w-52 h-52 md:w-60 md:h-60 shadow-2xl rounded overflow-hidden bg-gradient-to-br from-[#450af5] to-[#c4efd9] flex items-center justify-center group relative flex-shrink-0">
                {currentView === 'liked' ? <Heart size={100} fill="white" /> : <Music size={100} />}
              </div>
              <div className="flex flex-col gap-2">
                <span className="text-xs font-bold uppercase tracking-widest">Playlist</span>
                <h1 className="text-5xl md:text-8xl font-black tracking-tight leading-none mb-2">
                  {currentView === 'liked' ? 'Liked Songs' : selectedPlaylist.name}
                </h1>
                <div className="flex items-center gap-2 text-sm font-medium">
                  <span className="font-bold hover:underline cursor-pointer">{user?.username || 'User'}</span>
                  <span className="w-1 h-1 rounded-full bg-white" />
                  <span>{(currentView === 'liked' ? likedSongs : selectedPlaylist.songs).length} songs</span>
                </div>
              </div>
            </header>

            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-8 px-4">
                <button className="w-14 h-14 rounded-full bg-accent-primary flex items-center justify-center hover:scale-105 transition-all text-black shadow-xl">
                  <Play fill="black" size={28} className="ml-1" />
                </button>
                <Heart size={32} className="text-accent-primary" fill="currentColor" />
                <MoreHorizontal size={24} className="text-text-muted hover:text-white cursor-pointer" />
              </div>

              <div className="mt-4">
                <div className="grid grid-cols-[16px_1fr_1fr_40px] gap-4 px-4 py-2 border-b border-white/10 text-text-muted text-sm font-medium mb-4">
                  <span>#</span>
                  <span>Title</span>
                  <span>Album</span>
                  <Clock size={16} />
                </div>
                {(currentView === 'liked' ? likedSongs : selectedPlaylist.songs).map((song, index) => (
                  <div key={`${song.id}-${index}`} className="grid grid-cols-[16px_1fr_1fr_40px] gap-4 px-4 py-2 hover:bg-white/10 rounded group cursor-pointer items-center">
                    <span className="text-text-muted group-hover:text-white">{index + 1}</span>
                    <div className="flex items-center gap-3 min-w-0">
                      <img src={song.thumbnail} alt="" className="w-10 h-10 object-cover rounded" />
                      <div className="flex flex-col min-w-0">
                        <span className="font-bold truncate text-white">{song.title}</span>
                        <span className="text-sm text-text-muted group-hover:text-white truncate">{song.artist || 'Unknown Artist'}</span>
                      </div>
                    </div>
                    <span className="text-sm text-text-muted group-hover:text-white truncate">Single</span>
                    <span className="text-sm text-text-muted group-hover:text-white">3:45</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* --- ADMIN VIEW --- */}
        {currentView === 'admin' && (
          <div className="animate-slide-up max-w-4xl mx-auto pt-8">
            {user ? <AdminPage /> : <LoginPage />}
          </div>
        )}
      </div>
    </div>
  );
};

/* --- HELPER COMPONENTS --- */

const ErrorState = ({ message, onRetry }) => (
  <div className="col-span-full py-20 flex flex-col items-center justify-center gap-6 glass-effect rounded-3xl border border-white/10 bg-red-500/5">
    <div className="p-4 bg-red-500/20 rounded-full">
        <AlertCircle size={40} className="text-red-500" />
    </div>
    <div className="text-center">
        <p className="text-xl font-bold mb-1">Something went wrong</p>
        <p className="text-white/40">{message}</p>
    </div>
    <button onClick={onRetry} className="flex items-center gap-2 px-8 py-3 bg-white text-black rounded-full font-bold hover:scale-105 transition-all shadow-xl active:scale-95">
      <RefreshCw size={18} />
      Try Again
    </button>
  </div>
);

const EmptyState = ({ icon, title, subtitle }) => (
  <div className="col-span-full py-24 flex flex-col items-center justify-center gap-4 border-2 border-dashed border-white/5 rounded-3xl">
    <div className="text-white/10">{icon}</div>
    <div className="text-center">
        <p className="text-lg font-bold text-white/60">{title}</p>
        <p className="text-sm text-white/30">{subtitle}</p>
    </div>
  </div>
);

const SongCardSkeleton = () => (
  <div className="p-4 rounded-2xl bg-white/5 border border-white/5 animate-pulse">
    <div className="aspect-square bg-white/10 rounded-xl mb-4" />
    <div className="h-4 bg-white/10 rounded-full w-3/4 mb-3" />
    <div className="h-3 bg-white/10 rounded-full w-1/2" />
  </div>
);