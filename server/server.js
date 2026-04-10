import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import jwt from 'jsonwebtoken';

import songsRoute from './routes/songs.js';
import adminRoute from './routes/admin.js';

import { fileURLToPath } from 'url';

const app = express();
const PORT = process.env.PORT || 5000;

console.log('--- VMUSIC SERVER INITIALIZED (v1.0.2) ---');

app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Security Middleware: API Key or JWT check
const authMiddleware = (req, res, next) => {
  // Allow public routes without auth
  const publicRoutes = ['/admin/login', '/songs'];
  const path = req.path.replace(/\/$/, ''); // Remove trailing slash for matching
  
  if (publicRoutes.includes(path) || req.path.endsWith('manifest.webmanifest')) {
    return next();
  }

  const authHeader = req.headers.authorization;
  const apiKey = req.headers['x-api-key'] || req.query.key;

  // Priority 0: Stream requests with key in query
  if (req.path.includes('/stream') && req.query.key) {
    const expectedKey = process.env.VITE_API_KEY;
    if (req.query.key === expectedKey) {
      return next();
    }
  }

  // Priority 1: JWT Token
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    const secret = process.env.JWT_SECRET || 'fallback_secret_for_dev_only';
    
    jwt.verify(token, secret, (err, user) => {
      if (err) {
        // If it's a stream request, we might want to check the API key even if the JWT fails
        if (req.path.includes('/stream')) {
          return checkApiKey();
        }
        return res.status(403).json({ error: 'Invalid or expired token' });
      }
      req.user = user;
      return next();
    });
    return; // Stop further execution
  }

  function checkApiKey() {
    // Priority 2: API Key
    const expectedKey = process.env.VITE_API_KEY;
    if (!expectedKey) {
      console.error('CRITICAL: API_KEY is not set in environment variables!');
      return res.status(500).json({ 
        error: 'Server Configuration Error', 
        message: 'API_KEY is missing on the server.' 
      });
    }
    
    if (!apiKey || apiKey !== expectedKey) {
      return res.status(403).json({ error: 'Unauthorized', message: 'Invalid or missing API key' });
    }
    
    next();
  }

  checkApiKey();
};

app.use('/api', authMiddleware);
app.use('/api', songsRoute);
app.use('/api/admin', adminRoute);

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Global Error:', err);
  res.status(500).json({ error: 'Internal Server Error', message: err.message });
});

// Start server if run directly (local development)
const isMain = process.argv[1] && (process.argv[1] === fileURLToPath(import.meta.url));
if (isMain) {
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}

export default app;
