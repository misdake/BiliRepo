import {Request, Response} from "express";
import {Storage} from "./storage/Storage";
import {Downloader} from "./download/Downloader";
import {httpsget} from "./network";

const express = require('express');
const cors = require('cors');

const app = express();

app.use(cors());

app.use('/', express.static('static')); //provide web pages
app.use('/dist/', express.static('dist')); //provide web pages

//proxy
app.get('/proxy/videoinfo/:aid', function (req: Request, res: Response) {
    httpsget(`https://api.bilibili.com/x/web-interface/view?aid=${req.params["aid"]}`).then(value => {
        res.send(value);
    });
});

Storage.createInstance().then(storage => {
    let downloader = new Downloader(video => {
        storage.importVideo(video);
    });

    //download
    app.get('/download/add/:aid', function (req: Request, res: Response) {
        downloader.enqueue(parseInt(req.params["aid"]));
        res.send("true");
    });
    app.get('/download/status', function (req: Request, res: Response) {
        res.send(downloader.status_mini());
    });

    const pagesize = 6;
    const defaultpage = {pageindex: 1, pagesize: pagesize};
    const blacklist = ['meta', '$loki'];

    function stringify(obj: any) {
        return JSON.stringify(obj, function replacer(key, value) {
            return blacklist.indexOf(key) === -1 ? value : undefined
        });
    }

    //serve video/member content
    app.get('/api/video/aid/:aid', function (req: Request, res: Response) {
        res.send(stringify(storage.video(parseInt(req.params["aid"]))));
    });
    app.get('/api/video/withparts/:aid', function (req: Request, res: Response) {
        res.send(stringify(storage.videoparts(parseInt(req.params["aid"]))));
    });
    app.get('/api/video/recent', function (req: Request, res: Response) {
        res.send(stringify(storage.recent_videos(defaultpage)));
    });
    app.get('/api/video/recent/:page', function (req: Request, res: Response) {
        res.send(stringify(storage.recent_videos({pageindex: parseInt(req.params["page"]), pagesize})));
    });
    app.get('/api/video/member/:mid', function (req: Request, res: Response) {
        res.send(stringify(storage.mid_videos(parseInt(req.params["mid"]), defaultpage)));
    });
    app.get('/api/video/member/:mid/:page', function (req: Request, res: Response) {
        res.send(stringify(storage.mid_videos(parseInt(req.params["mid"]), {pageindex: parseInt(req.params["page"]), pagesize})));
    });
    app.get('/api/member/mid/:mid', function (req: Request, res: Response) {
        res.send(stringify(storage.member(parseInt(req.params["mid"]))));
    });
});

app.listen(8081);
