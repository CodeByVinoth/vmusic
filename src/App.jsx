import React, { useState, useEffect } from 'react';
import { MusicProvider, useMusic } from './MusicContext';
import { AuthProvider } from './AuthContext';
import { Sidebar } from './components/Sidebar';
import { MainView } from './components/MainView';
import { PlayerBar } from './components/PlayerBar';
import { Menu, X } from 'lucide-react';

function AppContent() {
  const { currentView, setView } = useMusic();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => setIsSidebarOpen(prev => !prev);
  const closeSidebar = () => setIsSidebarOpen(false);

  // Close sidebar on route change (mobile)
  useEffect(() => {
    closeSidebar();
  }, [currentView]);

  // Prevent body scroll when sidebar is open on mobile
  useEffect(() => {
    if (isSidebarOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isSidebarOpen]);

  return (
    <div
      className="flex flex-col bg-black text-white font-sans"
      style={{ height: '100dvh', overflow: 'hidden' }}
    >
      {/* ── Main Layout: Sidebar + Content ── */}
      <div className="flex flex-1 overflow-hidden">

        {/* ── MOBILE: Hamburger Button ── */}
        <button
          onClick={toggleSidebar}
          aria-label={isSidebarOpen ? 'Close menu' : 'Open menu'}
          className="md:hidden fixed top-4 left-4 z-[70] w-10 h-10 flex items-center justify-center bg-black/80 backdrop-blur-xl rounded-full border border-white/10 text-white shadow-xl transition-all duration-200 active:scale-90"
        >
          {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
        </button>

        {/* ── MOBILE: Backdrop Overlay ── */}
        <div
          onClick={closeSidebar}
          className={`
            md:hidden fixed inset-0 z-[55] bg-black/70 backdrop-blur-sm
            transition-opacity duration-300
            ${isSidebarOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}
          `}
          aria-hidden="true"
        />

        {/* ── SIDEBAR ── */}
        {/* Desktop: always visible, fixed width */}
        {/* Mobile: slide-in drawer from left */}
        <aside
          className={`
            fixed inset-y-0 left-0 z-[60] w-[280px]
            transform transition-transform duration-300 ease-in-out
            md:relative md:translate-x-0 md:flex-shrink-0 md:z-auto
            ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          `}
        >
          <Sidebar onClose={closeSidebar} />
        </aside>

        {/* ── MAIN CONTENT ── */}
        <main
          className="flex-1 min-w-0 flex flex-col overflow-hidden bg-bg-elevated"
          style={{ borderRadius: '0' }}
        >
          <MainView />
        </main>
      </div>

      {/* ── PLAYER BAR (always at bottom) ── */}
      <PlayerBar />
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <MusicProvider>
        <AppContent />
      </MusicProvider>
    </AuthProvider>
  );
}

export default App;