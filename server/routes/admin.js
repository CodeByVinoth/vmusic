import express from 'express';
import axios from 'axios';
import youtubeDl from 'yt-dlp-exec';
import path from 'path';
import fs from 'fs';
import os from 'os';
import ffmpegPath from 'ffmpeg-static';
import multer from 'multer';
import jwt from 'jsonwebtoken';
import { fileURLToPath } from 'url';
import { clearCache } from './songs.js';

// Performance: Cache for YouTube search results (5 minutes TTL)
const searchCache = new Map();
const SEARCH_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Performance: Abort controllers for ongoing searches (to cancel duplicates)
const activeSearches = new Map();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

const GITHUB_OWNER = (process.env.GITHUB_OWNER || '').trim();
const GITHUB_REPO = (process.env.GITHUB_REPO || '').trim();
const GITHUB_TOKEN = (process.env.GITHUB_TOKEN || '').trim();
const GITHUB_BRANCH = (process.env.GITHUB_BRANCH || 'main').trim();
const API_BASE_URL = process.env.API_BASE_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:5000');

// --- AUTHENTICATION ---

// Login route
router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const adminUsername = process.env.ADMIN_USERNAME || 'admin';
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminPassword) {
    return res.status(500).json({ error: 'Admin password not configured' });
  }

  if (username === adminUsername && password === adminPassword) {
    const secret = process.env.JWT_SECRET || 'fallback_secret_for_dev_only';
    if (secret === 'fallback_secret_for_dev_only' && process.env.NODE_ENV === 'production') {
      return res.status(500).json({ error: 'Server Error', message: 'JWT_SECRET is not configured' });
    }
    const token = jwt.sign({ username }, secret, { expiresIn: '8h' });
    res.json({ token });
  } else {
    res.status(401).json({ error: 'Invalid credentials' });
  }
});

// Middleware to protect admin routes
const protectAdmin = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    const secret = process.env.JWT_SECRET || 'fallback_secret_for_dev_only';
    
    jwt.verify(token, secret, (err, user) => {
      if (err) {
        return res.status(403).json({ error: 'Invalid or expired token' });
      }
      req.user = user;
      next();
    });
  } else {
    res.status(401).json({ error: 'Not authorized, no token' });
  }
};


// Configure Multer for local file uploads - Use memoryStorage for Vercel compatibility
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit
});

// Admin: Upload local file to GitHub
router.post('/create-upload-url', async (req, res) => {
  const { filename, filetype } = req.body;
  if (!filename || !filetype) {
    return res.status(400).json({ error: 'Filename and filetype are required' });
  }

  if (!GITHUB_OWNER || !GITHUB_REPO || !GITHUB_TOKEN) {
    return res.status(500).json({ error: 'GitHub configuration missing on server' });
  }

  const timestamp = Date.now();
  const githubPath = `songs/local_${timestamp}_${filename.replace(/\s+/g, '_')}`;

  try {
    // Return GitHub config so the frontend can upload directly to GitHub, bypassing Vercel's body size limit.
    res.json({
      success: true,
      uploadUrl: `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${githubPath}`,
      githubPath: githubPath,
      githubToken: GITHUB_TOKEN,
      githubBranch: GITHUB_BRANCH
    });

  } catch (error) {
    console.error('Create Upload URL Error:', error.message);
    res.status(500).json({ 
      error: 'Failed to create upload URL',
      details: error.message 
    });
  }
});

