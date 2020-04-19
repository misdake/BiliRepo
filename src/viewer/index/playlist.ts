import {html, render} from 'lit-html';
import "../elements/PlaylistElement";
import {PlaylistVideos} from "../../server/storage/dbTypes";
import "../elements/PagedVideoContainer";
import "../elements/GuideElement";
import {ClientApis} from "../common/api/ClientApi";

let url_string = window.location.href;
let url = new URL(url_string);
let pid = parseInt(url.searchParams.get("pid")) || 0;

const pageTemplate = (playlist: PlaylistVideos) => html`
    <div style="height: 100%; width: 1280px; max-width: 100%; margin: 0 auto;">
        <div style="margin: 20px 0; position: relative;">
            <div style="position: absolute; right: 0;"><guide-element></guide-element></div>
            <playlist-element .playlist=${playlist}></playlist-element>
        </div>
        <style>
            .header {
                margin: 10px 0;
                user-select: none;
            }
            
            .header_text {
                margin-right: 20px;
            }
        </style>
        <div class="header"><span class="header_text">共${playlist.videos.length}项</span></div>
        <videolist-element .videos=${playlist.videos}></videolist-element>
    </div>
`;

ClientApis.GetPlaylistVideos.fetch(pid).then(playlist => {
    render(pageTemplate(playlist), document.body);
});
