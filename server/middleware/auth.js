exports.requireAuth = (req, res, next) => {
  if (!req.session.userId) return res.status(401).json({ error: 'Login required' });
  next();
};

exports.requireAdmin = async (req, res, next) => {
  if (!req.session.userId) return res.status(401).json({ error: 'Login required' });
  const User = require('../models/User');
  const user = await User.findById(req.session.userId);
  if (!user?.isAdmin) return res.status(403).json({ error: 'Admin only' });
  next();
};