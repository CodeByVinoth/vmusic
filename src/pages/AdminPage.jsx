import React, { useState, useRef, useMemo } from 'react';
import axios from 'axios';
import { Upload, Link as LinkIcon, CheckCircle, XCircle, Loader2, LogOut, Search, Trash2, Music } from 'lucide-react';
import { useMusic } from '../MusicContext';
import { useAuth } from '../AuthContext';

const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api') + '/admin';
const API_KEY = import.meta.env.VITE_API_KEY || 'song_app_secret_123';

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
      const response = await axios.post(`${API_URL}/download`, { url }, {
        headers: {
          'x-api-key': API_KEY,
          'Authorization': `Bearer ${token}`
        }
      });
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
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('audio/')) {
      setStatus('error');
      setMessage('Please select a valid audio file.');
      return;
    }

    setIsUploadingLocal(true);
    setStatus(null);
    setMessage('');

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await axios.post(`${API_URL}/upload-local`, formData, {
        headers: {
          'x-api-key': API_KEY,
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      setStatus('success');
      setMessage(response.data.message);
      refreshSongs();
    } catch (error) {
      console.error('Local Upload Error:', error);
      setStatus('error');
      setMessage(error.response?.data?.details || 'Failed to upload local file');
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
      await axios.delete(`${API_URL}/songs`, {
        params: { path: song.path, sha: song.id }, // Use song.id as sha
        headers: {
          'x-api-key': API_KEY,
          'Authorization': `Bearer ${token}`
        }
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
        <div className={`p-4 rounded-lg mb-6 flex items-center gap-3 text-sm ${
          status === 'success' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'
        }`}>
          {status === 'success' ? <CheckCircle size={20} /> : <XCircle size={20} />}
          {message}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8 mb-8">
        <form onSubmit={handleDownload} className="glass-effect p-4 md:p-6 rounded-xl flex flex-col gap-4">
          <h2 className="text-base md:text-lg font-bold flex items-center gap-2">
            <LinkIcon size={18} md:size={20} />
            Download from URL
          </h2>
          <input
            type="url"
            placeholder="YouTube, SoundCloud, etc."
            className="w-full bg-white/5 text-white py-2 px-4 rounded-lg outline-none focus:ring-1 focus:ring-accent-primary transition-all text-sm"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            disabled={isDownloading || isUploadingLocal}
          />
          <button
            type="submit"
            disabled={!url || isDownloading || isUploadingLocal}
            className="py-2.5 px-4 rounded-lg font-bold bg-accent-primary text-black transition-all hover:bg-accent-secondary disabled:bg-gray-500 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm"
          >
            {isDownloading ? (
              <>
                <Loader2 className="animate-spin" size={16} md:size={18} />
                Processing...
              </>
            ) : (
              'Download'
            )}
          </button>
        </form>

        <div className="glass-effect p-4 md:p-6 rounded-xl flex flex-col gap-4">
          <h2 className="text-base md:text-lg font-bold flex items-center gap-2">
            <Upload size={18} md:size={20} />
            Upload Local File
          </h2>
          <input
            type="file"
            accept="audio/*"
            className="hidden"
            ref={fileInputRef}
            onChange={handleLocalUpload}
            disabled={isDownloading || isUploadingLocal}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isDownloading || isUploadingLocal}
            className="py-2.5 px-4 rounded-lg font-bold bg-white text-black transition-all hover:bg-gray-300 disabled:bg-gray-500 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm"
          >
            {isUploadingLocal ? (
              <>
                <Loader2 className="animate-spin" size={16} md:size={18} />
                Uploading...
              </>
            ) : (
              'Choose File'
            )}
          </button>
          <p className="text-[10px] md:text-xs text-text-secondary text-center">Max file size: 50MB</p>
        </div>
      </div>

      <section className="glass-effect rounded-xl overflow-hidden">
        <div className="p-4 md:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <h2 className="text-base md:text-lg font-bold flex items-center gap-2">
            <Music size={18} md:size={20} />
            Manage Songs
          </h2>
          <div className="relative w-full sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" size={16} md:size={18} />
            <input
              type="text"
              placeholder="Search library..."
              className="w-full bg-white/5 text-white py-2 pl-9 pr-4 rounded-lg text-sm outline-none focus:ring-1 focus:ring-accent-primary transition-all"
              value={adminSearchQuery}
              onChange={(e) => setAdminSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="w-full overflow-x-auto">
          <table className="w-full text-left table-auto">
            <thead>
              <tr className="text-text-secondary text-xs font-bold uppercase tracking-wider border-b border-white/10">
                <th className="px-6 py-3">Song</th>
                <th className="px-4 py-3 hidden sm:table-cell">Format</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {filteredSongs.length > 0 ? (
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
                  <td colSpan="3" className="px-6 py-12 text-center text-text-secondary text-sm">
                    No songs match your search.
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
    <tr className="group hover:bg-white/5 transition-colors">
      <td className="px-6 py-4">
        <div className="flex items-center gap-4">
          <img src={song.thumbnail} alt="" className="w-10 h-10 rounded object-cover flex-shrink-0" />
          <div className="flex flex-col min-w-0">
            <span className="text-white font-medium text-sm truncate">{song.title}</span>
            <span className="text-text-secondary text-xs truncate">{song.artist || 'Unknown Artist'}</span>
          </div>
        </div>
      </td>
      <td className="px-4 py-4 hidden sm:table-cell">
        <span className="bg-white/10 text-text-secondary px-2 py-1 rounded text-[10px] font-bold uppercase">
          {song.format || 'mp3'}
        </span>
      </td>
      <td className="px-6 py-4 text-right">
        <button 
          onClick={() => onDelete(song)}
          disabled={isDeleting}
          className="p-2 text-text-secondary hover:text-red-500 hover:bg-red-500/10 rounded-full transition-colors disabled:opacity-50"
          title="Delete Song"
        >
          {isDeleting ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
        </button>
      </td>
    </tr>
  );
};
