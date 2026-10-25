const router = require('express').Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Song = require('../models/Song');
const User = require('../models/User');
const { requireAdmin } = require('../middleware/auth');

// THIS FIX: Automatically creates the folder if it doesn't exist
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const folder = file.fieldname === 'audio' ? 'uploads/music' : 'uploads/covers';
    if (!fs.existsSync(folder)) fs.mkdirSync(folder, { recursive: true });
    cb(null, folder);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname.replace(/\s+/g, '_'));
  }
});

// THIS FIX: Increased file size limit to 50MB for audio
const upload = multer({ 
  storage, 
  limits: { fileSize: 50 * 1024 * 1024 } 
});

router.post('/', requireAdmin, upload.fields([{ name: 'audio', maxCount: 1 }, { name: 'cover', maxCount: 1 }]), async (req, res, next) => {
  try {
    const { title, artist, album, genre, description, releaseDate, duration } = req.body;
    if (!title || !artist) return res.status(400).json({ error: 'Title and artist required' });

    const song = await Song.create({
      title, artist, album, genre, description,
      releaseDate: releaseDate || Date.now(),
      duration: Number(duration) || 0,
      audioFile:  req.files?.audio ? '/uploads/music/' + req.files.audio[0].filename : '',
      coverImage: req.files?.cover ? '/uploads/covers/' + req.files.cover[0].filename : '/images/default-cover.png'
    });
    res.status(201).json(song);
  } catch (err) { 
    console.error(err);
    res.status(500).json({ error: err.message }); 
  }
});

router.get('/', async (req, res) => {
  const songs = await Song.find().sort({ createdAt: -1 });
  res.json(songs);
});

router.get('/:id', async (req, res) => {
  const song = await Song.findById(req.params.id);
  if (!song) return res.status(404).json({ error: 'Not found' });
  
  // THIS IS THE FIX: Properly saving to recently played
  if (req.session.userId) {
    await User.findByIdAndUpdate(req.session.userId, {
      $push: { 
        recentlyPlayed: { 
          $each: [{ song: song._id, playedAt: new Date() }], 
          $slice: -20 // Keeps only the last 20 songs
        } 
      }
    });
    await Song.findByIdAndUpdate(song._id, { $inc: { plays: 1 } });
  }
  
  res.json(song);
});

router.put('/:id', requireAdmin, async (req, res) => {
  const song = await Song.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(song);
});

router.delete('/:id', requireAdmin, async (req, res) => {
  await Song.findByIdAndDelete(req.params.id);
  res.json({ ok: true });
});

module.exports = router;