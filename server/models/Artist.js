const mongoose = require('mongoose');
const artistSchema = new mongoose.Schema({
  name:         { type: String, required: true, unique: true },
  profileImage: { type: String, default: '/images/default-artist.png' },
  biography:    { type: String, default: '' },
  songs:        [{ type: mongoose.Schema.Types.ObjectId, ref: 'Song' }]
});
module.exports = mongoose.model('Artist', artistSchema);