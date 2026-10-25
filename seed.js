require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const connectDB = require('./server/config/db');
const User = require('./server/models/User');
const Song = require('./server/models/Song');
const Artist = require('./server/models/Artist');
const Album = require('./server/models/Album');

const SONGS = [
  { title: 'Baleleng',                artist: 'Max Surban',       album: 'Bisaya Classics', genre: 'Bisaya Folk', duration: 210 },
  { title: 'Usahay',                  artist: 'Pilita Corrales',  album: 'Golden Bisaya',   genre: 'Bisaya Ballad', duration: 240 },
  { title: 'Matud Nila',              artist: 'Yoyoy Villame',    album: 'Bisaya Hits',     genre: 'Bisaya Folk', duration: 195 },
  { title: 'Anak',                    artist: 'Dodong Band',      album: 'Sunset Cebu',     genre: 'Bisaya Pop', duration: 230 },
  { title: 'Buhat',                   artist: 'Jude Gitamondoc',  album: 'Sugbo Sounds',    genre: 'Bisaya Pop', duration: 205 },
  { title: 'Hanggang Sa Muli',        artist: 'Kurt Fick',        album: 'Bisaya Lullaby',  genre: 'Bisaya Ballad', duration: 260 },
  { title: 'Charing',                 artist: 'Yoyoy Villame',    album: 'Bisaya Hits',     genre: 'Bisaya Novelty', duration: 180 },
  { title: 'Bisan Pa',                artist: 'Jong Madarang',    album: 'Visayas Wave',    genre: 'Bisaya Rock', duration: 215 },
  { title: 'Sana Dalawa Ang Puso',    artist: 'Dodong Band',      album: 'Sunset Cebu',     genre: 'Bisaya Pop', duration: 225 },
  { title: 'Paglaum',                 artist: 'Jude Gitamondoc',  album: 'Sugbo Sounds',    genre: 'Bisaya Pop', duration: 200 }
];

const ARTISTS = [
  { name: 'Yoyoy Villame',    biography: 'King of Bisaya novelty songs.' },
  { name: 'Max Surban',       biography: 'Legendary Bisaya folk singer.' },
  { name: 'Pilita Corrales',  biography: 'Asia\'s Queen of Songs.' },
  { name: 'Jude Gitamondoc',  biography: 'Modern Cebuano songwriter.' },
  { name: 'Dodong Band',      biography: 'Cebu-based indie pop band.' },
  { name: 'Jong Madarang',    biography: 'Visayan rock pioneer.' },
  { name: 'Kurt Fick',        biography: 'Bisaya ballad singer.' }
];

(async () => {
  await connectDB();

  await Promise.all([User.deleteMany({}), Song.deleteMany({}), Artist.deleteMany({}), Album.deleteMany({})]);

  const hash = await bcrypt.hash('admin123', 10);
  await User.create({
    username: 'admin', email: 'admin@spotibai.com', password: hash,
    isAdmin: true, profileImage: '/images/default-user.png'
  });

  const demoHash = await bcrypt.hash('demo1234', 10);
  await User.create({
    username: 'demo', email: 'demo@spotibai.com', password: demoHash
  });

  const songs = await Song.insertMany(SONGS);

  const grouped = songs.reduce((acc, s) => {
    (acc[s.artist] = acc[s.artist] || []).push(s._id);
    return acc;
  }, {});
  await Artist.insertMany(ARTISTS.map(a => ({ ...a, songs: grouped[a.name] || [] })));

  const albumMap = {};
  songs.forEach(s => {
    albumMap[s.album] = albumMap[s.album] || { title: s.album, artist: s.artist, songs: [] };
    albumMap[s.album].songs.push(s._id);
  });
  await Album.insertMany(Object.values(albumMap));

  console.log('🌱 Seeded. Login: admin@spotibai.com / admin123  |  demo@spotibai.com / demo1234');
  await mongoose.disconnect();
})();