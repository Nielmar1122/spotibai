const router = require('express').Router();
const Album = require('../models/Album');
router.get('/', async (req, res) => res.json(await Album.find()));
module.exports = router;