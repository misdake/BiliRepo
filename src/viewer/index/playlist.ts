import {html, render} from 'lit/html.js';
import "../elements/PlaylistTitleElement";
import {PlaylistDB, PlaylistVideos} from "../../server/storage/dbTypes";
import "../elements/PagedVideoContainer";
import "../elements/GuideElement";
import "../elements/InputElement";
import {ClientApis, showRequestError} from "../common/api/ClientApi";
import {positiveIntegerParam} from "../common/url";

let url = new URL(window.location.href);
let pid = positiveIntegerParam(url.searchParams, "pid");

function renamePlaylist(playlist: PlaylistDB, newName: string) {
    ClientApis.UpdatePlaylist.fetch(pid, {title: newName.trim()}).then(playlist => {
        window.location.reload();
    }).catch(error => {
        showRequestError("更新播放列表名称", error);
    });
}
function removePlaylist(playlist: PlaylistDB) {
    if (confirm(`确认删除列表 ${playlist.title} ?`)) {
        ClientApis.RemovePlaylist.fetch(playlist.pid).then(playlist => {
            window.location.assign("index.html?type=3");
        }).catch(error => {
            showRequestError("删除播放列表", error);
        });
    }
}

const pageTemplate = (playlist: PlaylistVideos) => html`
    <div style="height: 100%; width: 1280px; max-width: 100%; margin: 0 auto;">
        <div style="margin: 20px 0; position: relative;">
            <div style="position: absolute; right: 0;"><guide-element></guide-element></div>
            <playlisttitle-element .playlist=${playlist}></playlisttitle-element>
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
            <input-element style="float: right;" .placeholder=${"新名称"} .input=${""} .buttonText=${"更新名称"} .checkInput="${(input: string) => renamePlaylist(playlist, input)}" .showClearButton=${false}></input-element>
        </div>
        <video-grid-element .videos=${playlist.videos} .params=${[{key: "pid", value: pid}]}></video-grid-element>
    </div>
`;

if (pid === undefined) {
    window.location.replace("index.html?type=3");
} else {
    render(html`<div style="width: 1280px; max-width: 100%; margin: 20px auto;">加载中…</div>`, document.body);
    ClientApis.GetPlaylistVideos.fetch(pid).then(playlist => {
        if (!playlist) {
            window.location.replace("index.html?type=3");
            return;
        }
        render(pageTemplate(playlist), document.body);
    }).catch(error => {
        const message = error instanceof Error ? error.message : String(error);
        render(html`<div style="width: 1280px; max-width: 100%; margin: 20px auto; color: #B00020;">加载播放列表失败：${message} <button @click=${() => window.location.reload()}>重试</button> <a href="index.html?type=3">返回播放列表</a></div>`, document.body);
    });
}