// Admin: Download and Upload from YouTube to GitHub (Optimized with parallel processing)
router.post('/download', async (req, res) => {
  const { url, title: providedTitle } = req.body;
  if (!url) return res.status(400).json({ error: 'URL is required' });

  if (!GITHUB_OWNER || !GITHUB_REPO || !GITHUB_TOKEN) {
    return res.status(500).json({ error: 'GitHub configuration missing on server' });
  }

  const timestamp = Date.now();
  const tempDir = os.tmpdir();
  let filePath = null;
  
  try {
    console.log(`[OPTIMIZED] Starting parallel download for: ${url}`);
    const startTime = Date.now();
    
    // 1. Get metadata with yt-dlp (with retry logic)
    const getMetadata = async (url) => {
      let attempts = 0;
      const maxAttempts = 3;
      while (attempts < maxAttempts) {
        try {
          return await youtubeDl(url, {
            dumpSingleJson: true,
            noWarnings: true,
            noCheckCertificate: true,
            preferFreeFormats: true,
            socketTimeout: 15000, 
            skipDownload: true, 
          });
        } catch (error) {
          attempts++;
          console.warn(`Metadata fetch attempt ${attempts} failed:`, error.message);
          if (attempts === maxAttempts) throw error;
          await new Promise(resolve => setTimeout(resolve, 1000 * attempts)); 
        }
      }
    };

    // Performance: Parallel metadata fetch and filename generation
    const [metadataPromise, filenamePromise] = await Promise.all([
      getMetadata(url),
      
      // 2. Generate filename (runs in parallel with metadata fetch)
      (async () => {
        const videoTitle = providedTitle || 'Unknown Title';
        const sanitizedTitle = videoTitle.replace(/[^\w\s]/gi, '').substring(0, 50).trim();
        const fileName = `song_${sanitizedTitle.replace(/\s+/g, '_')}_${timestamp}.mp3`;
        return path.join(tempDir, fileName);
      })()
    ]);

    const info = metadataPromise;
    filePath = await filenamePromise;

    const videoTitle = providedTitle || info.title || 'Unknown Title';
    const sanitizedTitle = videoTitle.replace(/[^\w\s]/gi, '').substring(0, 50).trim();
    const githubPath = `songs/song_${sanitizedTitle.replace(/\s+/g, '_')}_${timestamp}.mp3`;

    console.log(`[DOWNLOAD] Starting audio extraction for: ${sanitizedTitle}`);
    
    // 3. Download audio with yt-dlp (optimized for speed with retry logic)
    let downloadAttempts = 0;
    const maxDownloadAttempts = 3;
    
    while (downloadAttempts < maxDownloadAttempts) {
      try {
        await youtubeDl(url, {
          extractAudio: true,
          audioFormat: 'mp3',
          audioQuality: 5, 
          output: filePath,
          noCheckCertificate: true,
          noWarnings: true,
          ffmpegLocation: ffmpegPath,
          socketTimeout: 120000, 
          retries: 3, 
          fragmentRetries: 3,
          format: 'bestaudio/best', 
        });
        break;
      } catch (downloadError) {
        downloadAttempts++;
        console.warn(`Download attempt ${downloadAttempts} failed:`, downloadError.message);
        if (downloadAttempts === maxDownloadAttempts) throw downloadError;
        await new Promise(resolve => setTimeout(resolve, 2000 * downloadAttempts)); // Exponential backoff
      }
    }

    if (!fs.existsSync(filePath)) {
      throw new Error('Downloaded file not found after conversion');
    }

    // Get file stats for progress tracking
    const stats = fs.statSync(filePath);
    console.log(`[UPLOAD] Starting GitHub upload (${(stats.size / (1024 * 1024)).toFixed(2)}MB) for: ${sanitizedTitle}`);

    // 4. UPLOAD to GitHub (with progress tracking)
    const fileBuffer = await fs.promises.readFile(filePath);
    const contentBase64 = fileBuffer.toString('base64');

    const uploadStartTime = Date.now();
    const uploadResponse = await axios.put(
      `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${githubPath}`,
      {
        message: `Upload song: ${sanitizedTitle}`,
        content: contentBase64,
        branch: GITHUB_BRANCH
      },
      {
        headers: {
          'Authorization': `Bearer ${GITHUB_TOKEN}`,
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'VMUSIC-App'
        },
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
        timeout: 300000, // 5 minute timeout for large files
        onUploadProgress: (progressEvent) => {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          if (progress % 10 === 0) { // Log every 10%
            console.log(`[UPLOAD PROGRESS] ${progress}% uploaded`);
          }
        }
      }
    );

    const totalDuration = Date.now() - startTime;
    const uploadDuration = Date.now() - uploadStartTime;
    
    console.log(`[COMPLETE] Total time: ${totalDuration}ms, Upload time: ${uploadDuration}ms for: ${sanitizedTitle}`);

    // Cleanup
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    clearCache();

    res.json({
      success: true,
      message: 'Song downloaded and uploaded to GitHub successfully',
      song: {
        id: uploadResponse.data.content.sha,
        title: sanitizedTitle,
        url: `/api/stream?path=${encodeURIComponent(githubPath)}&key=${process.env.VITE_API_KEY}`
      }
    });

  } catch (error) {
    console.error('YouTube Process Error:', error.message);
    
    // Cleanup on error
    if (filePath && fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
        console.log('Cleaned up failed download file');
      } catch (cleanupError) {
        console.warn('Failed to cleanup failed download file:', cleanupError.message);
      }
    }

    res.status(500).json({ 
      error: 'Failed to process YouTube download/upload', 
      details: error.message 
    });
  }
});

