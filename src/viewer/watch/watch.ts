import {html, render} from 'lit-html';
import {PageElement} from "./PageElement";
import {httpget} from "../../common/network";
import {Playlist, PlaylistItem} from "./Playlist";
import {PartDB, VideoParts} from "../../server/storage/dbTypes";

let url_string = window.location.href;
let url = new URL(url_string);
let aid = parseInt(url.searchParams.get("aid")) || 68836859;
let part = parseInt(url.searchParams.get("p")) || 1;

PageElement.register();

httpget(`http://localhost:8081/api/video/withparts/${aid}`, content => {
    let video = JSON.parse(content) as VideoParts;
    document.title = video.title;

    let index = null;
    for (let [i, page] of video.parts.entries()) {
        if (page.index == part) {
            index = i;
            break;
        }
    }

    let playlist = new Playlist();
    playlist.items = video.parts.map((page: PartDB) => new PlaylistItem(video, page));

    render(html`<page-element .playlist=${playlist} .playindex=${index}></page-element>`, document.body);
});