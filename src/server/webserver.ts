import {Request, Response} from "express";
import {Storage} from "./storage/Storage";
import {Downloader} from "./download/Downloader";
import {httpsget} from "./network";

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();

app.use(cors());
app.use(bodyParser.json());       // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
    extended: true
}));

app.use('/', express.static('static')); //provide web pages
app.use('/repo/', express.static('repo')); //provide video content
app.use('/dist/', express.static('dist')); //provide web pages

//proxy
app.get('/proxy/videoinfo/:id', function (req: Request, res: Response) {
    let id = req.params["id"];
    let query = "";
    if (id.toLowerCase().startsWith("av")) {
        query = `aid=${id.substring(2)}`;
    }
    if (id.toLowerCase().startsWith("bv")) {
        query = `bvid=${id}`;
    }
    console.log("query", query);
    httpsget(`https://api.bilibili.com/x/web-interface/view?${query}`).then(value => {
        res.send(value);
    });
});

Storage.createInstance().then(storage => {
    let downloader = new Downloader(video => {
        storage.importVideo(video);
    });


    app.get('/test', function (req: Request, res: Response) { //TODO test
        // storage.addPlaylist();
        res.send(stringify(storage.getPlaylistVideos(1)));
    });


    //download
    app.get('/download/add/:aid', function (req: Request, res: Response) {
        downloader.enqueue(parseInt(req.params["aid"]));
        res.send("true"); //TODO return result
    });
    app.get('/download/retry/:aid', function (req: Request, res: Response) {
        downloader.remove(parseInt(req.params["aid"]));
        downloader.enqueue(parseInt(req.params["aid"]));
        res.send("true"); //TODO return result
    });
    app.get('/download/remove/:aid', function (req: Request, res: Response) {
        downloader.remove(parseInt(req.params["aid"]));
        res.send("true"); //TODO return result
    });
    app.get('/download/status', function (req: Request, res: Response) {
        res.send(downloader.status_mini());
    });
    app.post('/download/cookie', (req: Request, res: Response) => {
        if (req.body && req.body.cookie) {
            downloader.setCookie(req.body.cookie);
            res.send("good");
        } else {
            res.send("bad");
        }
    });
    app.post('/download/danmaku/update', function (req: Request, res: Response) {
        if (req.body && req.body.part) {
            downloader.updateDanmaku(req.body.part).then(value => {
                res.send("good");
            }).catch(reason => {
                res.send(reason);
            });
        } else {
            res.send("bad");
        }
    });

    const pagesize = 12; //TODO different page sizes for different types?
    const defaultpage = {pageindex: 1, pagesize: pagesize};
    const blacklist = ['meta', '$loki'];

    function stringify(obj: any) {
        return JSON.stringify(obj, function replacer(key, value) {
            return blacklist.indexOf(key) === -1 ? value : undefined
        });
    }

    //video
    app.get('/api/video/aid/:aid', function (req: Request, res: Response) {
        res.send(stringify(storage.video(parseInt(req.params["aid"]))));
    });
    app.get('/api/video/withparts/:aid', function (req: Request, res: Response) {
        res.send(stringify(storage.videoparts(parseInt(req.params["aid"]))));
    });
    app.get('/api/video/recent/:page', function (req: Request, res: Response) {
        res.send(stringify(storage.recent_videos({pageindex: parseInt(req.params["page"]), pagesize})));
    });
    app.get('/api/video/member/:mid/:page', function (req: Request, res: Response) {
        res.send(stringify(storage.mid_videos(parseInt(req.params["mid"]), {pageindex: parseInt(req.params["page"]), pagesize})));
    });

    //member
    app.get('/api/member/mid/:mid', function (req: Request, res: Response) {
        res.send(stringify(storage.member(parseInt(req.params["mid"]))));
    });
    app.get('/api/member/all/:page', function (req: Request, res: Response) {
        res.send(stringify(storage.all_members({pageindex: parseInt(req.params["page"]), pagesize})));
    });

    //search
    app.get('/api/video/search/:input/:page', function (req: Request, res: Response) {
        res.send(stringify(storage.search_video_by_title(req.params["input"], {pageindex: parseInt(req.params["page"]), pagesize})));
    });
    app.get('/api/member/search/:input/:page', function (req: Request, res: Response) {
        res.send(stringify(storage.search_member_by_name(req.params["input"], {pageindex: parseInt(req.params["page"]), pagesize})));
    });
});

app.listen(8081);
