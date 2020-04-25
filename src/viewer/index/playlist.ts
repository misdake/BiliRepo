import {html, render} from 'lit-html';
import "../elements/PlaylistElement";
import {PlaylistDB, PlaylistVideos} from "../../server/storage/dbTypes";
import "../elements/PagedVideoContainer";
import "../elements/GuideElement";
import "../elements/InputElement";
import {ClientApis} from "../common/api/ClientApi";

let url_string = window.location.href;
let url = new URL(url_string);
let pid = parseInt(url.searchParams.get("pid")) || 0;

function renamePlaylist(playlist: PlaylistDB, newName: string) {
    ClientApis.UpdatePlaylist.fetch(pid, {title: newName.trim()}).then(playlist => {
        window.location.reload();
    });
}
function removePlaylist(playlist: PlaylistDB) {
    ClientApis.RemovePlaylist.fetch(playlist.pid).then(playlist => {
        window.location.assign("index.html?type=3");
    });
}

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
        <div class="header">
            <span class="header_text">共${playlist.videos.length}项</span>
            <button style="margin-left: 10px; float: right;" @click=${() => removePlaylist(playlist)}>删除列表</button>
            <input-element style="float: right;" .input=${""} .buttonText=${"更新名称"} .checkInput="${(input: string) => renamePlaylist(playlist, input)}" .showClearButton=${false}></input-element>
        </div>
        <videolist-element .videos=${playlist.videos} .params=${[{key: "pid", value: pid}]}></videolist-element>
    </div>
`;

ClientApis.GetPlaylistVideos.fetch(pid).then(playlist => {
    render(pageTemplate(playlist), document.body);
});
