import axios from 'axios';
import React, { useState, useRef, useMemo } from 'react';
import api from '../axiosInstance';
import { Upload, Link as LinkIcon, CheckCircle, XCircle, Loader2, LogOut, Search, Trash2, Music } from 'lucide-react';
import { useMusic } from '../MusicContext';
import { useAuth } from '../AuthContext';

export const AdminPage = () => {
  const { songs, refreshSongs } = useMusic();
  const { token, logout } = useAuth();
  const [url, setUrl] = useState('');
  const [isDownloading, setIsDownloading] = useState(false);
  const [isUploadingLocal, setIsUploadingLocal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(null); // ID of song being deleted
  const [status, setStatus] = useState(null); // 'success' | 'error' | null
  const [message, setMessage] = useState('');
  const [adminSearchQuery, setAdminSearchQuery] = useState('');
  const fileInputRef = useRef(null);

  const filteredSongs = useMemo(() => {
    return songs.filter(s => 
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
      refreshSongs();
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

    const invalidFiles = files.filter(f => !f.type.startsWith('audio/'));
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
        // 1. Get the signed URL and config from our server
        const configResponse = await api.post('/admin/create-upload-url', {
          filename: file.name,
          filetype: file.type
        });

        const { uploadUrl, githubToken, githubBranch } = configResponse.data;

        // 2. Upload the file directly to GitHub using the provided token
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.readAsDataURL(file);
          reader.onload = async (event) => {
            try {
              const contentBase64 = event.target.result.split(',')[1];
              await axios.put(uploadUrl, {
                message: `Upload local song: ${file.name}`,
                content: contentBase64,
                branch: githubBranch
              }, {
                headers: {
                  'Authorization': `Bearer ${githubToken}`
                }
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
      // Run uploads sequentially to avoid hitting GitHub rate limits or browser limits
      for (const file of files) {
        try {
          await uploadFile(file);
        } catch (e) {
          // Individual failure is caught inside uploadFile, continue loop
        }
      }

      if (successCount > 0) {
        setStatus('success');
        setMessage(`Successfully uploaded ${successCount} songs.${failCount > 0 ? ` (${failCount} failed)` : ''}`);
        refreshSongs();
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
        params: { path: song.path, sha: song.id }
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

  return (
    <div className="p-4 md:p-8 text-white">
      <header className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-black tracking-tighter">Admin Panel</h1>
        <button onClick={logout} className="flex items-center gap-2 text-sm font-bold text-text-secondary hover:text-white transition-colors">
          <LogOut size={18} />
          Logout
        </button>
      </header>

      {status && (
        <div className={`p-4 rounded-lg mb-6 flex items-center gap-3 text-sm animate-fade-in ${
          status === 'success' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'
        }`}>
          {status === 'success' ? <CheckCircle size={20} /> : <XCircle size={20} />}
          {message}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8 mb-8">
        <form onSubmit={handleDownload} className="glass-effect p-4 md:p-6 rounded-2xl flex flex-col gap-4 border border-white/5">
          <h2 className="text-base md:text-lg font-black flex items-center gap-2 tracking-tight">
            <LinkIcon size={18} className="text-accent-primary" />
            Download from URL
          </h2>
          <input
            type="url"
            placeholder="YouTube link..."
            className="w-full bg-white/5 text-white py-3 px-4 rounded-xl outline-none focus:ring-1 focus:ring-accent-primary transition-all text-sm border border-white/5"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            disabled={isDownloading || isUploadingLocal}
          />
          <button
            type="submit"
            disabled={!url || isDownloading || isUploadingLocal}
            className="py-3 px-4 rounded-xl font-black bg-accent-primary text-black transition-all hover:scale-[1.02] active:scale-[0.98] disabled:bg-gray-500 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm shadow-lg shadow-accent-primary/20"
          >
            {isDownloading ? (
              <>
                <Loader2 className="animate-spin" size={18} />
                Processing...
              </>
            ) : (
              'Add Song'
            )}
          </button>
        </form>

        <div className="glass-effect p-4 md:p-6 rounded-2xl flex flex-col gap-4 border border-white/5">
          <h2 className="text-base md:text-lg font-black flex items-center gap-2 tracking-tight">
            <Upload size={18} className="text-accent-primary" />
            Upload Local Files
          </h2>
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
            className="py-3 px-4 rounded-xl font-black bg-white text-black transition-all hover:scale-[1.02] active:scale-[0.98] disabled:bg-gray-500 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm shadow-xl"
          >
            {isUploadingLocal ? (
              <>
                <Loader2 className="animate-spin" size={18} />
                Uploading...
              </>
            ) : (
              'Choose Songs'
            )}
          </button>
          <p className="text-[10px] font-bold text-text-secondary text-center uppercase tracking-widest">Supports multiple files (Max 50MB each)</p>
        </div>
      </div>

      <section className="glass-effect rounded-2xl overflow-hidden border border-white/5 shadow-2xl">
        <div className="p-4 md:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white/5">
          <h2 className="text-base md:text-lg font-black flex items-center gap-2 tracking-tight">
            <Music size={18} className="text-accent-primary" />
            Library Manager
          </h2>
          <div className="relative w-full sm:max-w-xs group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary group-focus-within:text-accent-primary transition-colors" size={16} />
            <input
              type="text"
              placeholder="Search library..."
              className="w-full bg-[#0a0a0a] text-white py-2.5 pl-10 pr-4 rounded-xl text-sm outline-none border border-white/5 focus:border-accent-primary/50 transition-all"
              value={adminSearchQuery}
              onChange={(e) => setAdminSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="w-full overflow-x-auto custom-scrollbar">
          <table className="w-full text-left table-auto">
            <thead>
              <tr className="text-text-secondary text-[10px] font-black uppercase tracking-[0.2em] border-b border-white/5 bg-white/[0.02]">
                <th className="px-6 py-4">Song Details</th>
                <th className="px-4 py-4 hidden sm:table-cell text-center">Format</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {songs.length === 0 ? (
                <tr>
                  <td colSpan="3" className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center gap-3 opacity-50">
                      <Music size={48} />
                      <p className="text-sm font-bold uppercase tracking-widest mt-2">Your library is empty</p>
                      <p className="text-xs text-text-secondary">Use the forms above to add new music.</p>
                    </div>
                  </td>
                </tr>
              ) : filteredSongs.length > 0 ? (
                filteredSongs.map((song) => (
                  <SongAdminRow 
                    key={song.id} 
                    song={song} 
                    onDelete={handleDeleteSong}
                    isDeleting={isDeleting === song.id}
                  />
                ))
              ) : (
                <tr>
                  <td colSpan="3" className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center gap-2 opacity-20">
                      <Search size={48} />
                      <p className="text-sm font-bold uppercase tracking-widest">No songs found</p>
                      <p className="text-xs text-text-secondary mt-1">Try a different search query.</p>
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

const SongAdminRow = ({ song, onDelete, isDeleting }) => {
  return (
    <tr className="group hover:bg-white/[0.03] transition-all duration-300">
      <td className="px-6 py-4">
        <div className="flex items-center gap-4">
          <div className="relative flex-shrink-0">
            <img src={song.thumbnail} alt="" className="w-12 h-12 rounded-lg object-cover shadow-lg border border-white/5" />
            {isDeleting && (
              <div className="absolute inset-0 bg-black/60 rounded-lg flex items-center justify-center">
                <Loader2 size={16} className="animate-spin text-white" />
              </div>
            )}
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-white font-black text-sm truncate tracking-tight">{song.title}</span>
            <span className="text-text-secondary text-[11px] font-bold truncate opacity-70 uppercase tracking-tighter">{song.artist || 'Unknown Artist'}</span>
          </div>
        </div>
      </td>
      <td className="px-4 py-4 hidden sm:table-cell text-center">
        <span className="bg-white/5 text-text-secondary px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-wider border border-white/5">
          {song.format || 'mp3'}
        </span>
      </td>
      <td className="px-6 py-4 text-right">
        <button 
          onClick={() => onDelete(song)}
          disabled={isDeleting}
          className="p-2.5 text-text-secondary hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all duration-300 disabled:opacity-50 active:scale-90"
          title="Delete Song"
        >
          <Trash2 size={18} />
        </button>
      </td>
    </tr>
  );
};
