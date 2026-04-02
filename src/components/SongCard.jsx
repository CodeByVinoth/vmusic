import { Play, Heart, Plus, Music, Pause } from 'lucide-react';
import { useMusic } from '../MusicContext';
import { useState, useRef, useEffect } from 'react';

export const SongCard = ({ song }) => {
  const { currentSong, isPlaying, setCurrentSong, setIsPlaying, toggleLike, likedSongs } = useMusic();

  const isCurrentSong = currentSong?.id === song.id;
  const isCurrentlyPlaying = isCurrentSong && isPlaying;
  const isLiked = likedSongs.some(s => s.id === song.id);

  return (
    <div 
      onClick={() => {
        setCurrentSong(song);
        setIsPlaying(true);
      }}
      className="spotify-card group"
    >
      <div className="relative mb-4 aspect-square shadow-2xl overflow-hidden rounded-md">
        <img 
          src={song.thumbnail} 
          alt={song.title} 
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
        />
        
        {/* Play Button Overlay */}
        <div className="absolute bottom-2 right-2 translate-y-2 opacity-0 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
          <button className="w-12 h-12 bg-accent-primary text-black rounded-full flex items-center justify-center shadow-2xl hover:scale-105 active:scale-95 transition-all">
            {isCurrentlyPlaying ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" className="ml-1" />}
          </button>
        </div>

        {isCurrentSong && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            {isCurrentlyPlaying ? (
              <div className="playing-bars">
                <div className="playing-bar" />
                <div className="playing-bar" />
                <div className="playing-bar" />
              </div>
            ) : (
              <Play size={40} className="text-white" fill="white" />
            )}
          </div>
        )}
      </div>
      
      <div className="flex flex-col gap-1 min-w-0">
        <h3 className={`font-bold truncate text-base ${isCurrentSong ? 'text-accent-primary' : 'text-white'}`}>
          {song.title}
        </h3>
        <p className="text-sm text-text-muted truncate font-medium group-hover:text-white transition-colors">
          {song.artist || 'Unknown Artist'}
        </p>
      </div>
    </div>
  );
};
