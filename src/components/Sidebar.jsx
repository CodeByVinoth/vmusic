import { Home, Search, Heart, PlusSquare, ListMusic, ShieldCheck, Music } from 'lucide-react';
import { useMusic } from '../MusicContext';

export const Sidebar = () => {
  const { currentView, setView, playlists, createPlaylist, setSelectedPlaylist, selectedPlaylistId } = useMusic();

  const navItems = [
    { id: 'home', icon: Home, label: 'Home' },
    { id: 'search', icon: Search, label: 'Search' },
    { id: 'liked', icon: Heart, label: 'Liked Songs' },
    { id: 'admin', icon: ShieldCheck, label: 'Admin Dashboard' },
  ];

  return (
    <div className="w-full h-full bg-black flex flex-col gap-2 p-2">
      {/* Top Nav Box */}
      <div className="bg-bg-elevated rounded-lg p-4 flex flex-col gap-4">
        <div className="flex items-center gap-2 px-2 mb-2">
          <Music size={28} className="text-accent-primary" fill="currentColor" />
          <span className="font-black text-xl tracking-tight">VMUSIC</span>
        </div>
        
        <nav className="flex flex-col gap-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setView(item.id)}
              className={`spotify-nav-item ${currentView === item.id ? 'active' : ''}`}
            >
              <item.icon size={24} strokeWidth={currentView === item.id ? 2.5 : 2} />
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Library Box */}
      <div className="flex-1 bg-bg-elevated rounded-lg p-2 flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3 text-text-muted hover:text-white transition-colors cursor-pointer">
            <ListMusic size={24} />
            <span className="font-bold text-sm">Your Library</span>
          </div>
          <button 
            onClick={() => {
              const name = prompt('Playlist name:');
              if (name) createPlaylist(name);
            }} 
            className="spotify-btn-icon"
          >
            <PlusSquare size={20} />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {playlists.map((playlist) => (
            <button
              key={playlist.id}
              onClick={() => {
                setView('playlist');
                setSelectedPlaylist(playlist.id);
              }}
              className={`w-full px-4 py-3 flex items-center gap-3 hover:bg-white/5 transition-colors rounded-md ${
                currentView === 'playlist' && selectedPlaylistId === playlist.id ? 'bg-white/10' : ''
              }`}
            >
              <div className="w-12 h-12 bg-bg-highlight rounded flex items-center justify-center text-text-muted">
                <Music size={20} />
              </div>
              <div className="flex flex-col items-start min-w-0">
                <span className={`text-sm font-bold truncate w-full ${currentView === 'playlist' && selectedPlaylistId === playlist.id ? 'text-accent-primary' : 'text-white'}`}>
                  {playlist.name}
                </span>
                <span className="text-xs text-text-muted font-medium">Playlist • {playlist.songs?.length || 0} songs</span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
