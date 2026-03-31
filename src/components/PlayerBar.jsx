import { useRef, useEffect, useState } from 'react';
import { Play, Pause, SkipBack, SkipForward, Repeat, Shuffle, Volume2, Maximize2, ListMusic, Heart } from 'lucide-react';
import { useMusic } from '../MusicContext';

export const PlayerBar = () => {
  const { currentSong, isPlaying, setIsPlaying, setCurrentSong, songs, likedSongs, toggleLike } = useMusic();
  const audioRef = useRef(null);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.5);
  const [isShuffle, setIsShuffle] = useState(false);
  const [isRepeat, setIsRepeat] = useState(false);

  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.play().catch(err => console.error("Playback failed", err));
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlaying, currentSong]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  const onTimeUpdate = () => {
    if (audioRef.current) {
      setProgress(audioRef.current.currentTime);
      setDuration(audioRef.current.duration);
    }
  };

  const handleScrub = (e) => {
    if (audioRef.current) {
      const time = Number(e.target.value);
      audioRef.current.currentTime = time;
      setProgress(time);
    }
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
    if (isNaN(time)) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const isLiked = currentSong && likedSongs.some(s => s.id === currentSong.id);

  return (
    <div className="h-24 md:h-24 glass-effect border-t border-white/10 flex items-center px-4 md:px-6 gap-3 md:gap-6 select-none z-50">
      <audio 
        ref={audioRef} 
        src={currentSong?.url} 
        onTimeUpdate={onTimeUpdate}
        onEnded={isRepeat ? () => audioRef.current?.play() : handleSkipForward}
      />

      {/* Song Info */}
      <div className="flex-[0.5] md:flex-1 flex items-center gap-3 md:gap-4 min-w-0">
        {currentSong ? (
          <>
            <img src={currentSong.thumbnail} alt={currentSong.title} className="w-10 h-10 md:w-14 md:h-14 object-cover rounded-lg shadow-lg" />
            <div className="flex flex-col min-w-0">
              <h4 className="font-bold text-[10px] md:text-sm text-white truncate">{currentSong.title}</h4>
              <p className="text-[8px] md:text-xs text-text-secondary truncate">{currentSong.artist || 'Unknown Artist'}</p>
            </div>
            <button 
              onClick={() => toggleLike(currentSong)}
              className={`ml-1 md:ml-2 hover:scale-110 transition-transform ${isLiked ? 'text-accent-primary' : 'text-text-secondary hover:text-white'}`}
            >
              <Heart size={16} md:size={20} fill={isLiked ? 'currentColor' : 'none'} />
            </button>
          </>
        ) : (
          <div className="flex items-center gap-3 opacity-50">
            <div className="w-10 h-10 md:w-14 md:h-14 bg-white/10 rounded-lg animate-pulse"></div>
            <div className="flex flex-col gap-1 md:gap-2">
              <div className="w-16 md:w-24 h-2 md:h-3 bg-white/10 rounded animate-pulse"></div>
              <div className="w-10 md:w-16 h-1.5 md:h-2 bg-white/10 rounded animate-pulse"></div>
            </div>
          </div>
        )}
      </div>

      {/* Player Controls */}
      <div className="flex-1 md:flex-[2] flex flex-col items-center gap-1 md:gap-2 max-w-[40%] md:max-w-none">
        <div className="flex items-center gap-3 md:gap-6">
          <button 
            onClick={() => setIsShuffle(!isShuffle)}
            className={`hidden md:block transition-colors ${isShuffle ? 'text-accent-primary' : 'text-text-secondary hover:text-white'}`}
          >
            <Shuffle size={18} />
          </button>
          <button 
            onClick={handleSkipBack}
            className="text-text-secondary hover:text-white transition-colors"
          >
            <SkipBack size={20} md:size={24} fill="currentColor" />
          </button>
          <button 
            onClick={() => setIsPlaying(!isPlaying)}
            className="w-8 h-8 md:w-10 md:h-10 bg-white text-black rounded-full flex items-center justify-center hover:scale-105 transition-transform shadow-lg"
          >
            {isPlaying ? <Pause size={18} md:size={20} fill="currentColor" /> : <Play size={18} md:size={20} fill="currentColor" className="ml-1" />}
          </button>
          <button 
            onClick={handleSkipForward}
            className="text-text-secondary hover:text-white transition-colors"
          >
            <SkipForward size={20} md:size={24} fill="currentColor" />
          </button>
          <button 
            onClick={() => setIsRepeat(!isRepeat)}
            className={`hidden md:block transition-colors ${isRepeat ? 'text-accent-primary' : 'text-text-secondary hover:text-white'}`}
          >
            <Repeat size={18} />
          </button>
        </div>

        <div className="w-full max-w-md flex items-center gap-2 md:gap-3">
          <span className="text-[8px] md:text-xs text-text-secondary tabular-nums min-w-[25px] md:min-w-[40px] text-right">{formatTime(progress)}</span>
          <div className="flex-1 h-1 md:h-1.5 bg-white/10 rounded-full relative group cursor-pointer">
            <input 
              type="range" 
              min="0" 
              max={duration || 0} 
              value={progress} 
              onChange={handleScrub}
              className="absolute inset-0 w-full h-full opacity-0 z-10 cursor-pointer"
            />
            <div 
              className="absolute left-0 top-0 h-full bg-accent-primary rounded-full group-hover:bg-accent-secondary transition-colors" 
              style={{ width: `${(progress / duration) * 100}%` }}
            >
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 md:w-3 md:h-3 bg-white rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </div>
          <span className="text-[8px] md:text-xs text-text-secondary tabular-nums min-w-[25px] md:min-w-[40px]">{formatTime(duration)}</span>
        </div>
      </div>

      {/* Extra Controls */}
      <div className="flex-[0.5] md:flex-1 flex items-center justify-end gap-2 md:gap-4">
        <div className="hidden md:flex items-center gap-2 group">
          <Volume2 size={20} className="text-text-secondary group-hover:text-white transition-colors" />
          <div className="w-24 h-1.5 bg-white/10 rounded-full relative overflow-hidden">
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
              className="absolute left-0 top-0 h-full bg-white group-hover:bg-accent-primary transition-colors" 
              style={{ width: `${volume * 100}%` }}
            />
          </div>
        </div>
        <button className="hidden sm:block text-text-secondary hover:text-white transition-colors">
          <Maximize2 size={18} md:size={20} />
        </button>
      </div>
    </div>
  );
};
