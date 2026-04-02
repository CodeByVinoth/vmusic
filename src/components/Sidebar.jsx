import React from 'react';
import { Home, Search, Heart, PlusSquare, ListMusic, ShieldCheck, Music, X } from 'lucide-react';
import { useMusic } from '../MusicContext';

export const Sidebar = ({ onClose }) => {
  const {
    currentView,
    setView,
    playlists,
    createPlaylist,
    setSelectedPlaylist,
    selectedPlaylistId,
  } = useMusic();

  const handleNavClick = (view) => {
    setView(view);
    if (onClose) onClose();
  };

  const handleCreatePlaylist = () => {
    const name = prompt('Enter playlist name:');
    if (name && name.trim()) {
      createPlaylist(name.trim());
    }
  };

  const navItems = [
    { id: 'home', icon: Home, label: 'Home' },
    { id: 'search', icon: Search, label: 'Search' },
    { id: 'liked', icon: Heart, label: 'Liked Songs' },
    { id: 'admin', icon: ShieldCheck, label: 'Admin' },
  ];

  return (
    <div className="w-full h-full bg-black flex flex-col overflow-hidden">

      {/* ── TOP SECTION: Logo + Nav ── */}
      <div className="flex-shrink-0 bg-[#121212] rounded-none md:rounded-lg mx-0 md:mx-2 mt-0 md:mt-2 overflow-hidden">

        {/* Logo Row */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-accent-primary rounded-full flex items-center justify-center shadow-glow flex-shrink-0">
              <Music size={18} className="text-black" fill="currentColor" />
            </div>
            <span className="font-black text-xl tracking-tight text-white select-none">
              VMUSIC
            </span>
          </div>
          {/* Close button - mobile only */}
          <button
            onClick={onClose}
            className="md:hidden w-8 h-8 flex items-center justify-center rounded-full text-white/50 hover:text-white hover:bg-white/10 transition-all"
            aria-label="Close sidebar"
          >
            <X size={18} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="px-3 pb-4 flex flex-col gap-0.5">
          {navItems.map((item) => {
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`
                  flex items-center gap-3.5 w-full px-3 py-2.5 rounded-lg
                  font-semibold text-sm transition-all duration-150
                  ${isActive
                    ? 'bg-white/10 text-white'
                    : 'text-[#b3b3b3] hover:text-white hover:bg-white/5'
                  }
                `}
              >
                <item.icon
                  size={22}
                  strokeWidth={isActive ? 2.5 : 2}
                  className={isActive ? 'text-white' : ''}
                />
                <span>{item.label}</span>
                {isActive && (
                  <span className="ml-auto w-1.5 h-1.5 rounded-full bg-accent-primary flex-shrink-0" />
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* ── LIBRARY SECTION ── */}
      <div className="flex-1 bg-[#121212] rounded-none md:rounded-lg mx-0 md:mx-2 mt-2 mb-0 md:mb-2 flex flex-col overflow-hidden min-h-0">

        {/* Library Header */}
        <div className="flex items-center justify-between px-5 py-4 flex-shrink-0">
          <div className="flex items-center gap-3">
            <ListMusic size={22} className="text-[#b3b3b3]" />
            <span className="font-bold text-sm text-[#b3b3b3]">Your Library</span>
          </div>
          <button
            onClick={handleCreatePlaylist}
            title="Create playlist"
            className="w-8 h-8 flex items-center justify-center rounded-full text-[#b3b3b3] hover:text-white hover:bg-white/10 transition-all duration-150"
          >
            <PlusSquare size={20} />
          </button>
        </div>

        {/* Playlist List */}
        <div className="flex-1 overflow-y-auto custom-scrollbar px-2 pb-2">
          {playlists.length === 0 ? (
            /* Empty state */
            <div className="mx-3 my-2 p-4 rounded-lg bg-white/5 border border-white/5">
              <p className="text-sm font-bold text-white mb-1">Create your first playlist</p>
              <p className="text-xs text-[#b3b3b3] mb-3 leading-relaxed">
                It's easy, we'll help you.
              </p>
              <button
                onClick={handleCreatePlaylist}
                className="px-4 py-2 bg-white text-black text-xs font-bold rounded-full hover:scale-105 transition-transform"
              >
                Create playlist
              </button>
            </div>
          ) : (
            playlists.map((playlist) => {
              const isActive = currentView === 'playlist' && selectedPlaylistId === playlist.id;
              return (
                <button
                  key={playlist.id}
                  onClick={() => {
                    setView('playlist');
                    setSelectedPlaylist(playlist.id);
                    if (onClose) onClose();
                  }}
                  className={`
                    w-full flex items-center gap-3 px-3 py-2.5 rounded-lg
                    transition-all duration-150 group
                    ${isActive ? 'bg-white/10' : 'hover:bg-white/5'}
                  `}
                >
                  {/* Playlist thumbnail */}
                  <div className="w-11 h-11 rounded-md bg-[#282828] flex items-center justify-center flex-shrink-0 overflow-hidden shadow-md">
                    <Music size={18} className="text-[#b3b3b3]" />
                  </div>

                  {/* Playlist info */}
                  <div className="flex flex-col items-start min-w-0 flex-1">
                    <span
                      className={`
                        text-sm font-semibold truncate w-full text-left
                        ${isActive ? 'text-accent-primary' : 'text-white group-hover:text-white'}
                      `}
                    >
                      {playlist.name}
                    </span>
                    <span className="text-xs text-[#b3b3b3] font-medium">
                      Playlist · {playlist.songs?.length || 0} songs
                    </span>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};