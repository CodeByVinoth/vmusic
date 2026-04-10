import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import jwt from 'jsonwebtoken';
import { fileURLToPath } from 'url';

import songsRoute from './routes/songs.js';
import adminRoute from './routes/admin.js';

const app = express();
const PORT = process.env.PORT || 5000;

console.log('--- VMUSIC SERVER INITIALIZED (ROBUST FIX) ---');

// ✅ Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// ✅ AUTH MIDDLEWARE (REPAIRED & ROBUST)
const authMiddleware = (req, res, next) => {
  // Normalize path by removing trailing slash and ignoring query params
  const path = req.path.replace(/\/$/, '') || '/';
  const apiKey = req.headers['x-api-key'] || req.query.key;
  const authHeader = req.headers.authorization;
  const expectedKey = process.env.VITE_API_KEY;

  console.log(`[Auth] Checking path: ${path} (Original: ${req.path})`);

  // 1. PUBLIC ROUTES (NO AUTH REQUIRED)
  const isPublic = 
    path === '/songs' || 
    path === '/admin/login' || 
    path.endsWith('manifest.webmanifest');

  if (isPublic) {
    console.log(`[Auth] Public access granted: ${path}`);
    return next();
  }

  // 2. STREAMING ACCESS (API KEY IN QUERY)
  if (path === '/stream' && req.query.key) {
    if (req.query.key === expectedKey) {
      console.log(`[Auth] Stream access granted with key: ${path}`);
      return next();
    }
    console.warn(`[Auth] Stream access denied (invalid key): ${path}`);
  }

  // 3. JWT AUTH (FOR ADMIN ACTIONS)
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    const secret = process.env.JWT_SECRET || 'fallback_secret_for_dev_only';

    return jwt.verify(token, secret, (err, user) => {
      if (err) {
        console.warn(`[Auth] JWT Verification Failed: ${err.message}`);
        // If it's a stream, we might still want to allow it via API key if JWT fails
        if (path === '/stream') return checkApiKeyFallback();
        return res.status(403).json({ error: 'Invalid or expired token' });
      }
      req.user = user;
      console.log(`[Auth] JWT Access granted for: ${user.username}`);
      return next();
    });
  }

  // 4. API KEY FALLBACK (FOR GENERAL API USAGE)
  function checkApiKeyFallback() {
    if (!expectedKey) {
      console.error('CRITICAL: VITE_API_KEY is not set on the server!');
      return res.status(500).json({
        error: 'Server Config Error',
        message: 'API key missing in environment'
      });
    }

    if (apiKey && apiKey === expectedKey) {
      console.log(`[Auth] API Key access granted: ${path}`);
      return next();
    }

    console.warn(`[Auth] Unauthorized access attempt: ${path}`);
    return res.status(403).json({
      error: 'Unauthorized',
      message: 'Invalid or missing API key'
    });
  }

  checkApiKeyFallback();
};

// ✅ Apply middleware to all /api routes
app.use('/api', authMiddleware);

// ✅ Routes (CORRECTED MOUNTING)
app.use('/api', songsRoute); // This handles /api/songs and /api/stream
app.use('/api/admin', adminRoute); // This handles /api/admin/login, etc.

// ✅ Root test
app.get('/', (req, res) => {
  res.send('VMusic API Running ✅');
});

// ✅ Global Error Handler
app.use((err, req, res, next) => {
  console.error('Global Error:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message
  });
});

// ✅ Start server (local only)
const isMain =
  process.argv[1] &&
  process.argv[1] === fileURLToPath(import.meta.url);

if (isMain) {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

export default app;
