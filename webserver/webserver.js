const Storage = require('./storage');
const express = require('express');
const cors = require('cors');

console.log("loading videos");
let storage = new Storage();
storage.loadAllVideos();
console.log("complete");

const app = express();

app.use(cors());

app.use('/', express.static('page')); //provide web pages
app.use('/repo', express.static('repo')); //provide media files (video, danmaku, videoinfo)

app.get('/api/video/random', function (req, res) {

});
app.get('/downloader/finished', function (req, res) { //from downloader, read video info

});

app.get('/api/video/aid/:aid', function (req, res) {
    let video = storage.video_aid(parseInt(req.params.aid));
    if (video) {
        res.send(video);
    } else {
        res.status(404).end();
    }
});

app.listen(8081);
