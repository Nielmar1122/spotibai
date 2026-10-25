const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);
require('dotenv').config();
require('dotenv').config();
const express = require('express');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const path = require('path');
const connectDB = require('./server/config/db');

const app = express();
connectDB();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
  secret: process.env.SESSION_SECRET || 'dev_secret',
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({ mongoUrl: process.env.MONGODB_URI }),
  cookie: { maxAge: 1000 * 60 * 60 * 24 * 7, httpOnly: true, sameSite: 'lax' }
}));

// Routes
app.use('/api/auth',       require('./server/routes/auth'));
app.use('/api/songs',      require('./server/routes/songs'));
app.use('/api/artists',    require('./server/routes/artists'));
app.use('/api/albums',     require('./server/routes/albums'));
app.use('/api/playlists',  require('./server/routes/playlists'));
app.use('/api/favorites',  require('./server/routes/favorites'));
app.use('/api/search',     require('./server/routes/search'));

// SPA fallback
app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'public/index.html')));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🎵 Spotibai running on http://localhost:${PORT}`));