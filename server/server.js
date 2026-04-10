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

// ✅ AUTH MIDDLEWARE (ROBUST & COMPLETE)
const authMiddleware = (req, res, next) => {
  // Normalize path by removing trailing slash and ignoring query params
  const path = req.path.replace(/\/$/, '') || '/';
  const apiKey = req.headers['x-api-key'] || req.query.key;
  const authHeader = req.headers.authorization;
  const expectedKey = process.env.VITE_API_KEY;

  console.log(`[Auth] Request: ${req.method} ${path}`);

  // 1. PUBLIC ROUTES (NO AUTH REQUIRED)
  if (path === '/songs' || path === '/admin/login' || req.path.endsWith('manifest.webmanifest')) {
    console.log(`[Auth] Public Access: ${path}`);
    return next();
  }

  // 2. STREAMING ACCESS (API KEY IN QUERY STRING)
  // This is critical for the audio player to work
  if (path === '/stream' && req.query.key) {
    if (req.query.key === expectedKey) {
      console.log(`[Auth] Stream Access Granted: ${path}`);
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
        // If it's a stream, we might still want to check the API key header
        if (path === '/stream') return checkApiKeyHeader();
        return res.status(403).json({ error: 'Invalid or expired token' });
      }
      req.user = user;
      console.log(`[Auth] JWT Admin Access: ${user.username}`);
      return next();
    });
  }

  // 4. API KEY HEADER AUTH (FOR GENERAL API USAGE)
  function checkApiKeyHeader() {
    if (!expectedKey) {
      console.error('CRITICAL: VITE_API_KEY not set on server');
      return res.status(500).json({ error: 'Server Config Error', message: 'API key missing' });
    }

    if (apiKey && apiKey === expectedKey) {
      console.log(`[Auth] API Key Access: ${path}`);
      return next();
    }

    console.warn(`[Auth] Unauthorized Access: ${path}`);
    return res.status(403).json({ error: 'Unauthorized', message: 'Invalid or missing API key' });
  }

  checkApiKeyHeader();
};

// ✅ Apply middleware
app.use('/api', authMiddleware);

// ✅ ROUTES
app.use('/api', songsRoute);   // Handles /api/songs and /api/stream
app.use('/api/admin', adminRoute); // Handles /api/admin/...

// ✅ Root test
app.get('/', (req, res) => {
  res.send('VMusic API Working ✅');
});

// ✅ Global Error Handler
app.use((err, req, res, next) => {
  console.error('Global Error:', err);
  res.status(500).json({ error: 'Internal Server Error', message: err.message });
});

// ✅ Start server (local development only)
const isMain =
  process.argv[1] &&
  process.argv[1] === fileURLToPath(import.meta.url);

if (isMain) {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

export default app;
