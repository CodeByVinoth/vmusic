import { useState } from 'react';
import { useAuth } from '../AuthContext';
import { Music } from 'lucide-react';

export const LoginPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const { login, error } = useAuth();

  const handleSubmit = (e) => {
    e.preventDefault();
    login(username, password);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black text-white p-6 md:p-8">
      <div className="w-full max-w-sm">
        <div className="text-center mb-10">
          <div className="inline-flex p-4 bg-accent-primary/10 rounded-2xl mb-4">
            <Music size={40} className="text-accent-primary" />
          </div>
          <h1 className="text-4xl font-black tracking-tighter">VMUSIC</h1>
          <p className="text-text-secondary mt-1">Admin Access</p>
        </div>
        <form onSubmit={handleSubmit} className="glass-effect p-6 md:p-8 rounded-2xl flex flex-col gap-5 shadow-2xl">
          {error && (
            <div className="text-red-400 bg-red-500/10 p-4 rounded-xl text-xs font-bold border border-red-500/20 animate-shake">
              {error}
            </div>
          )}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-text-secondary ml-1 mb-1">Username</label>
            <input
              type="text"
              placeholder="Enter username"
              className="w-full bg-white/5 text-white py-3 px-4 rounded-xl outline-none focus:ring-1 focus:ring-accent-primary transition-all text-sm border border-white/5 focus:border-accent-primary/50"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-text-secondary ml-1 mb-1">Password</label>
            <input
              type="password"
              placeholder="Enter password"
              className="w-full bg-white/5 text-white py-3 px-4 rounded-xl outline-none focus:ring-1 focus:ring-accent-primary transition-all text-sm border border-white/5 focus:border-accent-primary/50"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <button
            type="submit"
            className="mt-2 py-3.5 px-4 rounded-xl font-black bg-accent-primary text-black transition-all hover:bg-accent-secondary hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-accent-primary/20"
          >
            Sign In
          </button>
        </form>
      </div>
    </div>
  );
};
