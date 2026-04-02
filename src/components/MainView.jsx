import React, { useState, useEffect } from 'react';
import { useMusic } from '../MusicContext';
import { useAuth } from '../AuthContext';
import { SongCard } from './SongCard';
import { AdminPage } from '../pages/AdminPage';
import { LoginPage } from '../pages/LoginPage';
import { Search as SearchIcon, Heart, AlertCircle, RefreshCw, Clock, Hash } from 'lucide-react';

export const MainView = ({ activeTab }) => {
  const { currentView, setView, songs, likedSongs, playlists, selectedPlaylistId, isLoading, error, refreshSongs } = useMusic();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');

  // Sync mobile activeTab with currentView
  useEffect(() => {
    if (activeTab) setView(activeTab);
  }, [activeTab, setView]);

  const filteredSongs = songs.filter(s => 
    s.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (s.artist && s.artist.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const selectedPlaylist = playlists.find(p => p.id === selectedPlaylistId);

  const handleRetry = async () => {
    refreshSongs();
  };

  return (
    <div className="flex-1 bg-transparent text-white p-4 md:p-8 overflow-y-auto h-full relative scroll-smooth custom-scrollbar">
      <div className="relative z-10 max-w-7xl mx-auto pb-32 md:pb-8">
        
        {/* --- MOBILE SEARCH BAR (Top Fixed) --- */}
        {currentView === 'search' && (
          <div className="md:hidden sticky top-0 z-30 bg-[#0a0a0a]/80 backdrop-blur-md -mx-4 px-4 py-3 mb-6 border-b border-white/5 animate-slide-down">
            <div className="relative group">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary group-focus-within:text-accent-primary transition-colors" size={18} />
              <input 
                type="text" 
                placeholder="What do you want to listen to?" 
                className="w-full bg-white/5 border border-transparent focus:border-accent-primary/50 text-white py-2.5 pl-10 pr-4 rounded-full text-sm outline-none transition-all placeholder:text-text-secondary/50 shadow-inner"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        )}

        {/* --- HOME VIEW --- */}
        {currentView === 'home' && (
          <div className="flex flex-col gap-6 md:gap-8 animate-fade-in">
            <header className="flex flex-col gap-2">
              <h1 className="text-3xl md:text-5xl font-black tracking-tighter text-white bg-clip-text text-transparent bg-gradient-to-br from-white to-white/60">
                Discover
              </h1>
              <div className="h-1 w-12 md:w-16 bg-accent-primary rounded-full shadow-[0_0_10px_rgba(29,185,84,0.5)]" />
            </header>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
              {isLoading ? (
                Array(10).fill(0).map((_, i) => <SongCardSkeleton key={i} />)
              ) : error ? (
                <div className="col-span-full py-20 flex flex-col items-center justify-center gap-4 glass-effect rounded-3xl border border-white/5">
                  <AlertCircle size={48} className="text-red-500/50" />
                  <p className="text-text-secondary font-medium">{error}</p>
                  <button onClick={handleRetry} className="flex items-center gap-2 px-6 py-2 bg-white text-black rounded-full font-bold hover:scale-105 transition-transform active:scale-95 shadow-lg">
                    <RefreshCw size={18} />
                    Try Again
                  </button>
                </div>
              ) : songs.length > 0 ? (
                songs.map((song) => <SongCard key={song.id} song={song} />)
              ) : (
                <div className="col-span-full py-20 flex flex-col items-center justify-center gap-4 glass-effect rounded-3xl border border-white/5">
                  <Music size={48} className="text-white/10" />
                  <p className="text-text-secondary font-medium">Your music library is empty.</p>
                  <p className="text-sm text-text-secondary/50">Upload some songs to get started!</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* --- SEARCH VIEW --- */}
        {currentView === 'search' && (
          <div className="flex flex-col gap-6 md:gap-8 animate-fade-in">
            <header className="hidden md:flex flex-col gap-2">
              <h1 className="text-5xl font-black tracking-tighter text-white">Search</h1>
              <div className="h-1 w-16 bg-accent-primary rounded-full" />
              <div className="mt-6 relative max-w-xl group">
                <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary group-focus-within:text-accent-primary transition-colors" size={20} />
                <input 
                  type="text" 
                  placeholder="Search songs or artists..." 
                  className="w-full bg-white/5 border border-white/5 focus:border-accent-primary/50 text-white py-4 pl-12 pr-6 rounded-2xl text-lg outline-none transition-all shadow-2xl"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </header>

            <div className="flex flex-col gap-2">
              {searchQuery ? (
                filteredSongs.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
                    {filteredSongs.map((song) => <SongCard key={song.id} song={song} />)}
                  </div>
                ) : (
                  <div className="py-20 text-center text-text-secondary font-medium italic">No results for "{searchQuery}"</div>
                )
              ) : (
                <div className="py-20 flex flex-col items-center justify-center gap-4 text-text-secondary">
                  <SearchIcon size={64} className="opacity-10" />
                  <p className="font-medium">Search for your favorite tracks</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* --- LIKED SONGS VIEW --- */}
        {currentView === 'liked' && (
          <div className="flex flex-col gap-6 md:gap-8 animate-fade-in">
            <header className="flex flex-col gap-2">
              <h1 className="text-3xl md:text-5xl font-black tracking-tighter text-white flex items-center gap-4">
                Liked Songs
                <Heart size={32} className="text-accent-primary fill-accent-primary animate-pulse-slow" />
              </h1>
              <div className="h-1 w-12 md:w-16 bg-accent-primary rounded-full" />
            </header>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
              {likedSongs.length > 0 ? (
                likedSongs.map((song) => <SongCard key={song.id} song={song} />)
              ) : (
                <div className="col-span-full py-20 flex flex-col items-center justify-center gap-4 glass-effect rounded-3xl border border-white/5">
                  <Heart size={48} className="text-white/10" />
                  <p className="text-text-secondary font-medium">Songs you like will appear here</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* --- PLAYLIST VIEW --- */}
        {currentView === 'playlist' && selectedPlaylist && (
          <div className="flex flex-col gap-6 md:gap-8 animate-fade-in">
            <header className="flex flex-col gap-2">
              <h1 className="text-3xl md:text-5xl font-black tracking-tighter text-white">
                {selectedPlaylist.name}
              </h1>
              <div className="h-1 w-12 md:w-16 bg-accent-primary rounded-full" />
              <p className="text-text-secondary font-bold uppercase text-xs tracking-widest mt-2">{selectedPlaylist.songs.length} Tracks</p>
            </header>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
              {selectedPlaylist.songs.length > 0 ? (
                selectedPlaylist.songs.map((song) => <SongCard key={song.id} song={song} />)
              ) : (
                <div className="col-span-full py-20 text-center text-text-secondary italic font-medium glass-effect rounded-3xl border border-white/5">This playlist is empty.</div>
              )}
            </div>
          </div>
        )}

        {/* --- ADMIN VIEW --- */}
        {currentView === 'admin' && (
          <div className="animate-fade-in">
            <AdminPage />
          </div>
        )}
      </div>
    </div>
  );
};

const SongCardSkeleton = () => (
  <div className="glass-effect p-3 md:p-4 rounded-2xl border border-white/5 animate-pulse">
    <div className="aspect-square bg-white/5 rounded-xl mb-4 shadow-inner" />
    <div className="h-4 bg-white/5 rounded-full w-3/4 mb-2" />
    <div className="h-3 bg-white/5 rounded-full w-1/2" />
  </div>
);
