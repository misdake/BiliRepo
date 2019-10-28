import {Request, Response} from "express";
import {Storage} from "./storage";
import {Downloader} from "./download/Downloader";
import {httpsget} from "./network";

const express = require('express');
const cors = require('cors');

const app = express();

app.use(cors());

app.use('/', express.static('static')); //provide web pages

let storage = new Storage();
let downloader = new Downloader();

//proxy
app.get('/proxy/videoinfo/:aid', function (req: Request, res: Response) {
    httpsget(`https://api.bilibili.com/x/web-interface/view?aid=${req.params["aid"]}`).then(value => {
        res.send(value);
    });
});

//download
app.get('/download/add/:aid', function (req: Request, res: Response) {
    downloader.enqueue(parseInt(req.params["aid"]));
    res.send("true");
});
app.get('/download/status', function (req: Request, res: Response) {
    res.send(downloader.status_mini());
});

//serve video content
app.get('/api/video/recent', function (req : Request, res : Response) {
    res.send(JSON.stringify(storage.video(0, 20)));
});
app.get('/api/video/recent/:page', function (req: Request, res: Response) {
    res.send(JSON.stringify(storage.video(parseInt(req.params["page"]), 20)));
});
app.get('/api/video/member/:mid', function (req: Request, res: Response) { //TODO support page
    res.send(JSON.stringify(storage.member_videos(parseInt(req.params["mid"]))));
});
app.get('/api/member/:mid', function (req: Request, res: Response) {
    res.send(JSON.stringify(storage.member(parseInt(req.params["mid"]))));
});

app.listen(8081);
