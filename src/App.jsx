import React, { useState } from 'react';
import { MusicProvider } from './MusicContext';
import { AuthProvider } from './AuthContext';
import { Sidebar } from './components/Sidebar';
import { MainView } from './components/MainView';
import { PlayerBar } from './components/PlayerBar';
import { Menu, X } from 'lucide-react';

function App() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <AuthProvider>
      <MusicProvider>
        <div className="h-screen flex flex-col bg-black text-white relative overflow-hidden">
          {/* Mobile Header */}
          <div className="md:hidden flex items-center justify-between p-4 glass-effect z-40 border-b border-white/10">
            <h1 className="text-xl font-black tracking-tighter">VMUSIC</h1>
            <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
              {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>

          <div className="flex flex-1 overflow-hidden relative">
            {/* Sidebar with mobile state */}
            <div className={`
              fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0
              ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
            `}>
              <Sidebar onClose={() => setIsSidebarOpen(false)} />
            </div>

            {/* Overlay for mobile sidebar */}
            {isSidebarOpen && (
              <div 
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
                onClick={() => setIsSidebarOpen(false)}
              />
            )}

            <MainView />
          </div>
          <PlayerBar />
          <div className="absolute inset-0 pointer-events-none bg-black/30 [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)]" />
        </div>
      </MusicProvider>
    </AuthProvider>
  );
}

export default App;
