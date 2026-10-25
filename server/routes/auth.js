const router = require('express').Router();
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');

router.post('/register',
  body('username').trim().isLength({ min: 3 }),
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ error: errors.array()[0].msg });

      const { username, email, password } = req.body;
      const exists = await User.findOne({ $or: [{ email }, { username }] });
      if (exists) return res.status(400).json({ error: 'Username or email already taken' });

      const hash = await bcrypt.hash(password, 10);
      const user = await User.create({ username, email, password: hash });
      req.session.userId = user._id;
      res.json({ user: { id: user._id, username, email, profileImage: user.profileImage } });
    } catch (e) { next(e); }
  });

router.post('/login',
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty(),
  async (req, res, next) => {
    try {
      const { email, password } = req.body;
      const user = await User.findOne({ email }).select('+password');
      if (!user) return res.status(401).json({ error: 'Invalid credentials' });
      const ok = await bcrypt.compare(password, user.password);
      if (!ok) return res.status(401).json({ error: 'Invalid credentials' });

      req.session.userId = user._id;
      res.json({ user: { id: user._id, username: user.username, email: user.email, profileImage: user.profileImage } });
    } catch (e) { next(e); }
  });

router.post('/logout', (req, res) => {
  req.session.destroy(() => res.json({ ok: true }));
});

router.get('/me', async (req, res) => {
  if (!req.session.userId) return res.json({ user: null });
  const user = await User.findById(req.session.userId);
  if (!user) return res.json({ user: null });
  res.json({ user: {
    id: user._id, username: user.username, email: user.email,
    profileImage: user.profileImage, isAdmin: user.isAdmin,
    favorites: user.favorites
  }});
});

module.exports = router;