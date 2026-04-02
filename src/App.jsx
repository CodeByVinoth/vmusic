import React, { useState } from 'react';
import { MusicProvider, useMusic } from './MusicContext';
import { AuthProvider } from './AuthContext';
import { Sidebar } from './components/Sidebar';
import { MainView } from './components/MainView';
import { PlayerBar } from './components/PlayerBar';
import { Menu, X } from 'lucide-react';

function AppContent() {
  const { currentView, setView } = useMusic();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  return (
    <div className="h-screen flex flex-col bg-black text-white selection:bg-accent-primary/30 font-sans overflow-hidden">
      <div className="flex flex-1 overflow-hidden relative p-0 md:p-2 gap-0 md:gap-2">
        {/* Hamburger Menu - Mobile Only */}
        <button 
          onClick={toggleSidebar}
          className="md:hidden fixed top-4 left-4 z-[60] p-2 bg-black/50 backdrop-blur-lg rounded-full border border-white/10 text-white shadow-xl active:scale-90 transition-transform"
        >
          {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
        </button>

        {/* Sidebar - Desktop (Fixed) & Mobile (Overlay) */}
        <div className={`
          fixed inset-y-0 left-0 z-50 w-[280px] transform transition-transform duration-300 ease-in-out bg-black
          md:relative md:translate-x-0 md:flex-shrink-0 md:bg-transparent
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}>
          <Sidebar onClose={() => setIsSidebarOpen(false)} />
        </div>

        {/* Backdrop for Mobile Sidebar */}
        {isSidebarOpen && (
          <div 
            onClick={() => setIsSidebarOpen(false)}
            className="md:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity"
          />
        )}

        {/* Main Content Area */}
        <main className="flex-1 relative flex flex-col min-w-0 h-full bg-bg-elevated md:rounded-lg overflow-hidden">
          <MainView />
        </main>
      </div>

      {/* Player Bar */}
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
