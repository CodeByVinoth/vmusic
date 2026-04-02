import React from 'react';
import { MusicProvider, useMusic } from './MusicContext';
import { AuthProvider } from './AuthContext';
import { Sidebar } from './components/Sidebar';
import { MainView } from './components/MainView';
import { PlayerBar } from './components/PlayerBar';
import { Home, Search, Heart, ShieldCheck } from 'lucide-react';

function AppContent() {
  const { currentView, setView } = useMusic();

  return (
    <div className="h-screen flex flex-col bg-black text-white selection:bg-accent-primary/30 font-sans">
      <div className="flex flex-1 overflow-hidden relative p-2 gap-2">
        {/* Desktop Sidebar */}
        <div className="hidden md:block w-[280px] flex-shrink-0">
          <Sidebar />
        </div>

        {/* Main Content Area */}
        <main className="flex-1 relative flex flex-col min-w-0 h-full bg-bg-elevated rounded-lg overflow-hidden">
          <MainView />
        </main>
      </div>

      {/* Player Bar */}
      <PlayerBar />

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden h-[64px] bg-black/95 backdrop-blur-md border-t border-white/5 flex items-center justify-around px-2 pb-safe z-50">
        <MobileNavItem 
          icon={Home} 
          label="Home" 
          active={currentView === 'home'} 
          onClick={() => setView('home')} 
        />
        <MobileNavItem 
          icon={Search} 
          label="Search" 
          active={currentView === 'search'} 
          onClick={() => setView('search')} 
        />
        <MobileNavItem 
          icon={Heart} 
          label="Library" 
          active={currentView === 'liked'} 
          onClick={() => setView('liked')} 
        />
        <MobileNavItem 
          icon={ShieldCheck} 
          label="Admin" 
          active={currentView === 'admin'} 
          onClick={() => setView('admin')} 
        />
      </nav>
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

const MobileNavItem = ({ icon: Icon, label, active, onClick }) => (
  <button 
    onClick={onClick}
    className={`flex flex-col items-center justify-center gap-1 w-16 h-full transition-all duration-300 ${
      active ? 'text-accent-primary scale-110' : 'text-text-secondary hover:text-white'
    }`}
  >
    <Icon size={22} strokeWidth={active ? 2.5 : 2} />
    <span className="text-[10px] font-bold tracking-tight">{label}</span>
  </button>
);

export default App;
