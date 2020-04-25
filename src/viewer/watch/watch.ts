import {html, render} from 'lit-html';
import "./PageElement";
import {Playlist, PlaylistItem} from "./Playlist";
import {ClientApis} from "../common/api/ClientApi";

let url_string = window.location.href;
let url = new URL(url_string);

//input params
let pid = parseInt(url.searchParams.get("pid"));
let aid = parseInt(url.searchParams.get("aid"));
let part = parseInt(url.searchParams.get("p")) || 1;

//start loading
let playlist = new Playlist();
let currentIndex = 0;
let loadPromise: Promise<Playlist>;

if (!isNaN(pid)) {
    loadPromise = new Promise<Playlist>(resolve => {
        ClientApis.GetPlaylistVideoParts.fetch(pid).then(res => {
            playlist.items = [];
            for (let vp of res.videoParts) {
                for (let p of vp.parts) {
                    playlist.items.push(new PlaylistItem(vp, p));
                }
            }
            resolve();
        });
    });
} else if (aid || !isNaN(aid)) {
    loadPromise = new Promise<Playlist>(resolve => {
        ClientApis.GetVideoParts.fetch(aid).then(res => {
            playlist.items = [];
            for (let p of res.parts) {
                playlist.items.push(new PlaylistItem(res, p));
            }
            resolve();
        });
    });
}

loadPromise.then(() => {
    console.log(playlist);
    for (let i = 0; i < playlist.items.length; i++) {
        let item = playlist.items[i];
        if (aid === item.video.aid && part == item.part.index) {
            currentIndex = i;
        }
    }

    render(html`<page-element .playlist=${playlist} .playindex=${currentIndex}></page-element>`, document.body);
});
