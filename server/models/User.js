const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, trim: true, minlength: 3 },
  email:    { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true, minlength: 6, select: false },
  profileImage: { type: String, default: '/images/default-user.png' },
  isAdmin:  { type: Boolean, default: false },
  favorites: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Song' }],
  playlists: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Playlist' }],
  recentlyPlayed: [{
    song:     { type: mongoose.Schema.Types.ObjectId, ref: 'Song' },
    playedAt: { type: Date, default: Date.now }
  }],
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', userSchema);