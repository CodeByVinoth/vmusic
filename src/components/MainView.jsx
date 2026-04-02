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
  Filter
} from 'lucide-react';

export const MainView = ({ activeTab }) => {
  const { currentView, setView, songs, likedSongs, playlists, selectedPlaylistId, isLoading, error, refreshSongs } = useMusic();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [isScrolled, setIsScrolled] = useState(false);

  // Sync mobile activeTab with currentView
  useEffect(() => {
    if (activeTab) setView(activeTab);
  }, [activeTab, setView]);

  // Handle scroll effect for header
  const handleScroll = (e) => {
    setIsScrolled(e.target.scrollTop > 50);
  };

  const filteredSongs = songs.filter(s => 
    s.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (s.artist && s.artist.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const selectedPlaylist = playlists.find(p => p.id === selectedPlaylistId);

  const handleRetry = async () => {
    refreshSongs();
  };

  // Dynamic Background Colors based on View
  const getViewStyles = () => {
    switch(currentView) {
      case 'liked': return 'from-red-900/40 to-black';
      case 'playlist': return 'from-red-950/40 to-black';
      default: return 'from-zinc-950 to-black';
    }
  };

  return (
    <div 
      onScroll={handleScroll}
      className={`flex-1 bg-gradient-to-b ${getViewStyles()} text-white p-4 md:p-8 overflow-y-auto h-full relative scroll-smooth custom-scrollbar transition-colors duration-700`}
    >
      {/* Background Glow Effect */}
      <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-accent-primary/10 to-transparent pointer-events-none" />

      <div className="relative z-10 max-w-7xl mx-auto pb-32 md:pb-8">
        
        {/* --- DYNAMIC HEADER --- */}
        <div className={`md:hidden sticky top-0 z-30 -mx-4 px-4 py-4 mb-6 transition-all duration-300 ${isScrolled ? 'bg-black/80 backdrop-blur-xl border-b border-white/10' : 'bg-transparent'}`}>
            <h2 className={`font-bold transition-opacity ${isScrolled ? 'opacity-100' : 'opacity-0'}`}>
                {currentView.charAt(0).toUpperCase() + currentView.slice(1)}
            </h2>
        </div>

        {/* --- MOBILE SEARCH BAR --- */}
        {currentView === 'search' && (
          <div className="md:hidden mb-6 animate-slide-down">
            <div className="relative group">
              <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 group-focus-within:text-accent-primary transition-colors" size={20} />
              <input 
                type="text" 
                placeholder="Artists, songs, or podcasts" 
                className="w-full bg-white/10 backdrop-blur-md border border-white/5 focus:border-accent-primary/50 text-white py-3.5 pl-12 pr-4 rounded-xl text-sm outline-none transition-all placeholder:text-white/30"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        )}

        {/* --- HOME VIEW --- */}
        {currentView === 'home' && (
          <div className="flex flex-col gap-8 animate-fade-in">
            <header className="relative py-4">
              <span className="text-accent-primary font-bold tracking-widest text-xs uppercase mb-2 block">Curated for you</span>
              <h1 className="text-4xl md:text-6xl font-black tracking-tighter mb-4">
                Good Afternoon
              </h1>
              <div className="flex gap-2">
                <div className="h-1.5 w-12 bg-accent-primary rounded-full" />
                <div className="h-1.5 w-4 bg-white/20 rounded-full" />
              </div>
            </header>

            <section>
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl md:text-2xl font-bold">New Releases</h3>
                    <button className="text-sm font-bold text-white/60 hover:text-white transition-colors">Show all</button>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-8">
                {isLoading ? (
                    Array(10).fill(0).map((_, i) => <SongCardSkeleton key={i} />)
                ) : error ? (
                    <ErrorState message={error} onRetry={handleRetry} />
                ) : songs.length > 0 ? (
                    songs.map((song) => <SongCard key={song.id} song={song} />)
                ) : (
                    <EmptyState icon={<Music size={48} />} title="Your library is empty" subtitle="Start by uploading your favorite tracks." />
                )}
                </div>
            </section>
          </div>
        )}

        {/* --- SEARCH VIEW (DESKTOP) --- */}
        {currentView === 'search' && (
          <div className="flex flex-col gap-8 animate-fade-in">
            <header className="hidden md:block">
              <div className="relative max-w-2xl group">
                <SearchIcon className="absolute left-5 top-1/2 -translate-y-1/2 text-white/40 group-focus-within:text-accent-primary transition-colors" size={24} />
                <input 
                  type="text" 
                  placeholder="What do you want to listen to?" 
                  className="w-full bg-white/5 border border-white/10 focus:bg-white/10 focus:border-accent-primary/50 text-white py-5 pl-14 pr-8 rounded-2xl text-xl outline-none transition-all shadow-2xl"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </header>

            <div className="mt-4">
              {searchQuery ? (
                filteredSongs.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                    {filteredSongs.map((song) => <SongCard key={song.id} song={song} />)}
                  </div>
                ) : (
                  <div className="py-20 text-center">
                    <p className="text-xl text-white/40 italic">No results found for "{searchQuery}"</p>
                  </div>
                )
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 opacity-60">
                    {['Pop', 'Rock', 'Hip-Hop', 'Jazz', 'Indie', 'Classical'].map(genre => (
                        <div key={genre} className="h-32 rounded-xl bg-white/5 border border-white/5 flex items-end p-4 hover:bg-white/10 transition-colors cursor-pointer">
                            <span className="text-2xl font-bold">{genre}</span>
                        </div>
                    ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* --- LIKED & PLAYLIST VIEW --- */}
        {(currentView === 'liked' || (currentView === 'playlist' && selectedPlaylist)) && (
          <div className="flex flex-col gap-8 animate-fade-in">
            <header className="flex flex-col md:flex-row items-end gap-6 pb-8 border-b border-white/10">
              <div className="w-48 h-48 md:w-60 md:h-60 shadow-2xl rounded-lg overflow-hidden bg-gradient-to-br from-accent-primary to-emerald-900 flex items-center justify-center group relative">
                {currentView === 'liked' ? <Heart size={80} className="fill-white" /> : <Music size={80} />}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Play size={60} className="fill-white" />
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <span className="text-xs font-bold uppercase tracking-widest">Playlist</span>
                <h1 className="text-5xl md:text-8xl font-black tracking-tighter leading-none mb-2">
                  {currentView === 'liked' ? 'Liked Songs' : selectedPlaylist.name}
                </h1>
                <div className="flex items-center gap-2 text-white/60 font-medium">
                  <span className="text-white font-bold">{user?.email?.split('@')[0] || 'User'}</span>
                  <span className="w-1 h-1 rounded-full bg-white/40" />
                  <span>{(currentView === 'liked' ? likedSongs : selectedPlaylist.songs).length} tracks</span>
                </div>
              </div>
            </header>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 mt-4">
              {(currentView === 'liked' ? likedSongs : selectedPlaylist.songs).length > 0 ? (
                (currentView === 'liked' ? likedSongs : selectedPlaylist.songs).map((song) => <SongCard key={song.id} song={song} />)
              ) : (
                <div className="col-span-full py-20">
                    <EmptyState 
                        icon={currentView === 'liked' ? <Heart size={48} /> : <Music size={48} />} 
                        title="Nothing here yet" 
                        subtitle="Start adding tracks to see them in this list." 
                    />
                </div>
              )}
            </div>
          </div>
        )}

        {/* --- ADMIN VIEW --- */}
        {currentView === 'admin' && (
          <div className="animate-fade-in max-w-4xl mx-auto">
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