import React, { useState } from 'react';
import { MusicProvider } from './MusicContext';
import { AuthProvider } from './AuthContext';
import { Sidebar } from './components/Sidebar';
import { MainView } from './components/MainView';
import { PlayerBar } from './components/PlayerBar';
import { Home, Search, Heart, ShieldCheck, Menu } from 'lucide-react';

function App() {
  const [activeTab, setActiveTab] = useState('home'); // For mobile bottom nav

  return (
    <AuthProvider>
      <MusicProvider>
        <div className="h-screen flex flex-col bg-[#0a0a0a] text-white selection:bg-accent-primary/30">
          <div className="flex flex-1 overflow-hidden relative">
            {/* Desktop Sidebar - Hidden on mobile */}
            <div className="hidden md:block w-64 border-r border-white/5">
              <Sidebar />
            </div>

            <main className="flex-1 relative flex flex-col min-w-0 h-full overflow-hidden">
              <MainView activeTab={activeTab} />
            </main>
          </div>

          {/* Player Bar - Professional Floating/Fixed Style */}
          <div className="relative z-50">
            <PlayerBar />
          </div>

          {/* Mobile Bottom Navigation - Professional App Style */}
          <nav className="md:hidden h-[72px] bg-[#121212]/95 backdrop-blur-xl border-t border-white/5 flex items-center justify-around px-2 pb-safe z-50">
            <MobileNavItem 
              icon={Home} 
              label="Home" 
              active={activeTab === 'home'} 
              onClick={() => setActiveTab('home')} 
            />
            <MobileNavItem 
              icon={Search} 
              label="Search" 
              active={activeTab === 'search'} 
              onClick={() => setActiveTab('search')} 
            />
            <MobileNavItem 
              icon={Heart} 
              label="Library" 
              active={activeTab === 'liked'} 
              onClick={() => setActiveTab('liked')} 
            />
            <MobileNavItem 
              icon={ShieldCheck} 
              label="Admin" 
              active={activeTab === 'admin'} 
              onClick={() => setActiveTab('admin')} 
            />
          </nav>
        </div>
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
