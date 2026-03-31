import { Home, Search, Heart, PlusSquare, ListMusic, ShieldCheck } from 'lucide-react';
import { useMusic } from '../MusicContext';

const NavItem = ({ icon: Icon, label, view, currentView, setView }) => (
  <button
    onClick={() => setView(view)}
    className={`flex items-center gap-4 px-4 py-3 rounded-lg text-sm font-bold transition-all duration-300 ${
      currentView === view
        ? 'bg-white/10 text-white'
        : 'text-text-secondary hover:text-white'
    }`}
  >
    <Icon size={24} />
    {label}
  </button>
);

export const Sidebar = ({ onClose }) => {
  const { currentView, setView, playlists, createPlaylist, setSelectedPlaylist, selectedPlaylistId } = useMusic();

  const handleNavClick = (view) => {
    setView(view);
    if (onClose) onClose();
  };

  const navItems = [
    { id: 'home', icon: Home, label: 'Home' },
    { id: 'search', icon: Search, label: 'Search' },
    { id: 'liked', icon: Heart, label: 'Liked Songs' },
  ];

  return (
    <div className="w-full h-full bg-black/95 backdrop-blur-xl md:bg-black p-4 flex flex-col gap-4 border-r border-white/10 shadow-2xl md:shadow-none">
      <div className="hidden md:flex items-center gap-2 px-2 mb-4">
        <div className="w-3 h-3 bg-red-500 rounded-full" />
        <div className="w-3 h-3 bg-yellow-500 rounded-full" />
        <div className="w-3 h-3 bg-green-500 rounded-full" />
      </div>

      <div className="md:hidden flex items-center justify-between px-2 mb-4">
        <h1 className="text-2xl font-black tracking-tighter">VMUSIC</h1>
      </div>

      <nav className="flex flex-col gap-2">
        {navItems.map((item) => (
          <NavItem 
            key={item.id} 
            icon={item.icon} 
            label={item.label} 
            view={item.id} 
            currentView={currentView} 
            setView={handleNavClick} 
          />
        ))}
      </nav>

      <div className="flex-1 flex flex-col gap-2 overflow-y-auto">
        <div className="flex items-center justify-between px-2 mt-4 mb-2">
          <h2 className="text-xs font-bold text-text-secondary uppercase tracking-wider">Playlists</h2>
          <button 
            onClick={() => {
              const name = prompt('Playlist name:');
              if (name) createPlaylist(name);
            }} 
            className="text-text-secondary hover:text-white p-1 hover:bg-white/10 rounded-md transition-colors"
          >
            <PlusSquare size={20} />
          </button>
        </div>
        <div className="flex flex-col gap-1">
          {playlists.map((playlist) => (
            <button
              key={playlist.id}
              onClick={() => {
                handleNavClick('playlist');
                setSelectedPlaylist(playlist.id);
              }}
              className={`px-4 py-2 rounded-lg text-sm font-bold text-left transition-all duration-300 ${
                currentView === 'playlist' && selectedPlaylistId === playlist.id
                  ? 'bg-white/10 text-white'
                  : 'text-text-secondary hover:text-white hover:bg-white/5'
              }`}
            >
              {playlist.name}
            </button>
          ))}
        </div>
      </div>
      
      <div className="pt-4 border-t border-white/10">
        <NavItem 
          icon={ShieldCheck} 
          label="Admin" 
          view="admin" 
          currentView={currentView} 
          setView={handleNavClick} 
        />
      </div>
    </div>
  );
};
