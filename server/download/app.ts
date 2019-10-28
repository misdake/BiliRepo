import {Request, Response} from "express";
import {Downloader} from "./Downloader";

const express = require('express');
const cors = require('cors');

const app = express();

let downloader = new Downloader();

app.use(cors());

app.get('/download/:aid', function (req: Request, res: Response) {
    res.send(downloader.enqueue(parseInt(req.params["aid"])));
});
app.get('/status', function (req: Request, res: Response) {
    res.send(downloader.status_mini());
});

app.listen(8082);
