const router = require('express').Router();
const User = require('../models/User');
const { requireAuth } = require('../middleware/auth');

router.post('/', requireAuth, async (req, res) => {
  const { songId } = req.body;
  await User.findByIdAndUpdate(req.session.userId, { $addToSet: { favorites: songId } });
  res.json({ ok: true });
});

router.delete('/:songId', requireAuth, async (req, res) => {
  await User.findByIdAndUpdate(req.session.userId, { $pull: { favorites: req.params.songId } });
  res.json({ ok: true });
});

router.get('/', requireAuth, async (req, res) => {
  const user = await User.findById(req.session.userId).populate('favorites');
  res.json(user.favorites);
});

module.exports = router;