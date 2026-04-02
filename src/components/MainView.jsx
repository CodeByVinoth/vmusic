import React, { useState, useRef, useCallback } from 'react';
import { useMusic } from '../MusicContext';
import { useAuth } from '../AuthContext';
import { SongCard } from './SongCard';
import { AdminPage } from '../pages/AdminPage';
import { LoginPage } from '../pages/LoginPage';
import {
  Search as SearchIcon,
  Heart,
  AlertCircle,
  RefreshCw,
  Clock,
  Music,
  Play,
  Pause,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  Shuffle,
} from 'lucide-react';

/* ─────────────────────────────────────────
   Helper: time-of-day greeting
───────────────────────────────────────── */
const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Good Morning';
  if (h < 17) return 'Good Afternoon';
  return 'Good Evening';
};

/* ─────────────────────────────────────────
   Helper: view gradient colours
───────────────────────────────────────── */
const VIEW_GRADIENTS = {
  liked: 'from-[#5038a0]/80',
  playlist: 'from-[#2e3033]/80',
  admin: 'from-[#1e3264]/80',
  search: 'from-[#1a1a1a]/80',
  home: 'from-[#1a1a1a]/60',
};

/* ─────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────── */
export const MainView = () => {
  const {
    currentView,
    songs,
    likedSongs,
    playlists,
    selectedPlaylistId,
    isLoading,
    error,
    refreshSongs,
    currentSong,
    isPlaying,
    setCurrentSong,
    setIsPlaying,
    toggleLike,
  } = useMusic();
  const { user } = useAuth();

  const [searchQuery, setSearchQuery] = useState('');
  const [isScrolled, setIsScrolled] = useState(false);
  const scrollRef = useRef(null);

  const handleScroll = useCallback((e) => {
    setIsScrolled(e.currentTarget.scrollTop > 60);
  }, []);

  const filteredSongs = songs.filter(
    (s) =>
      (s.title && s.title.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (s.artist && s.artist.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const selectedPlaylist = playlists.find((p) => p.id === selectedPlaylistId);
  const gradientClass = VIEW_GRADIENTS[currentView] || VIEW_GRADIENTS.home;

  /* ── Play all songs in a list ── */
  const handlePlayAll = (songList) => {
    if (!songList || songList.length === 0) return;
    setCurrentSong(songList[0]);
    setIsPlaying(true);
  };

  /* ── Play a specific song from a list ── */
  const handlePlaySong = (song) => {
    setCurrentSong(song);
    setIsPlaying(true);
  };

  /* ── Format duration (placeholder) ── */
  const formatDuration = () => '3:45';

  return (
    <div className="flex flex-col h-full overflow-hidden relative bg-[#121212]">

      {/* ── Gradient Background ── */}
      <div
        className={`absolute top-0 left-0 right-0 h-72 bg-gradient-to-b ${gradientClass} to-transparent pointer-events-none z-0 transition-all duration-700`}
      />

      {/* ── Sticky Header ── */}
      <header
        className={`
          sticky top-0 z-30 flex items-center gap-3 px-4 md:px-6
          transition-all duration-300 flex-shrink-0
          ${isScrolled
            ? 'bg-[#121212]/95 backdrop-blur-xl border-b border-white/5 py-3'
            : 'bg-transparent py-4'
          }
        `}
        style={{ paddingTop: 'max(16px, env(safe-area-inset-top))' }}
      >
        {/* Desktop nav arrows */}
        <div className="hidden md:flex items-center gap-1.5 flex-shrink-0">
          <button
            className="w-8 h-8 rounded-full bg-black/40 flex items-center justify-center text-white/30 cursor-default"
            disabled
            aria-label="Back"
          >
            <ChevronLeft size={20} />
          </button>
          <button
            className="w-8 h-8 rounded-full bg-black/40 flex items-center justify-center text-white/30 cursor-default"
            disabled
            aria-label="Forward"
          >
            <ChevronRight size={20} />
          </button>
        </div>

        {/* Search input */}
        {currentView === 'search' && (
          <div className="relative flex-1 max-w-md ml-0 md:ml-2 pl-10 md:pl-0">
            <SearchIcon
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[#b3b3b3] pointer-events-none"
              size={18}
            />
            <input
              type="text"
              placeholder="What do you want to listen to?"
              className="
                w-full bg-white/10 hover:bg-white/15 border border-white/10
                focus:border-white/30 focus:bg-white/15
                text-white placeholder:text-[#b3b3b3]
                py-2.5 pl-10 pr-4 rounded-full text-sm outline-none
                transition-all duration-200
              "
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus
            />
          </div>
        )}

        {/* Page title (mobile, when scrolled) */}
        {currentView !== 'search' && isScrolled && (
          <h2 className="font-bold text-base text-white pl-10 md:pl-0 truncate">
            {currentView === 'liked'
              ? 'Liked Songs'
              : currentView === 'playlist' && selectedPlaylist
              ? selectedPlaylist.name
              : currentView.charAt(0).toUpperCase() + currentView.slice(1)}
          </h2>
        )}
      </header>

      {/* ── Scrollable Content ── */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="relative z-10 flex-1 overflow-y-auto custom-scrollbar"
        style={{
          paddingBottom: 'calc(var(--player-height-mobile) + 24px + env(safe-area-inset-bottom))',
        }}
      >

        {/* ════════════════════════════════
            HOME VIEW
        ════════════════════════════════ */}
        {currentView === 'home' && (
          <div className="flex flex-col gap-8 px-4 md:px-6 pt-2 pb-4 animate-slide-up">

            {/* Greeting */}
            <div className="flex items-center justify-between mt-2">
              <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white">
                {getGreeting()}
              </h1>
            </div>

            {/* Quick-play grid (top 6 songs) */}
            {songs.length > 0 && (
              <section>
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2 md:gap-3">
                  {songs.slice(0, 6).map((song) => {
                    const isActive = currentSong?.id === song.id;
                    const isNowPlaying = isActive && isPlaying;
                    return (
                      <button
                        key={song.id}
                        onClick={() => handlePlaySong(song)}
                        className={`
                          flex items-center gap-3 rounded-lg overflow-hidden
                          transition-all duration-200 group text-left
                          ${isActive
                            ? 'bg-white/15 border border-white/10'
                            : 'bg-white/5 hover:bg-white/10 border border-transparent'
                          }
                        `}
                      >
                        <div className="relative w-14 h-14 flex-shrink-0">
                          {song.thumbnail ? (
                            <img
                              src={song.thumbnail}
                              alt=""
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-[#282828] flex items-center justify-center">
                              <Music size={20} className="text-[#b3b3b3]" />
                            </div>
                          )}
                          {isActive && (
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                              {isNowPlaying ? (
                                <div className="playing-bars scale-75">
                                  <div className="playing-bar" />
                                  <div className="playing-bar" />
                                  <div className="playing-bar" />
                                </div>
                              ) : (
                                <Play size={16} fill="white" className="text-white" />
                              )}
                            </div>
                          )}
                        </div>
                        <span
                          className={`
                            font-semibold text-sm truncate flex-1 pr-3
                            ${isActive ? 'text-accent-primary' : 'text-white'}
                          `}
                        >
                          {song.title}
                        </span>
                        <div className="mr-3 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                          <div className="w-8 h-8 rounded-full bg-accent-primary flex items-center justify-center shadow-lg">
                            {isNowPlaying
                              ? <Pause size={14} fill="black" className="text-black" />
                              : <Play size={14} fill="black" className="text-black ml-0.5" />
                            }
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </section>
            )}

            {/* All Songs section */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl md:text-2xl font-black text-white tracking-tight">
                  All Songs
                </h2>
                <span className="text-xs text-[#b3b3b3] font-medium">
                  {songs.length} {songs.length === 1 ? 'song' : 'songs'}
                </span>
              </div>

              {isLoading ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4">
                  {Array(10).fill(0).map((_, i) => <SongCardSkeleton key={i} />)}
                </div>
              ) : error ? (
                <ErrorState message={error} onRetry={refreshSongs} />
              ) : songs.length === 0 ? (
                <EmptyState
                  icon={<Music size={48} />}
                  title="No songs yet"
                  subtitle="Add songs via the Admin panel"
                />
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3 md:gap-4">
                  {songs.map((song, index) => (
                    <SongCard key={`${song.id}-${index}`} song={song} />
                  ))}
                </div>
              )}
            </section>
          </div>
        )}

        {/* ════════════════════════════════
            SEARCH VIEW
        ════════════════════════════════ */}
        {currentView === 'search' && (
          <div className="flex flex-col gap-6 px-4 md:px-6 pt-4 pb-4 animate-slide-up">
            {searchQuery ? (
              <>
                <h2 className="text-lg font-bold text-white">
                  {filteredSongs.length > 0
                    ? `Results for "${searchQuery}"`
                    : `No results for "${searchQuery}"`}
                </h2>
                {filteredSongs.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3 md:gap-4">
                    {filteredSongs.map((song, index) => (
                      <SongCard key={`${song.id}-${index}`} song={song} />
                    ))}
                  </div>
                ) : (
                  <EmptyState
                    icon={<SearchIcon size={48} />}
                    title="No songs found"
                    subtitle="Try different keywords or check the spelling"
                  />
                )}
              </>
            ) : (
              <>
                <h2 className="text-xl font-black text-white">Browse all</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
                  {[
                    { label: 'Pop', color: 'from-pink-600 to-pink-800' },
                    { label: 'Rock', color: 'from-blue-600 to-blue-800' },
                    { label: 'Hip-Hop', color: 'from-orange-600 to-orange-800' },
                    { label: 'Jazz', color: 'from-emerald-600 to-emerald-800' },
                    { label: 'Indie', color: 'from-purple-600 to-purple-800' },
                    { label: 'Classical', color: 'from-red-600 to-red-800' },
                    { label: 'Electronic', color: 'from-cyan-600 to-cyan-800' },
                    { label: 'R&B', color: 'from-yellow-600 to-yellow-800' },
                  ].map((genre) => (
                    <div
                      key={genre.label}
                      className={`
                        relative h-24 sm:h-32 md:h-40 rounded-xl overflow-hidden cursor-pointer
                        bg-gradient-to-br ${genre.color}
                        hover:brightness-110 active:brightness-90
                        transition-all duration-200 shadow-lg
                      `}
                    >
                      <span className="absolute top-3 left-4 text-base sm:text-xl font-black text-white drop-shadow-lg">
                        {genre.label}
                      </span>
                      <div className="absolute -right-3 -bottom-3 w-16 h-16 sm:w-20 sm:h-20 bg-white/20 rotate-[25deg] rounded-lg shadow-xl" />
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* ════════════════════════════════
            LIKED SONGS / PLAYLIST VIEW
        ════════════════════════════════ */}
        {(currentView === 'liked' || (currentView === 'playlist' && selectedPlaylist)) && (() => {
          const isLikedView = currentView === 'liked';
          const songList = isLikedView ? likedSongs : selectedPlaylist.songs;
          const title = isLikedView ? 'Liked Songs' : selectedPlaylist.name;
          const isCurrentlyPlaying = currentSong && songList.some(s => s.id === currentSong.id) && isPlaying;

          return (
            <div className="flex flex-col animate-slide-up">
              {/* ── Hero Header ── */}
              <div className="px-4 md:px-6 pt-6 pb-6">
                <div className="flex flex-col sm:flex-row items-center sm:items-end gap-5 sm:gap-6">
                  {/* Cover art */}
                  <div
                    className={`
                      w-36 h-36 sm:w-48 sm:h-48 md:w-56 md:h-56 rounded-xl shadow-2xl flex-shrink-0
                      flex items-center justify-center overflow-hidden
                      ${isLikedView
                        ? 'bg-gradient-to-br from-[#450af5] to-[#c4efd9]'
                        : 'bg-gradient-to-br from-[#2e3033] to-[#1a1a1a]'
                      }
                    `}
                  >
                    {isLikedView
                      ? <Heart size={56} fill="white" className="text-white" />
                      : <Music size={56} className="text-white/60" />
                    }
                  </div>

                  {/* Info */}
                  <div className="flex flex-col gap-2 text-center sm:text-left min-w-0 flex-1">
                    <span className="text-xs font-bold uppercase tracking-widest text-[#b3b3b3]">
                      Playlist
                    </span>
                    <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black tracking-tight text-white leading-none">
                      {title}
                    </h1>
                    <div className="flex items-center justify-center sm:justify-start gap-2 text-sm text-[#b3b3b3] flex-wrap">
                      <span className="font-bold text-white">{user?.username || 'User'}</span>
                      <span className="w-1 h-1 rounded-full bg-white/40" />
                      <span>{songList.length} {songList.length === 1 ? 'song' : 'songs'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* ── Action Bar ── */}
              <div className="px-4 md:px-6 pb-4 flex items-center gap-4">
                <button
                  onClick={() => handlePlayAll(songList)}
                  disabled={songList.length === 0}
                  className="
                    w-14 h-14 rounded-full bg-accent-primary flex items-center justify-center
                    hover:scale-105 active:scale-95 transition-transform shadow-xl shadow-accent-primary/30
                    disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100
                  "
                  aria-label="Play all"
                >
                  {isCurrentlyPlaying
                    ? <Pause size={24} fill="black" className="text-black" />
                    : <Play size={24} fill="black" className="text-black ml-1" />
                  }
                </button>
                <button
                  className="w-10 h-10 rounded-full flex items-center justify-center text-[#b3b3b3] hover:text-white hover:bg-white/10 transition-all"
                  aria-label="Shuffle"
                >
                  <Shuffle size={22} />
                </button>
                <button
                  className="w-10 h-10 rounded-full flex items-center justify-center text-[#b3b3b3] hover:text-white hover:bg-white/10 transition-all"
                  aria-label="More options"
                >
                  <MoreHorizontal size={22} />
                </button>
              </div>

              {/* ── Song List ── */}
              {songList.length === 0 ? (
                <div className="px-4 md:px-6 py-12">
                  <EmptyState
                    icon={isLikedView ? <Heart size={48} /> : <Music size={48} />}
                    title={isLikedView ? 'No liked songs yet' : 'This playlist is empty'}
                    subtitle={isLikedView ? 'Like songs to add them here' : 'Add songs to this playlist'}
                  />
                </div>
              ) : (
                <div className="px-2 md:px-4">
                  {/* Table header (desktop) */}
                  <div className="hidden md:grid grid-cols-[40px_1fr_1fr_80px] gap-4 px-4 py-2 mb-1 border-b border-white/10">
                    <span className="text-xs font-bold text-[#b3b3b3] uppercase tracking-wider text-center">#</span>
                    <span className="text-xs font-bold text-[#b3b3b3] uppercase tracking-wider">Title</span>
                    <span className="text-xs font-bold text-[#b3b3b3] uppercase tracking-wider">Album</span>
                    <div className="flex justify-end">
                      <Clock size={14} className="text-[#b3b3b3]" />
                    </div>
                  </div>

                  {/* Song rows */}
                  {songList.map((song, index) => {
                    const isActive = currentSong?.id === song.id;
                    const isNowPlaying = isActive && isPlaying;
                    const songIsLiked = likedSongs.some(s => s.id === song.id);

                    return (
                      <div
                        key={`${song.id}-${index}`}
                        onClick={() => handlePlaySong(song)}
                        className={`
                          flex md:grid md:grid-cols-[40px_1fr_1fr_80px] gap-3 md:gap-4
                          px-3 md:px-4 py-3 rounded-lg cursor-pointer group
                          transition-all duration-150
                          ${isActive ? 'bg-white/10' : 'hover:bg-white/5'}
                        `}
                      >
                        {/* Index / Playing indicator */}
                        <div className="hidden md:flex items-center justify-center w-10 flex-shrink-0">
                          {isActive ? (
                            isNowPlaying ? (
                              <div className="playing-bars scale-75">
                                <div className="playing-bar" />
                                <div className="playing-bar" />
                                <div className="playing-bar" />
                              </div>
                            ) : (
                              <Play size={14} fill="currentColor" className="text-accent-primary" />
                            )
                          ) : (
                            <span className="text-xs text-[#b3b3b3] group-hover:hidden font-mono">
                              {index + 1}
                            </span>
                          )}
                          {!isActive && (
                            <Play size={14} fill="currentColor" className="text-white hidden group-hover:block" />
                          )}
                        </div>

                        {/* Song info */}
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <div className="relative flex-shrink-0">
                            {song.thumbnail ? (
                              <img
                                src={song.thumbnail}
                                alt=""
                                className="w-10 h-10 md:w-11 md:h-11 object-cover rounded-md shadow-md"
                              />
                            ) : (
                              <div className="w-10 h-10 md:w-11 md:h-11 bg-[#282828] rounded-md flex items-center justify-center">
                                <Music size={16} className="text-[#b3b3b3]" />
                              </div>
                            )}
                            {isActive && (
                              <div className="absolute inset-0 bg-black/50 rounded-md flex items-center justify-center">
                                {isNowPlaying ? (
                                  <div className="playing-bars scale-75">
                                    <div className="playing-bar" />
                                    <div className="playing-bar" />
                                    <div className="playing-bar" />
                                  </div>
                                ) : (
                                  <Play size={12} fill="white" className="text-white" />
                                )}
                              </div>
                            )}
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span
                              className={`
                                font-semibold text-sm truncate
                                ${isActive ? 'text-accent-primary' : 'text-white'}
                              `}
                            >
                              {song.title}
                            </span>
                            <span className="text-xs text-[#b3b3b3] truncate">
                              {song.artist || 'Unknown Artist'}
                            </span>
                          </div>
                        </div>

                        {/* Album (desktop) */}
                        <div className="hidden md:flex items-center min-w-0">
                          <span className="text-sm text-[#b3b3b3] truncate group-hover:text-white transition-colors">
                            Single
                          </span>
                        </div>

                        {/* Duration + Like */}
                        <div className="flex items-center justify-end gap-3 flex-shrink-0">
                          <button
                            onClick={(e) => { e.stopPropagation(); toggleLike(song); }}
                            className={`
                              transition-all duration-150 active:scale-90
                              ${songIsLiked ? 'text-accent-primary opacity-100' : 'text-[#b3b3b3] opacity-0 group-hover:opacity-100'}
                            `}
                            aria-label={songIsLiked ? 'Unlike' : 'Like'}
                          >
                            <Heart size={15} fill={songIsLiked ? 'currentColor' : 'none'} />
                          </button>
                          <span className="text-xs text-[#b3b3b3] font-mono min-w-[36px] text-right">
                            {formatDuration()}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })()}

        {/* ════════════════════════════════
            ADMIN VIEW
        ════════════════════════════════ */}
        {currentView === 'admin' && (
          <div className="animate-slide-up">
            {user ? <AdminPage /> : <LoginPage />}
          </div>
        )}

      </div>
    </div>
  );
};

/* ─────────────────────────────────────────
   HELPER COMPONENTS
───────────────────────────────────────── */

const ErrorState = ({ message, onRetry }) => (
  <div className="flex flex-col items-center justify-center gap-5 py-16 px-6 rounded-2xl bg-red-500/5 border border-red-500/10">
    <div className="w-16 h-16 rounded-full bg-red-500/15 flex items-center justify-center">
      <AlertCircle size={32} className="text-red-400" />
    </div>
    <div className="text-center">
      <p className="text-lg font-bold text-white mb-1">Something went wrong</p>
      <p className="text-sm text-[#b3b3b3]">{message}</p>
    </div>
    <button
      onClick={onRetry}
      className="flex items-center gap-2 px-6 py-2.5 bg-white text-black rounded-full font-bold text-sm hover:scale-105 active:scale-95 transition-transform shadow-lg"
    >
      <RefreshCw size={16} />
      Try Again
    </button>
  </div>
);

const EmptyState = ({ icon, title, subtitle }) => (
  <div className="flex flex-col items-center justify-center gap-3 py-16 px-6 rounded-2xl border border-dashed border-white/10">
    <div className="text-white/20">{icon}</div>
    <div className="text-center">
      <p className="text-base font-bold text-white/50">{title}</p>
      <p className="text-sm text-white/30 mt-1">{subtitle}</p>
    </div>
  </div>
);

const SongCardSkeleton = () => (
  <div className="flex flex-col gap-3 p-3 sm:p-4 rounded-xl bg-[#181818] animate-pulse">
    <div className="aspect-square w-full bg-white/10 rounded-lg" />
    <div className="flex flex-col gap-2">
      <div className="h-3.5 bg-white/10 rounded-full w-4/5" />
      <div className="h-3 bg-white/10 rounded-full w-3/5" />
    </div>
  </div>
);