import express from 'express';
import cors from 'cors';
import 'dotenv/config';

import songsRoute from './routes/songs.js';
import adminRoute from './routes/admin.js';

import { fileURLToPath } from 'url';

const app = express();
const PORT = process.env.PORT || 5000;

console.log('--- VMUSIC SERVER INITIALIZED (v1.0.2) ---');

app.use(cors());
app.use(express.json());

// Security Middleware: API Key check
const authMiddleware = (req, res, next) => {
  // Allow login route without API key
  if (req.path === '/admin/login') {
    return next();
  }

  const apiKey = req.headers['x-api-key'] || req.query.key;
  const expectedKey = process.env.API_KEY;
  
  if (!expectedKey) {
    console.error('CRITICAL: API_KEY is not set in environment variables!');
    return res.status(500).json({ 
      error: 'Server Configuration Error', 
      message: 'API_KEY is missing on the server. Please check Vercel settings.' 
    });
  }
  
  if (!apiKey || apiKey !== expectedKey) {
    return res.status(403).json({ error: 'Unauthorized', message: 'Invalid or missing API key' });
  }
  next();
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
