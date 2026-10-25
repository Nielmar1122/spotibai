const router = require('express').Router();
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');
const Song = require('../models/Song');
const User = require('../models/User');
const { requireAdmin } = require('../middleware/auth');

// 1. Setup Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// 2. Setup Multer to save directly to Cloudinary
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'spotibai',
    resource_type: 'auto', // allows both images and audio
  },
});

const upload = multer({ 
  storage,
  limits: { fileSize: 50 * 1024 * 1024 } // Allows files up to 50MB
});

// 3. Upload Route
router.post('/', requireAdmin, upload.fields([{ name: 'audio', maxCount: 1 }, { name: 'cover', maxCount: 1 }]), async (req, res, next) => {
  try {
    const { title, artist, album, genre, description, releaseDate, duration } = req.body;
    if (!title || !artist) return res.status(400).json({ error: 'Title and artist required' });

    const song = await Song.create({
      title, artist, album, genre, description,
      releaseDate: releaseDate || Date.now(),
      duration: Number(duration) || 0,
      audioFile:  req.files?.audio ? req.files.audio[0].path : '',
      coverImage: req.files?.cover ? req.files.cover[0].path : '/images/default-cover.png'
    });
    res.status(201).json(song);
    } catch (err) { 
    console.error("UPLOAD ERROR:", err.message || JSON.stringify(err));
    res.status(500).json({ error: err.message }); 
  }
});

// 4. Get Songs
router.get('/', async (req, res) => {
  const songs = await Song.find().sort({ createdAt: -1 });
  res.json(songs);
});

// 5. Get Single Song (Recently Played logic)
router.get('/:id', async (req, res) => {
  const song = await Song.findById(req.params.id);
  if (!song) return res.status(404).json({ error: 'Not found' });
  
  if (req.session.userId) {
    await User.findByIdAndUpdate(req.session.userId, {
      $push: { recentlyPlayed: { $each: [{ song: song._id, playedAt: new Date() }], $slice: -30 } }
    });
    await Song.findByIdAndUpdate(song._id, { $inc: { plays: 1 } });
  }
  res.json(song);
});

// 6. Edit Song
router.put('/:id', requireAdmin, async (req, res) => {
  const song = await Song.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(song);
});

// 7. Delete Song
router.delete('/:id', requireAdmin, async (req, res) => {
  await Song.findByIdAndDelete(req.params.id);
  res.json({ ok: true });
});

module.exports = router;