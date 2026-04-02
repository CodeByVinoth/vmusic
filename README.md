# VMUSIC - Professional Music Streaming App

A modern, responsive music streaming application with a professional design inspired by Spotify.

## 🎵 Features

- **Professional Design**: Modern UI with glass effects and smooth animations
- **Fully Responsive**: Perfect experience on mobile, tablet, and desktop
- **Full-Screen Mobile Player**: Spotify-like experience with progress controls
- **Music Library Management**: Admin panel for uploading and managing songs
- **Playlist Support**: Create and manage custom playlists
- **Search Functionality**: Real-time search across your music library
- **Progress Controls**: Seek through songs, skip tracks, shuffle, and repeat
- **Like System**: Favorite your favorite songs
- **PWA Support**: Install as a progressive web app

## 🚀 Technologies

- **Frontend**: React 19, Vite, Tailwind CSS
- **Backend**: Node.js, Express
- **Icons**: Lucide React
- **Audio**: HTML5 Audio API
- **Deployment**: Vercel

## 📦 Installation

### Prerequisites

- Node.js (version 18 or higher)
- npm or yarn

### Local Development

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd song
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

4. **Start backend server** (in a separate terminal)
   ```bash
   npm run server
   ```

5. **Open your browser** and navigate to `http://localhost:5173`

## 🌐 Deployment to Vercel

### Automatic Deployment (Recommended)

1. **Push to GitHub**: Ensure your code is pushed to a GitHub repository
2. **Connect to Vercel**: 
   - Go to [vercel.com](https://vercel.com)
   - Sign in and import your GitHub repository
   - Vercel will automatically detect the project and use the `vercel.json` configuration

### Manual Deployment

1. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Deploy**
   ```bash
   vercel
   ```

3. **Follow the prompts** to configure your deployment

## ⚙️ Environment Variables

For production deployment, you may need to set these environment variables in your Vercel project settings:

- `NODE_ENV=production`
- `PORT=3000` (or your preferred port)

## 📱 Mobile Features

### Full-Screen Player
- Tap the mini-player to expand to full screen
- Large album art display
- Progress bar with seek functionality
- Skip forward/backward controls
- Play/pause button
- Shuffle and repeat controls
- Volume control
- Like button for favorites

### Touch Optimizations
- 44px+ touch targets for all buttons
- Smooth animations and transitions
- Safe area support for notched devices
- Optimized scrolling behavior

## 🎨 Design Highlights

- **Color Scheme**: Spotify-inspired green accents (#1DB954)
- **Typography**: Inter font family with proper hierarchy
- **Animations**: Smooth transitions and micro-interactions
- **Glass Effects**: Modern frosted glass components
- **Responsive Grids**: Flexible layouts that adapt to any screen size
- **Accessibility**: Proper ARIA labels and focus states

## 🔧 Project Structure

```
song/
├── src/
│   ├── components/          # React components
│   │   ├── FullScreenPlayer.jsx  # New full-screen mobile player
│   │   ├── PlayerBar.jsx         # Enhanced player with mobile support
│   │   ├── Sidebar.jsx           # Redesigned sidebar
│   │   ├── SongCard.jsx          # Modern song cards
│   │   └── MainView.jsx          # Main content area
│   ├── pages/               # Page components
│   │   ├── AdminPage.jsx         # Admin dashboard
│   │   └── LoginPage.jsx         # Login form
│   ├── MusicContext.jsx     # Music state management
│   ├── AuthContext.jsx      # Authentication context
│   └── App.jsx              # Main app component
├── api/                     # Backend API
│   └── index.js             # Express server
├── public/                  # Static assets
├── server/                  # Server files
└── dist/                    # Build output
```

## 🐛 Troubleshooting

### Common Vercel Issues

1. **Build Failures**: Ensure Node.js version is 18+ in `package.json`
2. **API Routes**: Check that `api/index.js` is properly configured
3. **Static Assets**: Verify `vercel.json` routes are correct
4. **Environment Variables**: Set any required env vars in Vercel dashboard

### Development Issues

1. **Port Conflicts**: Change ports in `vite.config.js` if needed
2. **CORS Issues**: Backend should handle CORS properly
3. **Hot Reload**: May need to restart dev server after major changes

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 🤝 Contributing

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📞 Support

For support, email vinoth@example.com or create an issue on GitHub.

---

**Built with ❤️ using React and Tailwind CSS**