// Admin: Delete song from GitHub
router.delete('/songs', async (req, res) => {
  const { path: filePath, sha } = req.query;
  
  if (!filePath || !sha) {
    return res.status(400).json({ error: 'Path and SHA are required' });
  }

  try {
    const encodedPath = filePath.split('/').map(segment => encodeURIComponent(segment)).join('/');
    
    await axios.delete(
      `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${encodedPath}`,
      {
        data: {
          message: `Delete song: ${filePath}`,
          sha: sha,
          branch: GITHUB_BRANCH
        },
        headers: {
          'Authorization': `Bearer ${GITHUB_TOKEN}`,
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'VMUSIC-App'
        }
      }
    );

    clearCache();
    res.json({ success: true, message: 'Song deleted successfully' });

  } catch (error) {
    console.error('Delete Error:', error.message);
    res.status(500).json({ 
      error: 'Failed to delete song', 
      details: error.response?.data?.message || error.message 
    });
  }
});

// Admin: Search YouTube (Optimized with caching, timeout, and deduplication)
router.get('/search-youtube', async (req, res) => {
  const { keyword } = req.query;
  if (!keyword) return res.status(400).json({ error: 'Keyword is required' });

  const cacheKey = `search:${keyword.toLowerCase().trim()}`;
  
  // Check cache first (performance optimization)
  const cached = searchCache.get(cacheKey);
  if (cached && (Date.now() - cached.timestamp < SEARCH_CACHE_TTL)) {
    console.log(`[CACHE HIT] Returning cached search results for: ${keyword}`);
    return res.json(cached.results);
  }

  // Cancel any existing search for the same keyword (deduplication)
  if (activeSearches.has(cacheKey)) {
    console.log(`Cancelling duplicate search for: ${keyword}`);
    activeSearches.get(cacheKey).abort();
    activeSearches.delete(cacheKey);
  }

  // Create new abort controller for this search
  const abortController = new AbortController();
  activeSearches.set(cacheKey, abortController);

  const startTime = Date.now();
  
  try {
    console.log(`[OPTIMIZED] Searching YouTube for: ${keyword}`);
    const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(keyword)}&sp=EgIQAQ%253D%253D`;
    
    // Performance: Added timeout (8 seconds) to prevent hanging requests
    const response = await axios.get(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
      timeout: 8000, // 8 second timeout for faster failure
      signal: abortController.signal
    });

    const html = response.data;
    const jsonStr = html.split('var ytInitialData = ')[1]?.split(';</script>')[0];
    
    if (!jsonStr) throw new Error('Could not extract YouTube data');
    
    const data = JSON.parse(jsonStr);
    const contents = data.contents.twoColumnSearchResultsRenderer.primaryContents.sectionListRenderer.contents[0].itemSectionRenderer.contents;
    
    const searchResults = contents
      .filter(item => item.videoRenderer)
      .slice(0, 12)
      .map(item => {
        const video = item.videoRenderer;
        return {
          id: video.videoId,
          title: video.title.runs[0].text,
          url: `https://www.youtube.com/watch?v=${video.videoId}`,
          thumbnail: `https://i.ytimg.com/vi/${video.videoId}/hqdefault.jpg`,
          duration: video.lengthText?.simpleText || '0:00',
          channel: video.ownerText.runs[0].text
        };
      });

    // Cache the results
    searchCache.set(cacheKey, {
      results: searchResults,
      timestamp: Date.now()
    });

    const duration = Date.now() - startTime;
    console.log(`[SEARCH COMPLETE] Found ${searchResults.length} results in ${duration}ms for: ${keyword}`);

    res.json(searchResults);
  } catch (error) {
    if (error.name === 'CanceledError') {
      console.log(`Search cancelled for: ${keyword}`);
      return res.status(499).json({ error: 'Search cancelled' });
    }

    console.error('YouTube Fast Search Error:', error.message);
    
    // Check cache for stale results as fallback
    const staleCached = searchCache.get(cacheKey);
    if (staleCached) {
      console.log(`Returning stale cached results for: ${keyword}`);
      return res.json(staleCached.results);
    }

    // Fallback to yt-dlp if scraping fails
    try {
      console.log(`Falling back to yt-dlp for: ${keyword}`);
      const results = await youtubeDl(`ytsearch10:${keyword}`, {
        dumpSingleJson: true,
        noWarnings: true,
        flatPlaylist: true,
        quiet: true,
        socketTimeout: 8000, // 8 second timeout
      });
      const searchResults = results.entries.map(entry => ({
        id: entry.id,
        title: entry.title,
        url: `https://www.youtube.com/watch?v=${entry.id}`,
        thumbnail: `https://i.ytimg.com/vi/${entry.id}/hqdefault.jpg`,
        duration: entry.duration_string || entry.duration || '0:00',
        channel: entry.uploader || entry.channel || 'YouTube'
      }));
      
      // Cache yt-dlp results too
      searchCache.set(cacheKey, {
        results: searchResults,
        timestamp: Date.now()
      });
      
      res.json(searchResults);
    } catch (fallbackError) {
      console.error('YouTube fallback search failed:', fallbackError.message);
      res.status(500).json({ error: 'Failed to search YouTube', details: fallbackError.message });
    }
  } finally {
    activeSearches.delete(cacheKey);
  }
});

