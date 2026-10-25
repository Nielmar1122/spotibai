const mongoose = require('mongoose');

const songSchema = new mongoose.Schema({
  title:       { type: String, required: true, trim: true },
  artist:      { type: String, required: true, trim: true },
  album:       { type: String, default: '' },
  genre:       { type: String, default: 'Bisaya' },
  description: { type: String, default: '' },
  coverImage:  { type: String, default: '/images/default-cover.png' },
  audioFile:   { type: String, default: '' }, // empty = placeholder
  duration:    { type: Number, default: 0 },  // seconds
  plays:       { type: Number, default: 0 },
  releaseDate: { type: Date, default: Date.now },
  createdAt:   { type: Date, default: Date.now }
});

songSchema.index({ title: 'text', artist: 'text', album: 'text' });
module.exports = mongoose.model('Song', songSchema);