require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('./server/config/db');
const User = require('./server/models/User');
const Song = require('./server/models/Song');
const Artist = require('./server/models/Artist');
const Album = require('./server/models/Album');

(async () => {
  await connectDB();
  
  // Delete everything except the admin user
  await Song.deleteMany({});
  await Artist.deleteMany({});
  await Album.deleteMany({});
  await User.deleteMany({ email: { $ne: 'admin@spotibai.com' } }); 
  
  console.log('🧹 Database cleared! All fake songs and artists are gone.');
  console.log('👑 Admin account kept: admin@spotibai.com / admin123');
  
  process.exit();
})();