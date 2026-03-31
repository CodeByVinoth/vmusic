const express = require('express');
const cors = require('cors');
require('dotenv').config();

const songsRoute = require('./routes/songs');
const adminRoute = require('./routes/admin');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Security Middleware: API Key check
const authMiddleware = (req, res, next) => {
  // Allow login route without API key
  if (req.path === '/admin/login') {
    return next();
  }

  const apiKey = req.headers['x-api-key'] || req.query.key;
  const expectedKey = process.env.API_KEY || 'song_app_secret_123';
  
  if (!apiKey || apiKey !== expectedKey) {
    return res.status(403).json({ error: 'Unauthorized', message: 'Invalid or missing API key' });
  }
  next();
};

app.use('/api', authMiddleware);
app.use('/api', songsRoute.router);
app.use('/api/admin', adminRoute);

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Global Error:', err);
  res.status(500).json({ error: 'Internal Server Error', message: err.message });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
