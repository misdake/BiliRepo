import {Request, Response} from "express";
import {Storage} from "./storage";
import {Downloader} from "./download/Downloader";

const express = require('express');
const cors = require('cors');

const app = express();

app.use(cors());

app.use('/', express.static('static')); //provide web pages

let storage = new Storage();
let downloader = new Downloader();

//download
app.get('/download/:aid', function (req: Request, res: Response) {
    res.send(downloader.enqueue(parseInt(req.params["aid"])));
});
app.get('/status', function (req: Request, res: Response) {
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
