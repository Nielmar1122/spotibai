const router = require('express').Router();
const multer = require('multer');
const Artist = require('../models/Artist');
const { requireAdmin } = require('../middleware/auth');

// Setup Multer to save images in uploads/artists
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/artists'),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname.replace(/\s+/g, '_'))
});
const upload = multer({ storage });

// Get all artists
router.get('/', async (req, res) => {
  const artists = await Artist.find();
  res.json(artists);
});

// Create a new artist (Admin Only)
router.post('/', requireAdmin, upload.single('profileImage'), async (req, res) => {
  try {
    const { name, biography } = req.body;
    if (!name) return res.status(400).json({ error: 'Name is required' });

    const artist = await Artist.create({
      name,
      biography,
      profileImage: req.file ? '/uploads/artists/' + req.file.filename : '/images/default-artist.png'
    });
    res.status(201).json(artist);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;