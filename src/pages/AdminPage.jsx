import React, { useState, useRef, useMemo } from 'react';
import axios from 'axios';
import api from '../axiosInstance';
import { useMusic } from '../MusicContext';
import { useAuth } from '../AuthContext';
import {
  Upload,
  Link as LinkIcon,
  CheckCircle,
  XCircle,
  Loader2,
  LogOut,
  Search,
  Trash2,
  Music,
  AlertCircle,
  FileAudio,
  Download,
  ChevronRight,
  Play,
} from 'lucide-react';

export const AdminPage = () => {
  const { songs, refreshSongs } = useMusic();
  const { token, logout } = useAuth();
  const [url, setUrl] = useState('');
  const [isDownloading, setIsDownloading] = useState(false);
  const [isUploadingLocal, setIsUploadingLocal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(null);
  const [status, setStatus] = useState(null);
  const [message, setMessage] = useState('');
  const [adminSearchQuery, setAdminSearchQuery] = useState('');
  const [youtubeQuery, setYoutubeQuery] = useState('');
  const [youtubeResults, setYoutubeResults] = useState([]);
  const [isSearchingYoutube, setIsSearchingYoutube] = useState(false);
  const [searchMode, setSearchMode] = useState('videos'); // 'videos' or 'playlists'
  const [selectedPlaylist, setSelectedPlaylist] = useState(null);
  const [playlistVideos, setPlaylistVideos] = useState([]);
  const [isLoadingPlaylist, setIsLoadingPlaylist] = useState(false);
  const [downloadingSongId, setDownloadingSongId] = useState(null);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [downloadStage, setDownloadStage] = useState(''); // 'download' or 'upload'
  const [currentSong, setCurrentSong] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [downloadingSongs, setDownloadingSongs] = useState(() => {
    // Load downloading songs from localStorage on mount
    try {
      const saved = localStorage.getItem('vmusic_downloading');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const fileInputRef = useRef(null);
  const audioRef = useRef(null);

  // Save downloading songs to localStorage whenever it changes
  React.useEffect(() => {
    try {
      localStorage.setItem('vmusic_downloading', JSON.stringify(downloadingSongs));
    } catch (e) {
      console.error('Failed to save downloading state:', e);
    }
  }, [downloadingSongs]);

  // Check if a song is already in the library
  const isSongInLibrary = (songTitle) => {
    return songs.some(s => s.title === songTitle);
  };

  // Play song directly in website using YouTube embed
  const playSongInWebsite = (song) => {
    // Create a temporary window with YouTube embed player
    const embedUrl = song.url.replace('watch?v=', 'embed/');
    window.open(embedUrl, '_blank', 'width=800,height=600');
  };

  const filteredSongs = useMemo(() => {
    return songs.filter(
      (s) =>
        s.title.toLowerCase().includes(adminSearchQuery.toLowerCase()) ||
        (s.artist && s.artist.toLowerCase().includes(adminSearchQuery.toLowerCase()))
    );
  }, [songs, adminSearchQuery]);

  const handleYoutubeSearch = async (e) => {
    e.preventDefault();
    if (!youtubeQuery.trim()) return;

    setIsSearchingYoutube(true);
    setYoutubeResults([]);
    setSelectedPlaylist(null);
    setPlaylistVideos([]);
    setStatus(null);

    try {
      const endpoint = searchMode === 'videos' ? '/admin/search-youtube' : '/admin/search-youtube-playlists';
      const response = await api.get(`${endpoint}?keyword=${encodeURIComponent(youtubeQuery)}`, {
        headers: {
          'x-api-key': import.meta.env.VITE_API_KEY || 'song_app_secret_123'
        }
      });
      setYoutubeResults(response.data || []);
      if (response.data.length === 0) {
        setStatus('error');
        setMessage(`No ${searchMode} found on YouTube`);
      }
    } catch (error) {
      console.error('YouTube Search Error:', error);
      const details = error.response?.data?.details || error.response?.data?.message || error.message;
      const statusText = error.response?.status ? ` (HTTP ${error.response.status})` : '';
      setStatus('error');
      setMessage(`${details}${statusText}`);
    } finally {
      setIsSearchingYoutube(false);
    }
  };

  const fetchPlaylistVideos = async (playlist) => {
    setSelectedPlaylist(playlist);
    setIsLoadingPlaylist(true);
    setPlaylistVideos([]);

    try {
      const response = await api.get(`/admin/youtube-playlist-videos?id=${playlist.id}`, {
        headers: {
          'x-api-key': import.meta.env.VITE_API_KEY || 'song_app_secret_123'
        }
      });
      setPlaylistVideos(response.data || []);
    } catch (error) {
      console.error('Playlist Videos Error:', error);
      setStatus('error');
      setMessage('Failed to fetch videos for this playlist');
    } finally {
      setIsLoadingPlaylist(false);
    }
  };

  const handleYoutubeDownload = async (song) => {
    // Check if song is already in library
    if (isSongInLibrary(song.title)) {
      setStatus('success');
      setMessage(`"${song.title}" is already in your library!`);
      return;
    }

    if (downloadingSongId) return; // Prevent multiple concurrent downloads
    
    // Add to downloading list
    setDownloadingSongs(prev => [...prev, { id: song.id, title: song.title, url: song.url, progress: 0, stage: 'Downloading' }]);
    setDownloadingSongId(song.id);
    setDownloadProgress(0);
    setDownloadStage('');
    setStatus(null);
    setMessage('');
    setUrl(song.url);

    try {
      // Create a custom axios instance to track progress
      const response = await axios.post('/api/admin/download', {
        url: song.url,
        title: song.title
      }, {
        onUploadProgress: (progressEvent) => {
          // This tracks the upload progress to GitHub
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setDownloadProgress(progress);
          setDownloadStage('Uploading to GitHub');
          // Update downloading list
          setDownloadingSongs(prev => prev.map(s => s.id === song.id ? { ...s, progress, stage: 'Uploading' } : s));
        },
        onDownloadProgress: (progressEvent) => {
          // This would track download progress if the server sends it
          // Note: This depends on server implementation
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setDownloadProgress(progress);
          setDownloadStage('Downloading from YouTube');
          // Update downloading list
          setDownloadingSongs(prev => prev.map(s => s.id === song.id ? { ...s, progress, stage: 'Downloading' } : s));
        }
      });
      
      setDownloadProgress(100);
      setDownloadStage('Complete');
      setStatus('success');
      setMessage(`Successfully downloaded and uploaded "${song.title}"!`);
      setUrl('');
      
      // Remove from downloading list
      setDownloadingSongs(prev => prev.filter(s => s.id !== song.id));
      
      setTimeout(() => {
        refreshSongs(true);
      }, 1000);
    } catch (error) {
      console.error('YouTube Download Error:', error);
      const details = error.response?.data?.details || error.response?.data?.message || error.message;
      setStatus('error');
      setMessage(details || 'Failed to process YouTube download');
      // Remove from downloading list on error
      setDownloadingSongs(prev => prev.filter(s => s.id !== song.id));
    } finally {
      setDownloadingSongId(null);
      setDownloadProgress(0);
      setDownloadStage('');
    }
  };

  const handleDownload = async (e) => {
    e.preventDefault();
    if (!url) return;

    setIsDownloading(true);
    setStatus(null);
    setMessage('');

    try {
      // Updated to fetch from the new Python API route
      const response = await fetch(`/api/download?url=${encodeURIComponent(url)}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Failed to process download');
      }
      
      const data = await response.json();
      
      setStatus('success');
      setMessage('Successfully processed download!');
      setUrl('');
      setTimeout(() => {
        refreshSongs(true);
      }, 1000);
    } catch (error) {
      console.error('Download Error:', error);
      setStatus('error');
      setMessage(error.message || 'Failed to process download');
    } finally {
      setIsDownloading(false);
    }
  };

  const handleLocalUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    const invalidFiles = files.filter((f) => !f.type.startsWith('audio/'));
    if (invalidFiles.length > 0) {
      setStatus('error');
      setMessage(`Please select only audio files. (${invalidFiles.length} invalid files)`);
      return;
    }

    setIsUploadingLocal(true);
    setStatus(null);
    setMessage('');

    let successCount = 0;
    let failCount = 0;

    const uploadFile = async (file) => {
      try {
        const configResponse = await api.post('/admin/create-upload-url', {
          filename: file.name,
          filetype: file.type,
        });

        const { uploadUrl, githubToken, githubBranch } = configResponse.data;

        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.readAsDataURL(file);
          reader.onload = async (event) => {
            try {
              const contentBase64 = event.target.result.split(',')[1];
              await axios.put(uploadUrl, {
                message: `Upload local song: ${file.name}`,
                content: contentBase64,
                branch: githubBranch,
              }, {
                headers: {
                  Authorization: `Bearer ${githubToken}`,
                },
              });
              successCount++;
              resolve();
            } catch (error) {
              console.error(`GitHub direct upload error for ${file.name}:`, error);
              failCount++;
              reject(error);
            }
          };
          reader.onerror = () => {
            failCount++;
            reject(new Error('FileReader error'));
          };
        });
      } catch (error) {
        console.error(`Backend config error for ${file.name}:`, error);
        failCount++;
        throw error;
      }
    };

    try {
      for (const file of files) {
        try {
          await uploadFile(file);
        } catch (e) {
          // Continue on individual failure
        }
      }

      if (successCount > 0) {
        setStatus('success');
        setMessage(
          `Successfully uploaded ${successCount} songs.${failCount > 0 ? ` (${failCount} failed)` : ''}`
        );
        setTimeout(() => {
          refreshSongs(true);
        }, 1000);
      } else if (failCount > 0) {
        setStatus('error');
        setMessage(`Failed to upload ${failCount} songs. Please try again.`);
      }
    } finally {
      setIsUploadingLocal(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDeleteSong = async (song) => {
    if (!window.confirm(`Are you sure you want to delete "${song.title}"?`)) return;

    setIsDeleting(song.id);
    setStatus(null);
    setMessage('');

    try {
      await api.delete('/admin/songs', {
        params: { path: song.path, sha: song.id },
      });
      setStatus('success');
      setMessage(`Successfully deleted "${song.title}"`);
      refreshSongs();
    } catch (error) {
      console.error('Delete Error:', error);
      setStatus('error');
      setMessage(error.response?.data?.details || 'Failed to delete song');
    } finally {
      setIsDeleting(null);
    }
  };

  const clearStatus = () => {
    setStatus(null);
    setMessage('');
  };

  return (
    <div className="px-4 md:px-8 py-6 md:py-8 max-w-6xl mx-auto">
      {/* ── Header ── */}
      <header className="flex items-center justify-between mb-6 md:mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white">
            Admin Panel
          </h1>
          <p className="text-xs md:text-sm text-[#b3b3b3] mt-1">
            Manage your music library
          </p>
        </div>
        <button
          onClick={logout}
          className="flex items-center gap-2 text-sm font-semibold text-[#b3b3b3] hover:text-white transition-colors"
        >
          <LogOut size={18} />
          <span className="hidden sm:inline">Logout</span>
                  </button>
      </header>

      {/* ── Status Messages ── */}
      {status && (
        <div
          className={`
            flex items-center gap-3 p-4 rounded-xl mb-6 animate-slide-up
            ${status === 'success'
              ? 'bg-green-500/10 border border-green-500/20 text-green-400'
              : 'bg-red-500/10 border border-red-500/20 text-red-400'
            }
          `}
        >
          {status === 'success' ? (
            <CheckCircle size={20} className="flex-shrink-0" />
          ) : (
            <XCircle size={20} className="flex-shrink-0" />
          )}
          <span className="text-sm font-medium flex-1">{message}</span>
          <button
            onClick={clearStatus}
            className="flex-shrink-0 text-white/50 hover:text-white"
          >
            <XCircle size={16} />
          </button>
        </div>
      )}

      {/* ── Upload Forms ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-6 md:mb-8">
        {/* URL Download */}
        <form
          onSubmit={handleDownload}
          className="bg-[#181818] rounded-2xl p-5 border border-white/5 shadow-lg"
        >
          <div className="flex items-center gap-2.5 mb-4">
            <div className="w-8 h-8 rounded-lg bg-accent-primary/20 flex items-center justify-center">
              <LinkIcon size={16} className="text-accent-primary" />
            </div>
            <h2 className="text-base font-bold text-white">Download from URL</h2>
          </div>
          <input
            type="url"
            placeholder="Paste YouTube link here..."
            className="
              w-full bg-white/5 text-white placeholder:text-[#b3b3b3]
              px-4 py-3 rounded-xl outline-none text-sm
              border border-white/5 focus:border-accent-primary/50 focus:bg-white/10
              transition-all duration-200
            "
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            disabled={isDownloading || isUploadingLocal}
          />
          <button
            type="submit"
            disabled={!url || isDownloading || isUploadingLocal}
            className="
              w-full mt-3 py-3 px-4 rounded-xl font-bold text-sm
              bg-accent-primary text-black
              hover:bg-accent-secondary transition-all
              active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed
              disabled:hover:bg-accent-primary disabled:active:scale-100
              flex items-center justify-center gap-2 shadow-lg shadow-accent-primary/20
            "
          >
            {isDownloading ? (
              <>
                <Loader2 className="animate-spin" size={18} />
                Processing...
              </>
            ) : (
              <>
                <Upload size={18} />
                Add Song
              </>
            )}
          </button>
        </form>

        {/* Local Upload */}
        <div className="bg-[#181818] rounded-2xl p-5 border border-white/5 shadow-lg">
          <div className="flex items-center gap-2.5 mb-4">
            <div className="w-8 h-8 rounded-lg bg-accent-primary/20 flex items-center justify-center">
              <FileAudio size={16} className="text-accent-primary" />
            </div>
            <h2 className="text-base font-bold text-white">Upload Local Files</h2>
          </div>
          <input
            type="file"
            accept="audio/*"
            multiple
            className="hidden"
            ref={fileInputRef}
            onChange={handleLocalUpload}
            disabled={isDownloading || isUploadingLocal}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isDownloading || isUploadingLocal}
            className="
              w-full py-3 px-4 rounded-xl font-bold text-sm
              bg-white text-black
              hover:bg-white/90 transition-all
              active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed
              disabled:hover:bg-white disabled:active:scale-100
              flex items-center justify-center gap-2 shadow-xl
            "
          >
            {isUploadingLocal ? (
              <>
                <Loader2 className="animate-spin" size={18} />
                Uploading...
              </>
            ) : (
              <>
                <FileAudio size={18} />
                Choose Files
              </>
            )}
          </button>
          <p className="text-[10px] font-medium text-[#b3b3b3] text-center mt-3 uppercase tracking-wide">
            Supports multiple files (Max 50MB each)
          </p>
        </div>
      </div>

      {/* ── YouTube Search ── */}
      <section className="bg-[#181818] rounded-2xl border border-white/5 shadow-xl overflow-hidden mb-6 md:mb-8">
        <div className="p-5 border-b border-white/5">
          <div className="flex items-center gap-2.5 mb-4">
            <div className="w-8 h-8 rounded-lg bg-[#FF0000]/20 flex items-center justify-center">
              <Search size={16} className="text-[#FF0000]" />
            </div>
            <h2 className="text-base font-bold text-white">Search YouTube</h2>
          </div>

          <div className="flex gap-2 mb-4">
            <button
              onClick={() => { setSearchMode('videos'); setYoutubeResults([]); }}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${searchMode === 'videos' ? 'bg-[#FF0000] text-white' : 'bg-white/5 text-[#b3b3b3] hover:bg-white/10'}`}
            >
              Single Songs
            </button>
            <button
              onClick={() => { setSearchMode('playlists'); setYoutubeResults([]); }}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${searchMode === 'playlists' ? 'bg-[#FF0000] text-white' : 'bg-white/5 text-[#b3b3b3] hover:bg-white/10'}`}
            >
              Albums / Playlists
            </button>
          </div>

          <form onSubmit={handleYoutubeSearch} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#b3b3b3]" size={16} />
              <input
                type="text"
                placeholder="Search for songs on YouTube..."
                className="
                  w-full bg-[#0a0a0a] text-white placeholder:text-[#b3b3b3]
                  py-2.5 pl-10 pr-4 rounded-xl text-sm outline-none
                  border border-white/5 focus:border-[#FF0000]/50
                  transition-all duration-200
                "
                value={youtubeQuery}
                onChange={(e) => setYoutubeQuery(e.target.value)}
                disabled={isSearchingYoutube}
              />
            </div>
            <button
              type="submit"
              disabled={!youtubeQuery.trim() || isSearchingYoutube}
              className="px-6 rounded-xl font-bold text-sm bg-[#FF0000] text-white hover:bg-[#CC0000] transition-all disabled:opacity-50 flex items-center gap-2"
            >
              {isSearchingYoutube ? <Loader2 className="animate-spin" size={18} /> : 'Search'}
            </button>
          </form>
        </div>

        {/* Results */}
        {youtubeResults.length > 0 && !selectedPlaylist && (
          <div className="p-5 max-h-[650px] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-black text-[#b3b3b3] uppercase tracking-wider">YouTube Results</h3>
              <span className="text-[10px] text-[#b3b3b3] font-bold">{youtubeResults.length} found</span>
            </div>
            
            {searchMode === 'videos' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {youtubeResults.map((result) => (
                  <div
                    key={result.id}
                    onClick={() => handleYoutubeDownload(result)}
                    className={`
                      relative bg-white/5 rounded-xl overflow-hidden border border-white/5 
                      group transition-all text-left w-full
                      ${downloadingSongId === result.id ? 'ring-2 ring-accent-primary bg-accent-primary/5' : 'hover:border-white/10 hover:bg-white/[0.08]'}
                      disabled:opacity-50 disabled:cursor-not-allowed
                    `}
                    style={{ cursor: downloadingSongId !== null ? 'not-allowed' : 'pointer' }}
                    role="button"
                    tabIndex={downloadingSongId !== null ? -1 : 0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        if (downloadingSongId === null) handleYoutubeDownload(result);
                      }
                    }}
                  >
                    <div className="relative aspect-video">
                      <img src={result.thumbnail} alt={result.title} className="w-full h-full object-cover" />
                      <div className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded bg-black/80 text-[10px] font-bold text-white">
                        {result.duration}
                      </div>
                      {downloadingSongId === result.id && (
                        <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-2">
                          <Loader2 className="animate-spin text-accent-primary" size={32} />
                          {downloadProgress > 0 ? (
                            <>
                              <span className="text-sm font-black text-accent-primary">{downloadProgress}%</span>
                              <span className="text-[10px] font-bold text-white uppercase tracking-widest">{downloadStage}</span>
                            </>
                          ) : (
                            <span className="text-[10px] font-black text-white uppercase tracking-widest">Processing</span>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="p-3">
                      <h4 className="text-sm font-bold text-white line-clamp-2 leading-snug mb-2 group-hover:text-accent-primary transition-colors">
                        {result.title}
                      </h4>
                      <p className="text-[11px] text-[#b3b3b3] truncate mb-3">{result.channel}</p>
                      <div className="flex gap-2">
                        {/* Play Button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            // Create a song object and play it directly in the website
                            const songToPlay = {
                              id: result.id,
                              title: result.title,
                              artist: result.channel,
                              url: result.url,
                              thumbnail: result.thumbnail,
                              duration: result.duration
                            };
                            setCurrentSong(songToPlay);
                            setIsPlaying(true);
                          }}
                          disabled={downloadingSongId !== null}
                          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-white/10 text-white text-xs font-bold hover:bg-white/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <Play size={12} />
                          Play
                        </button>
                        {/* Download Button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleYoutubeDownload(result);
                          }}
                          disabled={downloadingSongId !== null || isSongInLibrary(result.title)}
                          className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                            isSongInLibrary(result.title)
                              ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                              : downloadingSongId === result.id
                                ? 'bg-accent-primary/50 text-white'
                                : 'bg-accent-primary text-black hover:bg-accent-secondary'
                          }`}
                        >
                          {downloadingSongId === result.id ? (
                            <>
                              <Loader2 size={12} className="animate-spin" />
                              {downloadProgress}%
                            </>
                          ) : isSongInLibrary(result.title) ? (
                            <>
                              <CheckCircle size={12} />
                              In Playlist
                            </>
                          ) : (
                            <>
                              <Download size={12} />
                              Download
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {youtubeResults.map((result) => (
                  <button
                    key={result.id}
                    onClick={() => fetchPlaylistVideos(result)}
                    className="relative bg-white/5 rounded-xl overflow-hidden border border-white/5 hover:border-white/10 hover:bg-white/[0.08] group transition-all text-left w-full"
                  >
                    <div className="relative aspect-video">
                      <img src={result.thumbnail} alt={result.title} className="w-full h-full object-cover" />
                      <div className="absolute inset-y-0 right-0 w-1/3 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center gap-1">
                        <span className="text-lg font-black text-white">{result.videoCount}</span>
                        <span className="text-[8px] font-black text-white uppercase tracking-widest">Videos</span>
                      </div>
                    </div>
                    <div className="p-3">
                      <h4 className="text-sm font-bold text-white line-clamp-2 leading-snug mb-1 group-hover:text-accent-primary transition-colors">
                        {result.title}
                      </h4>
                      <p className="text-[11px] text-[#b3b3b3] truncate">{result.channel}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Playlist Videos View */}
        {selectedPlaylist && (
          <div className="p-5">
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={() => setSelectedPlaylist(null)}
                className="text-xs font-bold text-accent-primary hover:underline"
              >
                ← Back to search
              </button>
              <h3 className="text-sm font-bold text-white">{selectedPlaylist.title}</h3>
            </div>
            
            {isLoadingPlaylist ? (
              <div className="flex flex-col items-center py-8 gap-3">
                <Loader2 className="animate-spin text-accent-primary" size={24} />
                <p className="text-xs text-[#b3b3b3]">Fetching album tracks...</p>
              </div>
            ) : (
              <div className="space-y-2">
                {playlistVideos.map((video) => (
                  <button
                    key={video.id}
                    onClick={() => handleYoutubeDownload(video)}
                    disabled={downloadingSongId !== null}
                    className={`
                      flex items-center justify-between p-3 rounded-xl bg-white/5 w-full text-left
                      group transition-all
                      ${downloadingSongId === video.id ? 'ring-2 ring-accent-primary bg-accent-primary/5' : 'hover:bg-white/[0.08]'}
                    `}
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0">
                        <img src={video.thumbnail} alt={video.title} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-sm font-bold text-white truncate group-hover:text-accent-primary transition-colors">
                          {video.title}
                        </span>
                        <span className="text-[10px] text-[#b3b3b3]">{video.duration}</span>
                      </div>
                    </div>
                    
                    {downloadingSongId === video.id ? (
                      <div className="flex items-center gap-2">
                        <Loader2 size={14} className="animate-spin text-accent-primary" />
                        <span className="text-[10px] font-bold text-accent-primary uppercase tracking-tight">Adding...</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent-primary text-black text-[10px] font-bold hover:bg-accent-secondary transition-all">
                        <Download size={14} />
                        GET
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </section>

      {/* ── Downloading Section ── */}
      {downloadingSongs.length > 0 && (
        <section className="bg-[#181818] rounded-2xl border border-white/5 shadow-xl overflow-hidden mb-6 md:mb-8">
          <div className="p-5 border-b border-white/5">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 rounded-lg bg-accent-primary/20 flex items-center justify-center">
                <Download size={16} className="text-accent-primary" />
              </div>
              <h2 className="text-base font-bold text-white">Downloading</h2>
              <span className="text-[10px] font-medium text-[#b3b3b3] uppercase tracking-wide">
                {downloadingSongs.length} in progress
              </span>
            </div>
            
            <div className="space-y-3">
              {downloadingSongs.map((song) => (
                <div
                  key={song.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-white/5 w-full"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0">
                      <div className="w-full h-full bg-[#282828] flex items-center justify-center">
                        <Music size={16} className="text-[#b3b3b3]" />
                      </div>
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-sm font-bold text-white truncate">
                        {song.title}
                      </span>
                      <span className="text-[10px] text-[#b3b3b3] uppercase font-bold">
                        {song.stage || 'Downloading'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 text-[10px] font-bold text-white">
                      <Loader2 size={14} className="animate-spin text-accent-primary" />
                      <span>{song.progress || 0}%</span>
                    </div>
                    <button
                      onClick={() => {
                        setDownloadingSongs(prev => prev.filter(s => s.id !== song.id));
                      }}
                      className="px-3 py-1.5 rounded-lg bg-red-500/20 text-red-400 text-[10px] font-bold hover:bg-red-500/30 transition-all"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Library Manager ── */}
      <section className="bg-[#181818] rounded-2xl border border-white/5 shadow-xl overflow-hidden">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 border-b border-white/5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-accent-primary/20 flex items-center justify-center">
              <Music size={16} className="text-accent-primary" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Library Manager</h2>
              <span className="text-[10px] font-medium text-[#b3b3b3] uppercase tracking-wide">
                {songs.length} {songs.length === 1 ? 'song' : 'songs'}
              </span>
            </div>
          </div>

          <div className="relative w-full sm:w-64">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[#b3b3b3]"
              size={16}
            />
            <input
              type="text"
              placeholder="Search library..."
              className="
                w-full bg-[#0a0a0a] text-white placeholder:text-[#b3b3b3]
                py-2.5 pl-10 pr-4 rounded-xl text-sm outline-none
                border border-white/5 focus:border-accent-primary/50
                transition-all duration-200
              "
              value={adminSearchQuery}
              onChange={(e) => setAdminSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-[#b3b3b3] text-[10px] font-black uppercase tracking-wider border-b border-white/5">
                <th className="px-5 py-4 text-left">Song</th>
                <th className="px-4 py-4 text-center hidden sm:table-cell">Format</th>
                <th className="px-5 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {songs.length === 0 ? (
                <tr>
                  <td colSpan="3" className="px-5 py-16 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-14 h-14 rounded-full bg-white/5 flex items-center justify-center">
                        <Music size={28} className="text-white/20" />
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-bold text-white">Your library is empty</p>
                        <p className="text-xs text-[#b3b3b3] mt-1">
                          Use the forms above to add music
                        </p>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : filteredSongs.length > 0 ? (
                filteredSongs.map((song) => (
                  <tr
                    key={song.id}
                    className="group hover:bg-white/[0.03] transition-colors duration-150"
                  >
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="relative flex-shrink-0">
                          <div className="w-12 h-12 rounded-lg overflow-hidden shadow-md">
                            <div className="w-full h-full bg-[#282828] flex items-center justify-center">
                              <Music size={18} className="text-[#b3b3b3]" />
                            </div>
                          </div>
                          {isDeleting === song.id && (
                            <div className="absolute inset-0 bg-black/60 rounded-lg flex items-center justify-center">
                              <Loader2 size={16} className="animate-spin text-white" />
                            </div>
                          )}
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="font-bold text-sm text-white truncate">
                            {song.title}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell text-center">
                      <span className="inline-flex items-center px-2 py-1 rounded-md bg-white/5 text-[#b3b3b3] text-[10px] font-bold uppercase tracking-wider">
                        {song.format || 'MP3'}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <button
                        onClick={() => handleDeleteSong(song)}
                        disabled={isDeleting === song.id}
                        className="
                          w-9 h-9 rounded-lg flex items-center justify-center
                          text-[#b3b3b3] hover:text-red-400 hover:bg-red-500/10
                          transition-all duration-150
                          disabled:opacity-50 disabled:cursor-not-allowed
                        "
                        title="Delete song"
                        aria-label={`Delete ${song.title}`}
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="3" className="px-5 py-16 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-14 h-14 rounded-full bg-white/5 flex items-center justify-center">
                        <Search size={28} className="text-white/20" />
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-bold text-white">No songs found</p>
                        <p className="text-xs text-[#b3b3b3] mt-1">
                          Try a different search query
                        </p>
                      </div>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};
