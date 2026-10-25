const mongoose = require('mongoose');
const albumSchema = new mongoose.Schema({
  title:       { type: String, required: true },
  artist:      { type: String, required: true },
  coverImage:  { type: String, default: '/images/default-cover.png' },
  releaseDate: { type: Date, default: Date.now },
  songs:       [{ type: mongoose.Schema.Types.ObjectId, ref: 'Song' }]
});
module.exports = mongoose.model('Album', albumSchema);