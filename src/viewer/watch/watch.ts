import {html, render} from 'lit-html';
import "./PageElement";
import {Playlist, PlaylistItem} from "./Playlist";
import {ClientApis} from "../common/api/ClientApi";
import {PartDB, VideoParts} from "../../server/storage/dbTypes";

let url_string = window.location.href;
let url = new URL(url_string);

//input params
let pidstr = url.searchParams.get("pid");
let pid = parseInt(pidstr);
let aidstr = url.searchParams.get("aid");
let aid = parseInt(aidstr);
let part = parseInt(url.searchParams.get("p")) || 1;

//start loading
let playlist = new Playlist();
let currentIndex: number = undefined;
let loadPromise: Promise<Playlist>;

if (pidstr) {
    loadPromise = new Promise<Playlist>(resolve => {
        ClientApis.GetPlaylistVideoParts.fetch(pid).then(res => {
            playlist.items = [];
            for (let vp of res.videoParts) {
                for (let p of vp.parts) {
                    playlist.items.push(new PlaylistItem(vp, p));
                }
            }
            //TODO what if playlist is not found?
            resolve();
        });
    });
} else if (aidstr) {
    loadPromise = new Promise<Playlist>(resolve => {
        ClientApis.GetVideoParts.fetch(aid).then(res => {
            playlist.items = [];
            for (let p of res.parts) {
                playlist.items.push(new PlaylistItem(res, p));
            }
            //TODO what if video is not found?
            resolve();
        });
    });
}

loadPromise.then(() => {
    console.log(playlist);

    if (aid) {
        for (let i = 0; i < playlist.items.length; i++) {
            let item = playlist.items[i];
            if (aid === item.video.aid && part == item.part.index) {
                currentIndex = i;
            }
        }

        if (currentIndex === undefined) {
            //TODO what if currentIndex is not found?
            window.location.replace("index.html");
        }
    }

    currentIndex |= 0;

    let onBeginPart = (video: VideoParts, part: PartDB) => {
        let url = location.pathname;
        let params: { key: string, value: number }[] = [];
        if (pid) params.push({key: "pid", value: pid});
        params.push({key: "aid", value: video.aid});
        params.push({key: "p", value: part.index});
        history.replaceState(null, "", `${url}?${params.map(i => `${i.key}=${i.value}`).join("&")}`);
    };

    render(html`<page-element .onBeginPart=${onBeginPart} .playlist=${playlist} .playindex=${currentIndex}></page-element>`, document.body);
});
