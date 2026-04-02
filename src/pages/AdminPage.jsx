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
  const fileInputRef = useRef(null);

  const filteredSongs = useMemo(() => {
    return songs.filter(
      (s) =>
        s.title.toLowerCase().includes(adminSearchQuery.toLowerCase()) ||
        (s.artist && s.artist.toLowerCase().includes(adminSearchQuery.toLowerCase()))
    );
  }, [songs, adminSearchQuery]);

  const handleDownload = async (e) => {
    e.preventDefault();
    if (!url) return;

    setIsDownloading(true);
    setStatus(null);
    setMessage('');

    try {
      const response = await api.post('/admin/download', { url });
      setStatus('success');
      setMessage(response.data.message);
      setUrl('');
      setTimeout(() => {
        refreshSongs(true);
      }, 1000);
    } catch (error) {
      console.error('Download Error:', error);
      setStatus('error');
      setMessage(error.response?.data?.details || 'Failed to process download');
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
                            {song.thumbnail ? (
                              <img
                                src={song.thumbnail}
                                alt=""
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full bg-[#282828] flex items-center justify-center">
                                <Music size={18} className="text-[#b3b3b3]" />
                              </div>
                            )}
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
                          <span className="text-xs text-[#b3b3b3] truncate">
                            {song.artist || 'Unknown Artist'}
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