const router = require('express').Router();
const Song = require('../models/Song');
const Artist = require('../models/Artist');
const Album = require('../models/Album');
const Playlist = require('../models/Playlist');

router.get('/', async (req, res) => {
  const q = (req.query.q || '').trim();
  if (!q) return res.json({ songs: [], artists: [], albums: [], playlists: [] });
  const rx = new RegExp(q, 'i');
  const [songs, artists, albums, playlists] = await Promise.all([
    Song.find({ $or: [{ title: rx }, { artist: rx }, { album: rx }] }).limit(20),
    Artist.find({ name: rx }).limit(10),
    Album.find({ $or: [{ title: rx }, { artist: rx }] }).limit(10),
    Playlist.find({ name: rx }).limit(10)
  ]);
  res.json({ songs, artists, albums, playlists });
});

module.exports = router;