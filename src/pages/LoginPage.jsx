import React, { useState } from 'react';
import { useAuth } from '../AuthContext';
import { Music, Lock, User, Eye, EyeOff } from 'lucide-react';

export const LoginPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { login, error } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    await login(username, password);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black px-4 py-8">
      <div className="w-full max-w-md">
        {/* ── Logo & Title ── */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-accent-primary/10 mb-4 shadow-glow">
            <Music size={32} className="text-accent-primary" />
          </div>
          <h1 className="text-4xl font-black tracking-tighter text-white mb-2">
            VMUSIC
          </h1>
          <p className="text-sm text-[#b3b3b3] font-medium">
            Admin Access Portal
          </p>
        </div>

        {/* ── Login Form ── */}
        <form
          onSubmit={handleSubmit}
          className="bg-[#181818] rounded-2xl p-6 md:p-8 border border-white/5 shadow-2xl"
        >
          {/* Error Message */}
          {error && (
            <div className="flex items-center gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 mb-6 animate-shake">
              <Lock size={18} className="flex-shrink-0" />
              <span className="text-sm font-medium">{error}</span>
            </div>
          )}

          {/* Username Field */}
          <div className="mb-5">
            <label className="flex items-center gap-2 text-xs font-bold text-[#b3b3b3] uppercase tracking-wider mb-2.5">
              <User size={14} />
              Username
            </label>
            <input
              type="text"
              placeholder="Enter your username"
              className="
                w-full bg-white/5 text-white placeholder:text-[#b3b3b3]
                px-4 py-3 rounded-xl outline-none text-sm
                border border-white/5 focus:border-accent-primary/50 focus:bg-white/10
                transition-all duration-200
              "
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              required
            />
          </div>

          {/* Password Field */}
          <div className="mb-6">
            <label className="flex items-center gap-2 text-xs font-bold text-[#b3b3b3] uppercase tracking-wider mb-2.5">
              <Lock size={14} />
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter your password"
                className="
                  w-full bg-white/5 text-white placeholder:text-[#b3b3b3]
                  px-4 py-3 pr-12 rounded-xl outline-none text-sm
                  border border-white/5 focus:border-accent-primary/50 focus:bg-white/10
                  transition-all duration-200
                "
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-lg text-[#b3b3b3] hover:text-white transition-colors"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? (
                  <EyeOff size={18} />
                ) : (
                  <Eye size={18} />
                )}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="
              w-full py-3.5 px-4 rounded-xl font-black text-sm
              bg-accent-primary text-black
              hover:bg-accent-secondary transition-all duration-200
              active:scale-[0.98]
              flex items-center justify-center gap-2
              shadow-lg shadow-accent-primary/20
            "
          >
            <Lock size={18} />
            Sign In
          </button>

          {/* Footer */}
          <p className="text-[10px] text-[#b3b3b3] text-center mt-6 uppercase tracking-wider">
            Secured by VMUSIC Admin
          </p>
        </form>

        {/* ── Additional Info ── */}
        <div className="mt-6 text-center">
          <p className="text-xs text-[#b3b3b3]">
            Don't have access?{' '}
            <span className="text-white font-semibold">Contact administrator</span>
          </p>
        </div>
      </div>
    </div>
  );
};