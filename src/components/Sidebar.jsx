import { Home, Search, Heart, PlusSquare, ListMusic, ShieldCheck, Music } from 'lucide-react';
import { useMusic } from '../MusicContext';

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
    <div className="w-full h-full bg-[#0a0a0a] p-6 flex flex-col gap-8">
      {/* Brand Logo */}
      <div className="flex items-center gap-3 px-2">
        <div className="w-10 h-10 bg-accent-primary rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(29,185,84,0.3)]">
          <Music size={24} className="text-black" fill="black" />
        </div>
        <h1 className="text-2xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-white to-white/70">VMUSIC</h1>
      </div>

      <nav className="flex flex-col gap-1">
        {navItems.map((item) => (
          <NavItem 
            key={item.id} 
            icon={item.icon} 
            label={item.label} 
            view={item.id} 
            currentView={currentView} 
            setView={setView} 
          />
        ))}
      </nav>

      <div className="flex-1 flex flex-col gap-4 overflow-hidden">
        <div className="flex items-center justify-between px-2">
          <h2 className="text-[10px] font-black text-text-secondary uppercase tracking-[0.2em]">Your Playlists</h2>
          <button 
            onClick={() => {
              const name = prompt('Playlist name:');
              if (name) createPlaylist(name);
            }} 
            className="text-text-secondary hover:text-accent-primary transition-colors p-1"
          >
            <PlusSquare size={18} />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 flex flex-col gap-1">
          {playlists.map((playlist) => (
            <button
              key={playlist.id}
              onClick={() => {
                setView('playlist');
                setSelectedPlaylist(playlist.id);
              }}
              className={`group px-4 py-3 rounded-xl text-sm font-bold text-left transition-all duration-300 flex items-center justify-between ${
                currentView === 'playlist' && selectedPlaylistId === playlist.id
                  ? 'bg-white/10 text-white shadow-lg'
                  : 'text-text-secondary hover:text-white hover:bg-white/5'
              }`}
            >
              <span className="truncate">{playlist.name}</span>
              <div className={`w-1.5 h-1.5 rounded-full bg-accent-primary transition-opacity duration-300 ${currentView === 'playlist' && selectedPlaylistId === playlist.id ? 'opacity-100' : 'opacity-0'}`} />
            </button>
          ))}
        </div>
      </div>
      
      <div className="pt-6 border-t border-white/5">
        <NavItem 
          icon={ShieldCheck} 
          label="Admin Dashboard" 
          view="admin" 
          currentView={currentView} 
          setView={setView} 
        />
      </div>
    </div>
  );
};

const NavItem = ({ icon: Icon, label, view, currentView, setView }) => {
  const active = currentView === view;
  return (
    <button
      onClick={() => setView(view)}
      className={`flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all duration-300 group ${
        active 
          ? 'bg-accent-primary text-black shadow-[0_10px_20px_rgba(29,185,84,0.2)]' 
          : 'text-text-secondary hover:text-white hover:bg-white/5'
      }`}
    >
      <Icon size={20} strokeWidth={active ? 2.5 : 2} className={active ? '' : 'group-hover:scale-110 transition-transform'} />
      <span className={`text-sm font-black tracking-tight ${active ? '' : 'group-hover:translate-x-1 transition-transform'}`}>{label}</span>
    </button>
  );
};
