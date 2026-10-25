const router = require('express').Router();
const Playlist = require('../models/Playlist');
const User = require('../models/User');
const { requireAuth } = require('../middleware/auth');

router.get('/', requireAuth, async (req, res) => {
  const list = await Playlist.find({ owner: req.session.userId }).populate('songs');
  res.json(list);
});

router.post('/', requireAuth, async (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: 'Name required' });
  const pl = await Playlist.create({ name, owner: req.session.userId });
  await User.findByIdAndUpdate(req.session.userId, { $push: { playlists: pl._id } });
  res.status(201).json(pl);
});

router.put('/:id', requireAuth, async (req, res) => {
  const { name, songId, action } = req.body;
  const pl = await Playlist.findOne({ _id: req.params.id, owner: req.session.userId });
  if (!pl) return res.status(404).json({ error: 'Not found' });
  if (name) pl.name = name;
  if (songId && action === 'add')    pl.songs.addToSet(songId);
  if (songId && action === 'remove') pl.songs.pull(songId);
  await pl.save();
  res.json(pl);
});

router.delete('/:id', requireAuth, async (req, res) => {
  await Playlist.findOneAndDelete({ _id: req.params.id, owner: req.session.userId });
  res.json({ ok: true });
});

module.exports = router;