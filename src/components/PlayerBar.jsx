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
      
      if (isPlaying && currentSong?.url) {
        const playPromise = audioRef.current.play();
        if (playPromise !== undefined) {
          playPromise.catch(error => {
            if (error.name !== 'AbortError') setIsPlaying(false);
          });
        }
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlaying, currentSong?.url, volume, isMuted, setIsPlaying]);

  const onTimeUpdate = () => {
    if (audioRef.current) setProgress(audioRef.current.currentTime);
  };

  const onLoadedMetadata = () => {
    if (audioRef.current) setDuration(audioRef.current.duration);
  };

  const handleScrub = (e) => {
    const time = Number(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setProgress(time);
    }
  };

  const handleSkipForward = useCallback(() => {
    if (!currentSong || !songs.length) return;
    const currentIndex = songs.findIndex(s => s.id === currentSong.id);
    let nextIndex = isShuffle ? Math.floor(Math.random() * songs.length) : (currentIndex + 1) % songs.length;
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
    const min = Math.floor(time / 60);
    const sec = Math.floor(time % 60);
    return `${min}:${sec.toString().padStart(2, '0')}`;
  };

  const isLiked = currentSong && likedSongs.some(s => s.id === currentSong.id);

  return (
    <footer className="fixed bottom-0 left-0 right-0 z-[100] select-none">
      <audio 
        ref={audioRef} 
        src={currentSong?.url} 
        onTimeUpdate={onTimeUpdate}
        onLoadedMetadata={onLoadedMetadata}
        onEnded={() => isRepeat ? (audioRef.current.currentTime = 0, audioRef.current.play()) : handleSkipForward()}
      />

      {/* --- MOBILE MINI PLAYER --- */}
      <div className="md:hidden px-2 mb-2">
        {currentSong && (
          <div className="bg-[#282828] rounded-md h-[56px] flex items-center justify-between px-3 gap-3 shadow-2xl animate-slide-up relative overflow-hidden">
            {/* Progress line at bottom of mini player */}
            <div className="absolute bottom-0 left-0 h-[2px] bg-white/20 w-full">
              <div 
                className="h-full bg-white transition-all duration-100" 
                style={{ width: `${duration > 0 ? (progress / duration) * 100 : 0}%` }}
              />
            </div>

            <div className="flex items-center gap-3 min-w-0 flex-1">
              <img src={currentSong.thumbnail} alt="" className="w-10 h-10 object-cover rounded shadow-lg" />
              <div className="flex flex-col min-w-0">
                <h4 className="font-bold text-sm text-white truncate">{currentSong.title}</h4>
                <p className="text-xs text-text-secondary truncate">{currentSong.artist || 'Unknown Artist'}</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <button 
                onClick={() => toggleLike(currentSong)}
                className={isLiked ? 'text-accent-primary' : 'text-white'}
              >
                <Heart size={20} fill={isLiked ? 'currentColor' : 'none'} />
              </button>
              <button 
                onClick={() => setIsPlaying(!isPlaying)}
                className="text-white"
              >
                {isPlaying ? <Pause size={28} fill="currentColor" /> : <Play size={28} fill="currentColor" className="ml-0.5" />}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* --- DESKTOP PLAYER BAR --- */}
      <div className="hidden md:flex h-[90px] bg-black border-t border-white/5 px-4 items-center">
        <div className="w-full flex items-center justify-between gap-4 max-w-[100vw]">
          
          {/* --- LEFT: SONG INFO --- */}
          <div className="flex items-center gap-3 w-[30%] min-w-[180px]">
            {currentSong ? (
              <>
                <img src={currentSong.thumbnail} alt="" className="w-14 h-14 object-cover rounded shadow-lg" />
                <div className="flex flex-col min-w-0">
                  <h4 className="font-bold text-sm text-white truncate hover:underline cursor-pointer">
                    {currentSong.title}
                  </h4>
                  <p className="text-xs text-text-muted truncate hover:text-white hover:underline cursor-pointer">
                    {currentSong.artist || 'Unknown Artist'}
                  </p>
                </div>
                <button 
                  onClick={() => toggleLike(currentSong)}
                  className={`ml-2 spotify-btn-icon ${isLiked ? 'text-accent-primary' : ''}`}
                >
                  <Heart size={18} fill={isLiked ? 'currentColor' : 'none'} />
                </button>
              </>
            ) : (
              <div className="flex items-center gap-3 opacity-20">
                <div className="w-14 h-14 bg-bg-highlight rounded" />
                <div className="flex flex-col gap-2">
                  <div className="w-24 h-3 bg-bg-highlight rounded" />
                  <div className="w-16 h-2 bg-bg-highlight rounded" />
                </div>
              </div>
            )}
          </div>

          {/* --- CENTER: CONTROLS --- */}
          <div className="flex flex-col items-center gap-2 flex-1 max-w-[722px]">
            <div className="flex items-center gap-6">
              <button onClick={() => setIsShuffle(!isShuffle)} className={`spotify-btn-icon ${isShuffle ? 'text-accent-primary' : ''}`}>
                <Shuffle size={18} />
              </button>
              <button onClick={handleSkipBack} className="spotify-btn-icon"><SkipBack size={20} fill="currentColor" /></button>
              <button 
                onClick={() => setIsPlaying(!isPlaying)}
                className="w-8 h-8 rounded-full bg-white text-black flex items-center justify-center hover:scale-105 transition-all"
              >
                {isPlaying ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" className="ml-0.5" />}
              </button>
              <button onClick={handleSkipForward} className="spotify-btn-icon"><SkipForward size={20} fill="currentColor" /></button>
              <button onClick={() => setIsRepeat(!isRepeat)} className={`spotify-btn-icon ${isRepeat ? 'text-accent-primary' : ''}`}>
                <Repeat size={18} />
              </button>
            </div>

            <div className="flex w-full items-center gap-2 group">
              <span className="text-[11px] text-text-muted min-w-[40px] text-right">{formatTime(progress)}</span>
              <div className="relative flex-1 h-1 flex items-center">
                <div className="absolute w-full h-1 bg-white/20 rounded-full" />
                <div 
                  className="absolute h-1 bg-white group-hover:bg-accent-primary rounded-full transition-colors" 
                  style={{ width: `${duration > 0 ? (progress / duration) * 100 : 0}%` }}
                />
                <input 
                  type="range" 
                  min="0" max={duration || 0} value={progress} 
                  onChange={handleScrub}
                  className="absolute w-full z-10 opacity-0 cursor-pointer"
                />
              </div>
              <span className="text-[11px] text-text-muted min-w-[40px]">{formatTime(duration)}</span>
            </div>
          </div>

          {/* --- RIGHT: VOLUME --- */}
          <div className="flex items-center justify-end gap-3 w-[30%] min-w-[180px]">
            <button className="spotify-btn-icon"><ListMusic size={18} /></button>
            <div className="flex items-center gap-2 group w-32">
              <button onClick={() => setIsMuted(!isMuted)} className="spotify-btn-icon">
                {isMuted || volume === 0 ? <VolumeX size={18} /> : <Volume2 size={18} />}
              </button>
              <div className="relative flex-1 h-1 flex items-center">
                <div className="absolute w-full h-1 bg-white/20 rounded-full" />
                <div 
                  className="absolute h-1 bg-white group-hover:bg-accent-primary rounded-full" 
                  style={{ width: `${isMuted ? 0 : volume * 100}%` }} 
                />
                <input 
                  type="range" 
                  min="0" max="1" step="0.01" value={isMuted ? 0 : volume} 
                  onChange={(e) => { setVolume(Number(e.target.value)); setIsMuted(false); }}
                  className="absolute w-full z-10 opacity-0 cursor-pointer"
                />
              </div>
            </div>
            <button className="spotify-btn-icon"><Maximize2 size={16} /></button>
          </div>
        </div>
      </div>
    </footer>
  );
};