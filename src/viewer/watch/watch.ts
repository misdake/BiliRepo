import {html, render} from 'lit-html';
import {PageElement} from "./PageElement";
import {httpget} from "../../common/network";
import {Playlist, PlaylistItem} from "../../common/Playlist";
import {BilibiliPage} from "../../common/types";

let url_string = window.location.href;
let url = new URL(url_string);
let aid = parseInt(url.searchParams.get("aid")) || 68836859;
let part = parseInt(url.searchParams.get("p")) || 1;

PageElement.register();

httpget(`repo/${aid}/info.json`, content => {
    let video = JSON.parse(content).data;
    document.title = video.title;

    let index = null;
    for (let [i, page] of video.pages.entries()) {
        if (page.page == part) {
            index = i;
            break;
        }
    }

    let playlist = new Playlist();
    playlist.items = video.pages.map((page: BilibiliPage) => new PlaylistItem(video, page));

    render(html`<page-element .playlist=${playlist} .playindex=${index}></page-element>`, document.body);
});