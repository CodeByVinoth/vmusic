import express from 'express';
import axios from 'axios';

const router = express.Router();

const GITHUB_OWNER = (process.env.GITHUB_OWNER || '').trim();
const GITHUB_REPO = (process.env.GITHUB_REPO || '').trim();
const GITHUB_TOKEN = (process.env.GITHUB_TOKEN || '').trim();
const GITHUB_BRANCH = (process.env.GITHUB_BRANCH || 'main').trim();
const API_BASE_URL = process.env.API_BASE_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:5000');
const MUSIC_PATH = 'songs';

// Simple in-memory cache for GitHub song metadata
let songsCache = {
  data: null,
  timestamp: 0,
  ttl: 60 * 5 * 1000 // 5 minutes cache
};

// Mock data to ensure the website ALWAYS works even if GitHub fails
const fallbackSongs = [
  {
    id: 'fallback-1',
    title: 'Example Song',
    artist: 'Generic Artist',
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
    thumbnail: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=500&h=500&fit=crop',
    duration: 372
  }
];

// Proxy route to stream audio from private GitHub repo with Range support for seeking
router.get('/stream', async (req, res) => {
  const { path: filePath } = req.query;
  const range = req.headers.range;

  if (!filePath) return res.status(400).send('Path is required');

  try {
    // 1. Get file metadata from GitHub to know the total size
    const fileMetadata = await axios.get(
      `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${filePath}`,
      {
        headers: {
          'Authorization': `Bearer ${GITHUB_TOKEN}`,
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'VMUSIC-App'
        }
      }
    );

    const fileSize = fileMetadata.data.size;
    const extension = filePath.split('.').pop().toLowerCase();
    const contentType = extension === 'wav' ? 'audio/wav' : 'audio/mpeg';

    // 2. Handle Range requests for seeking
    if (range) {
      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunksize = (end - start) + 1;

      console.log(`--- Streaming Range: ${start}-${end}/${fileSize} ---`);

      const response = await axios({
        method: 'get',
        url: `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${filePath}`,
        headers: {
          'Authorization': `Bearer ${GITHUB_TOKEN}`,
          'Accept': 'application/vnd.github.v3.raw',
          'User-Agent': 'VMUSIC-App',
          'Range': `bytes=${start}-${end}`
        },
        responseType: 'stream'
      });

      res.writeHead(206, {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunksize,
        'Content-Type': contentType,
      });

      response.data.pipe(res);
    } else {
      // Standard full-file request
      console.log(`--- Streaming Full File: ${fileSize} bytes ---`);

      const response = await axios({
        method: 'get',
        url: `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${filePath}`,
        headers: {
          'Authorization': `Bearer ${GITHUB_TOKEN}`,
          'Accept': 'application/vnd.github.v3.raw',
          'User-Agent': 'VMUSIC-App'
        },
        responseType: 'stream'
      });

      res.writeHead(200, {
        'Content-Length': fileSize,
        'Content-Type': contentType,
        'Accept-Ranges': 'bytes'
      });

      response.data.pipe(res);
    }
  } catch (error) {
    console.error('Streaming Error:', error.message);
    if (error.response?.status === 404) {
      res.status(404).send('File not found');
    } else {
      res.status(500).send('Error streaming audio');
    }
  }
});

router.get('/songs', async (req, res) => {
  try {
    const now = Date.now();
    if (songsCache.data && (now - songsCache.timestamp < songsCache.ttl)) {
      console.log('--- Returning songs from cache ---');
      return res.json(songsCache.data);
    }

    console.log('--- Fetching songs from GitHub ---');

    if (!GITHUB_OWNER || !GITHUB_REPO || !GITHUB_TOKEN) {
      console.error('GitHub configuration missing in environment variables:', {
        GITHUB_OWNER: !!GITHUB_OWNER,
        GITHUB_REPO: !!GITHUB_REPO,
        GITHUB_TOKEN: !!GITHUB_TOKEN
      });
      return res.status(500).json({ 
        error: 'Backend Configuration Error', 
        message: 'Missing GitHub environment variables on the server.' 
      });
    }

    console.log(`--- Fetching from: ${MUSIC_PATH} in ${GITHUB_OWNER}/${GITHUB_REPO} ---`);

    const response = await axios.get(
      `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${MUSIC_PATH}`,
      {
        headers: {
          'Authorization': `Bearer ${GITHUB_TOKEN}`,
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'VMUSIC-App'
        },
        timeout: 10000
      }
    );

    if (!response.data || !Array.isArray(response.data)) {
      console.log('No resources found on GitHub, returning fallback data');
      return res.json(fallbackSongs);
    }

    const songs = response.data
      .filter(file => file.type === 'file' && (file.name.endsWith('.mp3') || file.name.endsWith('.wav')))
      .map((file, index) => {
        const placeholders = [
          'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=500&h=500&fit=crop',
          'https://images.unsplash.com/photo-1493225255756-d9584f8606e9?w=500&h=500&fit=crop',
          'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500&h=500&fit=crop',
          'https://images.unsplash.com/photo-1514525253361-bee8718a300a?w=500&h=500&fit=crop',
          'https://images.unsplash.com/photo-1459749411177-042180ce673f?w=500&h=500&fit=crop'
        ];

        // 1. Remove extension
        let title = file.name.replace(/\.[^/.]+$/, "");
        
        // 2. Remove common prefixes (song_, local_, or numeric timestamp prefix)
        title = title.replace(/^(song_|local_|\d{10,}_)/, "");
        
        // 3. Remove numeric timestamp suffix (e.g. _1774937539851)
        title = title.replace(/_\d{10,}$/, "");
        
        // 4. Final cleanup: underscores to spaces
        title = title.replace(/_/g, ' ');

        // ✅ stream URL (no double songs)
        const streamUrl = `${API_BASE_URL}/api/stream?path=${encodeURIComponent(file.path)}&key=${process.env.API_KEY}`;

        return {
          id: file.sha,
          path: file.path, // <-- ADD THIS LINE
          title: title,
          artist: 'GitHub Artist',
          url: streamUrl,
          thumbnail: placeholders[index % placeholders.length],
          duration: 0,
          resource_type: 'audio',
          format: file.name.split('.').pop()
        };
      });

    songsCache = {
      data: songs,
      timestamp: now,
      ttl: 60 * 5 * 1000
    };

    console.log(`Successfully fetched ${songs.length} songs from GitHub`);
    res.json(songs);
  } catch (error) {
    console.error('GitHub API Error Detail:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
      config: {
        url: error.config?.url,
        headers: { ...error.config?.headers, Authorization: 'REDACTED' }
      }
    });
    res.status(500).json({ 
      error: 'GitHub API Error', 
      message: error.message,
      details: error.response?.data
    });
  }
});

export const clearCache = () => {
  console.log('--- Clearing songs cache ---');
  songsCache.data = null;
  songsCache.timestamp = 0;
};

export default router;