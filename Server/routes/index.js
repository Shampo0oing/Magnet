const express = require('express');
const router = express.Router();
const fs = require('fs');
const TorrentHelper = require('../service/TorrentHelper');

/* GET home page. */
router.get('/', async (req, res) => {
  res.render('index', { title: 'Express' });
});

router.post('/magnet', async (req, res) => {
  TorrentHelper.getMagnetFiles(req.body.magnet).then( rep => res.json(rep));
});

router.get('/magnet/stream/:filesIndex',  (req, res) => {
  TorrentHelper.createReadableStream(req.params['filesIndex'], res);
});

router.delete('/magnet/delete', async (req, res) => {
  res.json(TorrentHelper.deleteTorrent());
});
module.exports = router;
