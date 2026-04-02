import { useRef, useEffect, useState, useCallback } from 'react';
import { 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  Repeat, 
  Shuffle, 
  Volume2, 
  VolumeX,
  Maximize2, 
  ListMusic, 
  Heart,
  ChevronUp
} from 'lucide-react';
import { useMusic } from '../MusicContext';

export const PlayerBar = () => {
  const { currentSong, isPlaying, setIsPlaying, setCurrentSong, songs, likedSongs, toggleLike } = useMusic();
  const audioRef = useRef(null);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(localStorage.getItem('volume') ? Number(localStorage.getItem('volume')) : 0.5);
  const [isShuffle, setIsShuffle] = useState(false);
  const [isRepeat, setIsRepeat] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  // Sync Audio Element
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
      if (isPlaying) {
        audioRef.current.play().catch(() => setIsPlaying(false));
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlaying, currentSong, volume, isMuted]);

  const onTimeUpdate = () => {
    if (audioRef.current) {
      setProgress(audioRef.current.currentTime);
      setDuration(audioRef.current.duration);
    }
  };

  const handleScrub = (e) => {
    const time = Number(e.target.value);
    if (audioRef.current) audioRef.current.currentTime = time;
    setProgress(time);
  };

  const handleSkipForward = useCallback(() => {
    if (!currentSong || !songs.length) return;
    const currentIndex = songs.findIndex(s => s.id === currentSong.id);
    let nextIndex;
    if (isShuffle) {
      nextIndex = Math.floor(Math.random() * songs.length);
    } else {
      nextIndex = (currentIndex + 1) % songs.length;
    }
    setCurrentSong(songs[nextIndex]);
    setIsPlaying(true);
  }, [currentSong, songs, isShuffle, setCurrentSong, setIsPlaying]);

  const handleSkipBack = () => {
    if (!currentSong || !songs.length) return;
    if (audioRef.current?.currentTime > 3) {
      audioRef.current.currentTime = 0;
      return;
    }
    const currentIndex = songs.findIndex(s => s.id === currentSong.id);
    let prevIndex = (currentIndex - 1 + songs.length) % songs.length;
    setCurrentSong(songs[prevIndex]);
    setIsPlaying(true);
  };

  const formatTime = (time) => {
    if (!time || isNaN(time)) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const isLiked = currentSong && likedSongs.some(s => s.id === currentSong.id);

  return (
    <footer className="fixed bottom-0 left-0 right-0 h-[80px] md:h-[100px] bg-black/90 backdrop-blur-xl border-t border-white/5 px-4 flex flex-col justify-center z-[100]">
      <audio 
        ref={audioRef} 
        src={currentSong?.url} 
        onTimeUpdate={onTimeUpdate}
        onEnded={() => isRepeat ? (audioRef.current.currentTime = 0, audioRef.current.play()) : handleSkipForward()}
      />

      {/* Progress Bar (Top of Bar on Mobile, Integrated on Desktop) */}
      <div className="absolute top-0 left-0 w-full h-[2px] bg-white/10 md:hidden">
        <div 
          className="h-full bg-accent-primary transition-all duration-100" 
          style={{ width: `${(progress / duration) * 100}%` }}
        />
      </div>

      <div className="max-w-[1400px] mx-auto w-full flex items-center justify-between gap-4">
        
        {/* --- LEFT: SONG INFO --- */}
        <div className="flex items-center gap-3 min-w-0 flex-1 md:flex-none md:w-[30%]">
          {currentSong ? (
            <>
              <div className="relative flex-shrink-0 group cursor-pointer">
                <img 
                  src={currentSong.thumbnail} 
                  alt="" 
                  className={`w-12 h-12 md:w-16 md:h-16 object-cover rounded-md shadow-lg transition-all duration-500 ${isPlaying ? 'scale-100' : 'scale-90 opacity-80'}`} 
                />
                <div className="absolute -inset-1 bg-accent-primary/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity rounded-full" />
              </div>
              <div className="flex flex-col min-w-0">
                <h4 className="font-bold text-sm md:text-base text-white truncate hover:underline cursor-pointer tracking-tight">
                  {currentSong.title}
                </h4>
                <p className="text-xs text-white/50 truncate hover:text-white transition-colors cursor-pointer font-medium">
                  {currentSong.artist || 'Unknown Artist'}
                </p>
              </div>
              <button 
                onClick={() => toggleLike(currentSong)}
                className={`ml-2 transition-all hover:scale-110 active:scale-125 ${isLiked ? 'text-accent-primary' : 'text-white/30 hover:text-white'}`}
              >
                <Heart size={20} fill={isLiked ? 'currentColor' : 'none'} strokeWidth={2} />
              </button>
            </>
          ) : (
            <div className="flex items-center gap-3 animate-pulse">
              <div className="w-12 h-12 md:w-16 md:h-16 bg-white/5 rounded-md" />
              <div className="flex flex-col gap-2">
                <div className="w-24 h-3 bg-white/5 rounded" />
                <div className="w-16 h-2 bg-white/5 rounded" />
              </div>
            </div>
          )}
        </div>

        {/* --- CENTER: PLAYER CONTROLS --- */}
        <div className="flex flex-col items-center gap-2 flex-1 max-w-[400px] md:max-w-[600px]">
          <div className="flex items-center gap-5 md:gap-8">
            <button 
              onClick={() => setIsShuffle(!isShuffle)}
              className={`hidden md:block transition-colors ${isShuffle ? 'text-accent-primary' : 'text-white/40 hover:text-white'}`}
            >
              <Shuffle size={18} />
            </button>
            
            <button onClick={handleSkipBack} className="text-white/60 hover:text-white transition-all active:scale-90">
              <SkipBack size={24} fill="currentColor" />
            </button>

            <button 
              onClick={() => setIsPlaying(!isPlaying)}
              className="w-10 h-10 md:w-12 md:h-12 bg-accent-primary text-black rounded-full flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-xl shadow-accent-primary/20"
            >
              {isPlaying ? <Pause size={22} fill="currentColor" /> : <Play size={22} fill="currentColor" className="ml-1" />}
            </button>

            <button onClick={handleSkipForward} className="text-white/60 hover:text-white transition-all active:scale-90">
              <SkipForward size={24} fill="currentColor" />
            </button>

            <button 
              onClick={() => setIsRepeat(!isRepeat)}
              className={`hidden md:block transition-colors ${isRepeat ? 'text-accent-primary' : 'text-white/40 hover:text-white'}`}
            >
              <Repeat size={18} />
            </button>
          </div>

          {/* Desktop Seek Bar */}
          <div className="hidden md:flex w-full items-center gap-3">
            <span className="text-[11px] text-white/40 font-mono w-10 text-right">{formatTime(progress)}</span>
            <div className="relative flex-1 h-1 group cursor-pointer">
              <div className="absolute inset-0 bg-white/10 rounded-full" />
              <div 
                className="absolute inset-0 bg-accent-primary rounded-full group-hover:bg-accent-primary/80 transition-colors" 
                style={{ width: `${(progress / duration) * 100}%` }}
              />
              <input 
                type="range" 
                min="0" 
                max={duration || 0} 
                value={progress} 
                onChange={handleScrub}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              />
              <div 
                className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ left: `${(progress / duration) * 100}%` }}
              />
            </div>
            <span className="text-[11px] text-white/40 font-mono w-10">{formatTime(duration)}</span>
          </div>
        </div>

        {/* --- RIGHT: VOLUME & TOOLS --- */}
        <div className="hidden md:flex items-center justify-end gap-4 w-[30%]">
          <button className="text-white/40 hover:text-white transition-colors"><ListMusic size={20} /></button>
          
          <div className="flex items-center gap-2 group w-32">
            <button onClick={() => setIsMuted(!isMuted)} className="text-white/40 group-hover:text-white transition-colors">
              {isMuted || volume === 0 ? <VolumeX size={20} /> : <Volume2 size={20} />}
            </button>
            <div className="relative flex-1 h-1 bg-white/10 rounded-full overflow-hidden">
              <div 
                className="absolute inset-0 bg-white/60 group-hover:bg-accent-primary transition-colors" 
                style={{ width: `${isMuted ? 0 : volume * 100}%` }} 
              />
              <input 
                type="range" 
                min="0" max="1" step="0.01" 
                value={volume} 
                onChange={(e) => {
                  setVolume(Number(e.target.value));
                  setIsMuted(false);
                }}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              />
            </div>
          </div>

          <button className="text-white/40 hover:text-white transition-colors"><Maximize2 size={18} /></button>
        </div>

        {/* Mobile Expand Trigger */}
        <button className="md:hidden text-white/60">
            <ChevronUp size={24} />
        </button>

      </div>
    </footer>
  );
};