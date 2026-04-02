import { useRef, useEffect, useState } from 'react';
import { Play, Pause, SkipBack, SkipForward, Repeat, Shuffle, Volume2, Maximize2, ListMusic, Heart } from 'lucide-react';
import { useMusic } from '../MusicContext';

export const PlayerBar = () => {
  const { currentSong, isPlaying, setIsPlaying, setCurrentSong, songs, likedSongs, toggleLike } = useMusic();
  const audioRef = useRef(null);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(localStorage.getItem('volume') ? Number(localStorage.getItem('volume')) : 0.5);
  const [isShuffle, setIsShuffle] = useState(false);
  const [isRepeat, setIsRepeat] = useState(false);

  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.play().catch(err => {
          console.error("Playback failed", err);
          setIsPlaying(false);
        });
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlaying, currentSong]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
      localStorage.setItem('volume', volume);
    }
  }, [volume]);

  const onTimeUpdate = () => {
    if (audioRef.current) {
      setProgress(audioRef.current.currentTime);
      setDuration(audioRef.current.duration);
    }
  };

  const handleScrub = (e) => {
    const time = Number(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
    }
    setProgress(time);
  };

  const handleSkipForward = () => {
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
  };

  const handleSkipBack = () => {
    if (!currentSong || !songs.length) return;
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
    <div className="h-[96px] md:h-[104px] bg-black border-t border-white/5 flex items-center px-4 md:px-6 gap-4 md:gap-8 select-none z-50">
      <audio 
        ref={audioRef} 
        src={currentSong?.url} 
        onTimeUpdate={onTimeUpdate}
        onEnded={isRepeat ? () => audioRef.current?.play() : handleSkipForward}
      />

      {/* Song Info */}
      <div className="flex-[0.6] md:flex-1 flex items-center gap-3 md:gap-4 min-w-0">
        {currentSong ? (
          <>
            <div className="relative flex-shrink-0 group">
              <img src={currentSong.thumbnail} alt="" className="w-12 h-12 md:w-14 md:h-14 object-cover rounded-lg shadow-2xl border border-white/5 transition-transform duration-500 group-hover:scale-105" />
              <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg" />
            </div>
            <div className="flex flex-col min-w-0">
              <h4 className="font-black text-xs md:text-sm text-white truncate tracking-tight">{currentSong.title}</h4>
              <p className="text-[10px] md:text-xs text-text-muted truncate font-medium">{currentSong.artist || 'Unknown Artist'}</p>
            </div>
            <button 
              onClick={() => toggleLike(currentSong)}
              className={`ml-1 md:ml-2 hover:scale-110 transition-all active:scale-125 ${isLiked ? 'text-accent-primary' : 'text-text-muted hover:text-white'}`}
            >
              <Heart size={18} md:size={20} fill={isLiked ? 'currentColor' : 'none'} strokeWidth={isLiked ? 0 : 2.5} />
            </button>
          </>
        ) : (
          <div className="flex items-center gap-3 opacity-20">
            <div className="w-12 h-12 md:w-14 md:h-14 bg-white/10 rounded-lg animate-pulse"></div>
            <div className="flex flex-col gap-2">
              <div className="w-20 md:w-24 h-2.5 bg-white/10 rounded animate-pulse"></div>
              <div className="w-12 md:w-16 h-2 bg-white/10 rounded animate-pulse"></div>
            </div>
          </div>
        )}
      </div>

      {/* Player Controls */}
      <div className="flex-1 md:flex-[2] flex flex-col items-center gap-2 max-w-[45%] md:max-w-none">
        <div className="flex items-center gap-4 md:gap-8">
          <button 
            onClick={() => setIsShuffle(!isShuffle)}
            className={`hidden md:block transition-all hover:scale-110 active:scale-95 ${isShuffle ? 'text-accent-primary' : 'text-text-muted hover:text-white'}`}
          >
            <Shuffle size={18} strokeWidth={2.5} />
          </button>
          <button 
            onClick={handleSkipBack}
            className="text-text-muted hover:text-white transition-all hover:scale-110 active:scale-90"
          >
            <SkipBack size={22} md:size={26} fill="currentColor" />
          </button>
          <button 
            onClick={() => setIsPlaying(!isPlaying)}
            className="w-10 h-10 md:w-12 md:h-12 bg-white text-black rounded-full flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-[0_8px_20px_rgba(255,255,255,0.1)]"
          >
            {isPlaying ? <Pause size={20} md:size={24} fill="currentColor" /> : <Play size={20} md:size={24} fill="currentColor" className="ml-1" />}
          </button>
          <button 
            onClick={handleSkipForward}
            className="text-text-muted hover:text-white transition-all hover:scale-110 active:scale-90"
          >
            <SkipForward size={22} md:size={26} fill="currentColor" />
          </button>
          <button 
            onClick={() => setIsRepeat(!isRepeat)}
            className={`hidden md:block transition-all hover:scale-110 active:scale-95 ${isRepeat ? 'text-accent-primary' : 'text-text-muted hover:text-white'}`}
          >
            <Repeat size={18} strokeWidth={2.5} />
          </button>
        </div>

        {/* Professional Slider */}
        <div className="w-full max-w-xl flex items-center gap-3">
          <span className="text-[10px] md:text-xs text-text-muted font-bold tabular-nums min-w-[32px] md:min-w-[40px] text-right">{formatTime(progress)}</span>
          <div className="slider-container group">
            <input 
              type="range" 
              min="0" 
              max={duration || 0} 
              value={progress} 
              onChange={handleScrub}
              className="absolute inset-0 w-full h-full opacity-0 z-10 cursor-pointer"
            />
            <div 
              className="slider-progress" 
              style={{ width: `${duration ? (progress / duration) * 100 : 0}%` }}
            >
              <div className="slider-thumb" />
            </div>
          </div>
          <span className="text-[10px] md:text-xs text-text-muted font-bold tabular-nums min-w-[32px] md:min-w-[40px]">{formatTime(duration)}</span>
        </div>
      </div>

      {/* Extra Controls */}
      <div className="flex-[0.6] md:flex-1 flex items-center justify-end gap-3 md:gap-5">
        <button className="hidden sm:block text-text-muted hover:text-white transition-all hover:scale-110">
          <ListMusic size={20} strokeWidth={2.5} />
        </button>
        
        <div className="hidden md:flex items-center gap-3 group w-32">
          <Volume2 size={20} className="text-text-muted group-hover:text-white transition-colors" strokeWidth={2.5} />
          <div className="slider-container group">
            <input 
              type="range" 
              min="0" 
              max="1" 
              step="0.01" 
              value={volume} 
              onChange={(e) => setVolume(Number(e.target.value))}
              className="absolute inset-0 w-full h-full opacity-0 z-10 cursor-pointer"
            />
            <div 
              className="slider-progress" 
              style={{ width: `${volume * 100}%` }}
            >
              <div className="slider-thumb" />
            </div>
          </div>
        </div>
        
        <button className="hidden sm:block text-text-muted hover:text-white transition-all hover:scale-110">
          <Maximize2 size={18} md:size={20} strokeWidth={2.5} />
        </button>
      </div>
    </div>
  );
};
