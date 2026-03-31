const express = require('express');
const router = express.Router();
const axios = require('axios');
const ytDlp = require('yt-dlp-exec');
const path = require('path');
const fs = require('fs');
const ffmpegPath = require('ffmpeg-static');
const multer = require('multer');
const jwt = require('jsonwebtoken');
const { clearCache } = require('./songs');

const GITHUB_OWNER = process.env.GITHUB_OWNER;
const GITHUB_REPO = process.env.GITHUB_REPO;
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_BRANCH = process.env.GITHUB_BRANCH || 'main';

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
    const token = jwt.sign({ username }, process.env.JWT_SECRET, { expiresIn: '8h' });
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
    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
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
    const tempDir = path.join(__dirname, '../temp');
    if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });
    cb(null, tempDir);
  },
  filename: (req, file, cb) => {
    cb(null, `local_${Date.now()}_${file.originalname}`);
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
    const cleanName = originalName.replace(/[^a-zA-Z0-9.]/g, '_');
    const githubPath = `songs/${timestamp}_${cleanName}`;

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
        url: `${process.env.API_BASE_URL || 'http://localhost:5000'}/api/stream?path=${encodeURIComponent(githubPath)}&key=${process.env.API_KEY || 'song_app_secret_123'}`
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

  try {
    const timestamp = Date.now();
    const tempDir = path.join(__dirname, '../temp');
    if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

    if (url.includes('spotify.com')) {
      return res.status(400).json({ 
        error: 'Spotify links are not supported', 
        details: 'Spotify uses DRM protection. Please use a YouTube link instead.' 
      });
    }

    console.log(`Starting optimized download for: ${url}`);
    
    // Use the video title directly in the filename using yt-dlp template
    const outputTemplate = path.join(tempDir, `song_%(title).50s_${timestamp}.%(ext)s`);

    await ytDlp(url, {
      extractAudio: true,
      audioFormat: 'mp3',
      output: outputTemplate,
      ffmpegLocation: ffmpegPath,
      noCheckCertificates: true,
      noWarnings: true,
      preferFreeFormats: true,
      noPlaylist: true,
      format: 'bestaudio/best',
      addHeader: [
        'referer:youtube.com',
        'user-agent:Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      ]
    });

    // Find the downloaded file (it will start with 'song_' and end with our timestamp)
    const files = fs.readdirSync(tempDir);
    const foundFile = files.find(f => f.includes(`_${timestamp}.mp3`));
    
    if (!foundFile) {
      throw new Error('Downloaded file not found - conversion might have failed');
    }

    const filePath = path.join(tempDir, foundFile);
    const cleanTitle = foundFile
      .replace(/^song_/, '')
      .replace(`_${timestamp}.mp3`, '')
      .replace(/_/g, ' ');

    console.log(`Uploading to GitHub: ${cleanTitle}`);

    // 3. UPLOAD: Use fs.promises.readFile and longer timeout
    const fileBuffer = await fs.promises.readFile(filePath);
    const contentBase64 = fileBuffer.toString('base64');
    const githubPath = `songs/${foundFile}`;

    const uploadResponse = await axios.put(
      `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${githubPath}`,
      {
        message: `Upload song: ${cleanTitle}`,
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
        title: cleanTitle,
        url: `${process.env.API_BASE_URL || 'http://localhost:5000'}/api/stream?path=${encodeURIComponent(githubPath)}&key=${process.env.API_KEY || 'song_app_secret_123'}`
      }
    });

  } catch (error) {
    console.error('GitHub Upload Error:', error.message);
    res.status(500).json({ 
      error: 'Failed to process download/upload', 
      details: error.response?.data?.message || error.message 
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

module.exports = router;
