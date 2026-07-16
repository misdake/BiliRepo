import {html, LitElement, type PropertyValues} from "lit";
import {customElement, property, state} from "lit/decorators.js";
import type { PlaylistDB, VideoDB } from '../../server/storage/dbTypes';
import "./VideoBlockElement";
import {PagedContainer} from "./PagedContainer";
import {repeat} from "lit/directives/repeat.js";
import {ClientApis, showRequestError} from "../common/api/ClientApi";
import {mediaGridStyles} from "./MediaCardElement";

@customElement('video-grid-element')
export class VideoListElement extends LitElement {

    @property()
    videos: VideoDB[];

    @property()
    params: { key: string, value: number }[];

    render() {
        return html`
            <ul>
                ${repeat(this.videos, (video: VideoDB) => html`<videoblock-element .video=${video} .params=${this.params}></videoblock-element>`)}
            </ul>
        `;
    }

    static styles = mediaGridStyles;

}

@customElement('pagedvideo-container')
export class PagedVideoContainer extends PagedContainer<VideoDB> {

    @property()
    params: { key: string, value: number }[];

    protected firstUpdated(_changedProperties: PropertyValues) {
        super.firstUpdated(_changedProperties);

        ClientApis.ListAllPlaylists.fetch({}).then(all => {
            this.allPlaylists = all;
        }).catch(error => {
            this.allPlaylists = [];
            showRequestError("加载播放列表", error);
        });
    }

    private openRandom() {
        ClientApis.GetVideoRandom.fetch({}).then(video => {
            window.open(`watch.html?aid=${video.aid}`, '_blank');
        }).catch(error => {
            showRequestError("打开随机视频", error);
        });
    }

    @property()
    private allPlaylists: PlaylistDB[] = [];

    @state()
    private selectedAdd: PlaylistDB;
    private elementAdd: HTMLSelectElement;
    private selectAdd(e: Event) {
        let target = e.target as HTMLSelectElement;
        this.elementAdd = target;
        let index = target.selectedIndex - 1;
        if (index >= 0) {
            this.selectedAdd = this.allPlaylists[index];
        } else {
            this.selectedAdd = undefined;
        }
    }
    private addAllToPlaylist(videos: VideoDB[]) {
        let playlist = this.selectedAdd;
        if (playlist) {
            let existing = new Set(playlist.videosAid || []);
            let to_add = videos.map(video => video.aid).filter(aid => !existing.has(aid));
            if (to_add.length > 0) {
                ClientApis.UpdatePlaylist.fetch(playlist.pid, {add: to_add}).then(updatedPlaylist => {
                    playlist.videosAid = [...updatedPlaylist.videosAid];
                    this.selectedAdd = undefined;
                    this.elementAdd.selectedIndex = 0;
                }).catch(error => {
                    showRequestError("批量添加到播放列表", error);
                });
            }
        }
    }

    constructor() {
        super();
        this.rightRenderer = list => html`
            <div class="toolbar">
                <select @change=${(e: Event) => this.selectAdd(e)}>
                    <option>选择播放列表（${this.allPlaylists.length}）</option>
                    ${repeat(this.allPlaylists, (playlist: PlaylistDB) => html`
                        <option>${playlist.title}</option>
                    `)}
                </select>
                <button ?disabled=${!this.selectedAdd || list.result.length === 0} @click=${() => this.addAllToPlaylist(list.result)}>本页全部添加</button>
                <button @click=${() => this.openRandom()}>随机视频</button>
            </div>
        `;
        this.listRenderer = list => html`
            <video-grid-element .videos=${list.result} .params=${this.params}></video-grid-element>`;
    }

}
