const mongoose = require('mongoose');
const playlistSchema = new mongoose.Schema({
  name:       { type: String, required: true, trim: true },
  owner:      { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  coverImage: { type: String, default: '/images/default-cover.png' },
  songs:      [{ type: mongoose.Schema.Types.ObjectId, ref: 'Song' }],
  createdAt:  { type: Date, default: Date.now }
});
module.exports = mongoose.model('Playlist', playlistSchema);