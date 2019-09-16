const express = require('express');
const cors = require('cors');

const app = express();

app.use(cors());

app.use('/', express.static('page')); //provide web pages
app.use('/repo', express.static('repo')); //provide media files (video, danmaku, videoinfo)

app.get('/api/video/all', function (req, res) {

});
app.get('/api/video/tag/:tag', function (req, res) {

});
app.get('/api/video/new', function (req, res) {

});
app.get('/downloader/finished', function (req, res) { //from downloader, read video info

});

app.get('/video/:aid', function (req, res) {
    res.send(`video: aid = ${req.params.aid}`);
});

app.listen(8081);
