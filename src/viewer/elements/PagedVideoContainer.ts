import {customElement, html, LitElement, property} from "lit-element";
import { PlaylistDB, VideoDB } from '../../server/storage/dbTypes';
import "./VideoBlockElement";
import {PagedContainer} from "./PagedContainer";
import {repeat} from "lit-html/directives/repeat";
import {ClientApis} from "../common/api/ClientApi";

@customElement('videolist-element')
export class VideoListElement extends LitElement {

    @property()
    videos: VideoDB[];

    @property()
    params: { key: string, value: number }[];

    createRenderRoot() {
        return this;
    }

    render() {
        return html`
            <ul style="padding: 0; margin: 0 -16px;">
                ${repeat(this.videos, (video: VideoDB) => html`<videoblock-element .video=${video} .params=${this.params}></videoblock-element>`)}
            </ul>
        `;
    }

}

@customElement('pagedvideo-container')
export class PagedVideoContainer extends PagedContainer<VideoDB> {

    @property()
    params: { key: string, value: number }[];

    protected firstUpdated(_changedProperties: Map<PropertyKey, unknown>) {
        super.firstUpdated(_changedProperties);

        ClientApis.ListAllPlaylists.fetch({}).then(all => {
            this.allPlaylists = all;
        });
    }

    private openRandom() {
        ClientApis.GetVideoRandom.fetch({}).then(video => {
            window.open(`watch.html?aid=${video.aid}`, '_blank');
        });
    }

    @property()
    private allPlaylists: PlaylistDB[] = [];

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
            let to_add: number[] = [];
            for (let video of videos) {
                playlist.videosAid = playlist.videosAid.filter(aid => aid !== video.aid);
                playlist.videosAid.push(video.aid);
                to_add.push(video.aid);
            }
            console.log("to add:", to_add);
            if (to_add.length > 0) {
                ClientApis.UpdatePlaylist.fetch(playlist.pid, { title: undefined, add: to_add }).then(_playlist => {
                    this.selectedAdd = undefined;
                    this.elementAdd.selectedIndex = 0;
                });
            }
        }
    }

    constructor() {
        super();
        super.rightRenderer = list => html`
            <button style="float: right;" @click=${() => this.openRandom()}>随机视频</button>
            
            <span style="float: right; margin-right: 20px;">
                <select @change=${(e: Event) => this.selectAdd(e)}>
                    <option>(共${this.allPlaylists.length}个列表)</option>
                    ${repeat(this.allPlaylists, (playlist: PlaylistDB) => html`
                        <option>${playlist.title}</option>
                    `)}
                </select>
                <button @click=${() => this.addAllToPlaylist(list.result)}>全部添加到列表</button>
            </span>
        `;
        super.listRenderer = list => html`<videolist-element .videos=${list.result} .params=${this.params}></videolist-element>`;
    }

}
