import {Application} from "express";
import {Storage} from "./storage/Storage";
import {Downloader} from "./download/Downloader";
import {httpsget} from "./network";
import {initServerApi, ServerApis} from "./ServerApi";
import {BilibiliVideoJson, BilibiliVideoListJson} from "../common/types";

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const app: Application = express();

app.use(cors());
app.use(bodyParser.json());       // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
    extended: true
}));

app.use('/', express.static('static')); //provide web pages
app.use('/repo/', express.static('repo')); //provide video content
app.use('/dist/', express.static('dist')); //provide web pages

Storage.createInstance().then(storage => {
    let downloader = new Downloader(video => {
        storage.importVideo(video);
    });

    initServerApi(app, downloader);

    // app.get('/test', function (req: Request, res: Response) { //TODO test
    //     // storage.addPlaylist();
    //     res.send(stringify(storage.getPlaylistVideos(1)));
    // });

    //proxy
    ServerApis.GetVideoInfo.serve(req => req.params["id"], (id, body) => new Promise<BilibiliVideoJson>(resolve => {
        let query = "";
        if (id.toLowerCase().startsWith("av")) {
            query = `aid=${id.substring(2)}`;
        }
        if (id.toLowerCase().startsWith("bv")) {
            query = `bvid=${id}`;
        }
        console.log("query", query);
        httpsget(`https://api.bilibili.com/x/web-interface/view?${query}`).then(value => {
            resolve(JSON.parse(value) as BilibiliVideoJson);
        });
    }));
    ServerApis.GetCoinVideos.serve(req => parseInt(req.params["mid"]), (mid) => new Promise<BilibiliVideoListJson>(resolve => {
        httpsget(`https://api.bilibili.com/x/space/coin/video?vmid=${mid}`).then(value => {
            resolve(JSON.parse(value) as BilibiliVideoListJson);
        });
    }));

    //download
    ServerApis.AddDownload.serve(req => parseInt(req.params["aid"]), aid => {
        downloader.enqueue(aid);
        return true;
    });
    ServerApis.RetryDownload.serve(req => parseInt(req.params["aid"]), aid => {
        downloader.remove(aid);
        downloader.enqueue(aid);
        return true;
    });
    ServerApis.RemoveDownload.serve(req => parseInt(req.params["aid"]), aid => {
        downloader.remove(aid);
        return true;
    });
    ServerApis.StatusDownload.serve(_req => ({}), _param => downloader.status_mini());

    ServerApis.UpdateCookie.serve(
        _req => ({}),
        (param, body) => new Promise<string>(resolve => {
            if (body && body.cookie) {
                downloader.setCookie(body.cookie);
                resolve("good");
            } else {
                resolve("bad");
            }
        }),
    );

    ServerApis.UpdateDanmaku.serve(
        _req => ({}),
        (param, body) => new Promise<string>(resolve => {
            if (body.part) {
                downloader.updateDanmaku(body.part).then(value => {
                    resolve("good");
                }).catch(reason => {
                    resolve(reason);
                });
            } else {
                resolve("bad");
            }
        }),
    );


    const videoPagesize = 12;
    const memberPagesize = 24;
    const playlistPagesize = 8;

    //video
    ServerApis.GetVideo.serve(
        req => parseInt(req.params["aid"]),
        aid => storage.video(aid)
    );
    ServerApis.GetVideoRandom.serve(
        req => ({}),
        ({}) => storage.videoRandom()
    );
    ServerApis.GetVideoParts.serve(
        req => parseInt(req.params["aid"]),
        aid => storage.videoparts(aid)
    );
    ServerApis.ListVideo.serve(
        req => parseInt(req.params["page"]),
        page => storage.recent_videos({pageindex: page, pagesize: videoPagesize})
    );
    ServerApis.ListVideoByMember.serve(
        req => ({mid: parseInt(req.params["mid"]), page: parseInt(req.params["page"])}),
        ({mid, page}) => storage.mid_videos(mid, {pageindex: page, pagesize: videoPagesize}),
    );

    //member
    ServerApis.GetMember.serve(
        req => parseInt(req.params["mid"]),
        mid => storage.member(mid),
    );
    ServerApis.ListMember.serve(
        req => parseInt(req.params["page"]),
        page => storage.all_members({pageindex: page, pagesize: memberPagesize}),
    );

    //playlist
    ServerApis.AddPlaylist.serve(
        _req => ({}),
        (param, body) => new Promise(resolve => {
            let created = storage.addPlaylist(body.title, body.aids);
            resolve(created);
        }),
    );
    ServerApis.UpdatePlaylist.serve(
        req => parseInt(req.params["pid"]),
        (param, body) => new Promise(resolve => {
            let updated = storage.updatePlaylist(param, body.title, body.add, body.remove);
            resolve(updated);
        }),
    );
    ServerApis.RemovePlaylist.serve(
        req => parseInt(req.params["pid"]),
        (pid) => storage.removePlaylist(pid),
    );
    ServerApis.GetPlaylist.serve(
        req => parseInt(req.params["pid"]),
        pid => storage.getPlaylist(pid)
    );
    ServerApis.GetPlaylistVideos.serve(
        req => parseInt(req.params["pid"]),
        pid => storage.getPlaylistVideos(pid)
    );
    ServerApis.GetPlaylistVideoParts.serve(
        req => parseInt(req.params["pid"]),
        pid => storage.getPlaylistVideoParts(pid)
    );
    ServerApis.GetVideoPlaylists.serve(
        req => parseInt(req.params["aid"]),
        aid => storage.getVideoPlaylists(aid)
    );
    ServerApis.ListPlaylist.serve(
        req => parseInt(req.params["page"]),
        page => storage.listPlaylist({pageindex: page, pagesize: playlistPagesize})
    );

    ServerApis.ListTimestamp.serve(
        req => parseInt(req.params["page"]),
        page => storage.listTimestamp({pageindex: page, pagesize: playlistPagesize})
    );
    ServerApis.AddTimestamp.serve(
        _req => ({}),
        (param, body) => new Promise(resolve => {
            let created = storage.addTimestamp(body.aid, body.part, body.time_second, body.name);
            resolve(created);
        }),
    );
    ServerApis.RemoveTimestamp.serve(
        req => parseInt(req.params["tid"]),
        (tid) => storage.removeTimestamp(tid),
    );

    //search
    ServerApis.SearchVideo.serve(
        req => ({input: req.params["input"], page: parseInt(req.params["page"])}),
        ({input, page}) => storage.search_video_by_title(input, {pageindex: page, pagesize: videoPagesize}),
    );
    ServerApis.SearchMember.serve(
        req => ({input: req.params["input"], page: parseInt(req.params["page"])}),
        ({input, page}) => storage.search_member_by_name(input, {pageindex: page, pagesize: memberPagesize}),
    );
    ServerApis.SearchPlaylist.serve(
        req => ({input: req.params["input"], page: parseInt(req.params["page"])}),
        ({input, page}) => storage.search_playlist_by_title(input, {pageindex: page, pagesize: playlistPagesize}),
    );
    ServerApis.SearchTimestamp.serve(
        req => ({input: req.params["input"], page: parseInt(req.params["page"])}),
        ({input, page}) => storage.search_timestamp_by_name(input, {pageindex: page, pagesize: playlistPagesize}),
    );
});

app.listen(8081);