// Admin: Search YouTube Playlists/Albums (Optimized with timeout)
router.get('/search-youtube-playlists', async (req, res) => {
  const { keyword } = req.query;
  if (!keyword) return res.status(400).json({ error: 'Keyword is required' });

  const cacheKey = `playlist_search:${keyword.toLowerCase().trim()}`;
  
  // Check cache first
  const cached = searchCache.get(cacheKey);
  if (cached && (Date.now() - cached.timestamp < SEARCH_CACHE_TTL)) {
    console.log(`[CACHE HIT] Returning cached playlist search for: ${keyword}`);
    return res.json(cached.results);
  }

  try {
    console.log(`[OPTIMIZED] Searching YouTube Playlists for: ${keyword}`);
    const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(keyword)}&sp=EgIQAw%253D%253D`;
    
    const response = await axios.get(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
      timeout: 8000, // 8 second timeout
    });

    const html = response.data;
    const jsonStr = html.split('var ytInitialData = ')[1]?.split(';</script>')[0];
    
    if (!jsonStr) throw new Error('Could not extract YouTube data');
    
    const data = JSON.parse(jsonStr);
    const contents = data.contents.twoColumnSearchResultsRenderer.primaryContents.sectionListRenderer.contents[0].itemSectionRenderer.contents;
    
    const playlists = contents
      .filter(item => item.playlistRenderer)
      .slice(0, 10)
      .map(item => {
        const playlist = item.playlistRenderer;
        return {
          id: playlist.playlistId,
          title: playlist.title.simpleText,
          url: `https://www.youtube.com/playlist?list=${playlist.playlistId}`,
          thumbnail: playlist.thumbnails[0]?.thumbnails[0]?.url || '',
          videoCount: playlist.videoCount,
          channel: playlist.shortBylineText?.runs[0]?.text || 'YouTube'
        };
      });

    // Cache results
    searchCache.set(cacheKey, {
      results: playlists,
      timestamp: Date.now()
    });

    res.json(playlists);
  } catch (error) {
    console.error('YouTube Playlist Search Error:', error.message);
    res.status(500).json({ error: 'Failed to search YouTube playlists', details: error.message });
  }
});

// Admin: Get playlist videos
router.get('/youtube-playlist-videos', async (req, res) => {
  const { id } = req.query;
  if (!id) return res.status(400).json({ error: 'Playlist ID is required' });

  try {
    const results = await youtubeDl(`https://www.youtube.com/playlist?list=${id}`, {
      dumpSingleJson: true,
      flatPlaylist: true,
      noWarnings: true,
    });

    const videos = results.entries.map(entry => ({
      id: entry.id,
      title: entry.title,
      url: `https://www.youtube.com/watch?v=${entry.id}`,
      thumbnail: `https://i.ytimg.com/vi/${entry.id}/hqdefault.jpg`,
      duration: entry.duration_string || entry.duration || '0:00'
    }));

    res.json(videos);
  } catch (error) {
    console.error('Playlist Videos Error:', error.message);
    res.status(500).json({ error: 'Failed to fetch playlist videos' });
  }
});

export default router;
