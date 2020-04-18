import {html, render} from 'lit-html';
import "./PageElement";
import {Playlist, PlaylistItem} from "./Playlist";
import {PartDB} from "../../server/storage/dbTypes";
import {ClientApis} from "../common/api/ClientApi";

let url_string = window.location.href;
let url = new URL(url_string);
let aid = parseInt(url.searchParams.get("aid")) || 68836859;
let part = parseInt(url.searchParams.get("p")) || 1;

ClientApis.GetVideoParts.fetch(aid).then(video => {
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
