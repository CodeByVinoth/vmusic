import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import jwt from 'jsonwebtoken';
import { fileURLToPath } from 'url';

import songsRoute from './routes/songs.js';
import adminRoute from './routes/admin.js';

const app = express();
const PORT = process.env.PORT || 5000;

console.log('--- VMUSIC SERVER RUNNING (ROBUST FIX) ---');

// ✅ Middleware
app.use(cors());
app.use(express.json());

// ✅ AUTH MIDDLEWARE (FIXED & ROBUST)
const authMiddleware = (req, res, next) => {
  // Normalize path by removing trailing slash
  const path = req.path.replace(/\/$/, '') || '/';
  const apiKey = req.headers['x-api-key'] || req.query.key;
  const authHeader = req.headers.authorization;
  const expectedKey = process.env.VITE_API_KEY;

  console.log(`[Auth] Request: ${req.method} ${path}`);

  // 1. PUBLIC ROUTES (NO AUTH REQUIRED)
  // Check if it's the songs list or login route
  if (path === '/songs' || path === '/admin/login' || req.path.endsWith('manifest.webmanifest')) {
    console.log(`[Auth] Public Access Granted: ${path}`);
    return next();
  }

  // 2. STREAMING ACCESS (API KEY IN QUERY STRING)
  // This is CRITICAL for the audio player to work properly
  if (path === '/stream' && req.query.key) {
    if (req.query.key === expectedKey) {
      console.log(`[Auth] Stream Access Granted (Key): ${path}`);
      return next();
    }
    console.warn(`[Auth] Stream Access Denied (Invalid Key): ${path}`);
  }

  // 3. JWT AUTH (FOR ADMIN ACTIONS)
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    const secret = process.env.JWT_SECRET || 'fallback_secret_for_dev_only';

    return jwt.verify(token, secret, (err, user) => {
      if (err) {
        console.warn(`[Auth] JWT Invalid: ${err.message}`);
        // If it's a stream request, we might want to check the API key as well
        if (path === '/stream') return checkApiKey();
        return res.status(403).json({ error: 'Invalid or expired token' });
      }
      req.user = user;
      console.log(`[Auth] JWT Admin Access Granted: ${user.username}`);
      return next();
    });
  }

  // 4. API KEY AUTH (FOR GENERAL USAGE)
  function checkApiKey() {
    if (!expectedKey) {
      console.error('CRITICAL: VITE_API_KEY not set on server');
      return res.status(500).json({ error: 'Server Config Error', message: 'API key missing' });
    }

    if (apiKey && apiKey === expectedKey) {
      console.log(`[Auth] API Key Access Granted: ${path}`);
      return next();
    }

    console.warn(`[Auth] Unauthorized Access: ${path}`);
    return res.status(403).json({ error: 'Unauthorized', message: 'Invalid or missing API key' });
  }

  checkApiKey();
};

// ✅ Apply middleware to all /api routes
app.use('/api', authMiddleware);

// ✅ ROUTES (MOUNTED CORRECTLY)
// IMPORTANT: Mount at /api because songsRoute handles /songs and /stream
app.use('/api', songsRoute);   
app.use('/api/admin', adminRoute); 

// ✅ Test route
app.get('/', (req, res) => {
  res.send('API Working ✅');
});

// ✅ Global Error Handler
app.use((err, req, res, next) => {
  console.error('Global Error:', err);
  res.status(500).json({ error: 'Internal Server Error', message: err.message });
});

// ✅ Start server
const isMain =
  process.argv[1] &&
  process.argv[1] === fileURLToPath(import.meta.url);

if (isMain) {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

export default app;
