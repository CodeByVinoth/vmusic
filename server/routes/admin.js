import express from 'express';
import axios from 'axios';
import ytdl from '@distube/ytdl-core';
import path from 'path';
import fs from 'fs';
import ffmpegPath from 'ffmpeg-static';
import multer from 'multer';
import jwt from 'jsonwebtoken';
import { fileURLToPath } from 'url';
import { clearCache } from './songs.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

const GITHUB_OWNER = process.env.GITHUB_OWNER;
const GITHUB_REPO = process.env.GITHUB_REPO;
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_BRANCH = process.env.GITHUB_BRANCH || 'main';
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


// Configure Multer for local file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const tempDir = '/tmp'; // Use Vercel's writable directory
    if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });
    cb(null, tempDir);
  },
  filename: (req, file, cb) => {
    cb(null, `local_${Date.now()}_${file.originalname.replace(/\s+/g, '_')}`);
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit
});

// Admin: Upload local file to GitHub
router.post('/upload-local', protectAdmin, upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

  if (!GITHUB_OWNER || !GITHUB_REPO || !GITHUB_TOKEN) {
    return res.status(500).json({ error: 'GitHub configuration missing on server' });
  }

  const filePath = req.file.path;
  const originalName = req.file.originalname;

  try {
    console.log(`Uploading local file to GitHub: ${originalName}`);

    const fileBuffer = await fs.promises.readFile(filePath);
    const contentBase64 = fileBuffer.toString('base64');
    const timestamp = Date.now();
    const githubPath = `songs/local_${timestamp}_${originalName.replace(/\s+/g, '_')}`;

    const uploadResponse = await axios.put(
      `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${githubPath}`,
      {
        message: `Upload local song: ${originalName}`,
        content: contentBase64,
        branch: GITHUB_BRANCH
      },
      {
        headers: {
          'Authorization': `token ${GITHUB_TOKEN}`,
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'VMUSIC-App'
        },
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
        timeout: 180000 
      }
    );

    // Cleanup temp file
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

    // Clear song list cache
    clearCache();

    res.json({
      success: true,
      message: 'Local song uploaded to GitHub successfully',
      song: {
        id: uploadResponse.data.content.sha,
        title: originalName.replace(/\.[^/.]+$/, "").replace(/_/g, ' '),
        url: `${API_BASE_URL}/api/stream?path=${encodeURIComponent(githubPath)}&key=${process.env.API_KEY}`
      }
    });
  } catch (error) {
    console.error('Local Upload Error:', error.message);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    res.status(500).json({ 
      error: 'Failed to upload local file', 
      details: error.response?.data?.message || error.message 
    });
  }
});

// Admin: Download and Upload from YouTube to GitHub
router.post('/download', protectAdmin, async (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ error: 'URL is required' });

  if (!GITHUB_OWNER || !GITHUB_REPO || !GITHUB_TOKEN) {
    return res.status(500).json({ error: 'GitHub configuration missing on server' });
  }

  const timestamp = Date.now();
  const tempDir = '/tmp';
  
  try {
    if (url.includes('spotify.com')) {
      return res.status(400).json({ 
        error: 'Spotify links are not supported', 
        details: 'Spotify uses DRM protection. Please use a YouTube link instead.' 
      });
    }

    console.log(`Starting optimized download for: ${url}`);
    
    // Get video info
    const info = await ytdl.getInfo(url);
    const videoTitle = info.videoDetails.title.replace(/[^\w\s]/gi, '').substring(0, 50);
    const fileName = `song_${videoTitle.replace(/\s+/g, '_')}_${timestamp}.mp3`;
    const filePath = path.join(tempDir, fileName);

    // Download audio only
    await new Promise((resolve, reject) => {
      const stream = ytdl(url, { 
        quality: 'highestaudio',
        filter: 'audioonly'
      });
      
      const fileStream = fs.createWriteStream(filePath);
      stream.pipe(fileStream);
      
      fileStream.on('finish', resolve);
      fileStream.on('error', reject);
      stream.on('error', reject);
    });

    if (!fs.existsSync(filePath)) {
      throw new Error('Downloaded file not found');
    }

    console.log(`Uploading to GitHub: ${videoTitle}`);

    // 3. UPLOAD: Use fs.promises.readFile and longer timeout
    const fileBuffer = await fs.promises.readFile(filePath);
    const contentBase64 = fileBuffer.toString('base64');
    const githubPath = `songs/${fileName}`;

    const uploadResponse = await axios.put(
      `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${githubPath}`,
      {
        message: `Upload song: ${videoTitle}`,
        content: contentBase64,
        branch: GITHUB_BRANCH
      },
      {
        headers: {
          'Authorization': `token ${GITHUB_TOKEN}`,
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'VMUSIC-App'
        },
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
        timeout: 180000 // 3 minutes timeout for GitHub upload
      }
    );

    // Cleanup temp file
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

    // Clear song list cache so new song appears immediately
    clearCache();

    res.json({
      success: true,
      message: 'Song downloaded and uploaded to GitHub successfully',
      song: {
        id: uploadResponse.data.content.sha,
        title: videoTitle.replace(/_/g, ' '),
        url: `${API_BASE_URL}/api/stream?path=${encodeURIComponent(githubPath)}&key=${process.env.API_KEY}`
      }
    });

  } catch (error) {
    console.error('YouTube Process Error:', error.message);
    res.status(500).json({ 
      error: 'Failed to process YouTube download/upload', 
      details: error.message 
    });
  }
});

// Admin: Delete song from GitHub
router.delete('/songs', protectAdmin, async (req, res) => {
  const { path: filePath, sha } = req.query;
  
  if (!filePath || !sha) {
    return res.status(400).json({ error: 'Path and SHA are required' });
  }

  try {
    await axios.delete(
      `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${filePath}`,
      {
        data: {
          message: `Delete song: ${filePath}`,
          sha: sha,
          branch: GITHUB_BRANCH
        },
        headers: {
          'Authorization': `token ${GITHUB_TOKEN}`,
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

export default router;
