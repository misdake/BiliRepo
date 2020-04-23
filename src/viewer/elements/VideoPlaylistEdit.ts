import {customElement, html, LitElement, property} from "lit-element";
import {PlaylistDB, VideoDB} from "../../server/storage/dbTypes";
import {ClientApis} from "../common/api/ClientApi";
import {repeat} from "lit-html/directives/repeat";

@customElement('videoplaylistedit-element')
export class VideoPlaylistEditElement extends LitElement {

    @property()
    video: VideoDB;
    @property()
    videoPlaylists: PlaylistDB[] = [];
    @property()
    allPlaylists: PlaylistDB[] = [];

    protected firstUpdated(_changedProperties: Map<PropertyKey, unknown>): void {
        ClientApis.GetVideoPlaylists.fetch(this.video.aid).then(playlists => {
            this.videoPlaylists = playlists;
        });
        ClientApis.ListPlaylist.fetch(1).then(paged => { //TODO page?
            this.allPlaylists = paged.result; //TODO hide videoPlaylists options?
        });
    }

    private selectedRemove: PlaylistDB;
    private selectedAdd: PlaylistDB;

    private elementRemove: HTMLSelectElement;
    private elementAdd: HTMLSelectElement;

    private selectRemove(e: Event) {
        let target = e.target as HTMLSelectElement;
        this.elementRemove = target;
        let index = target.selectedIndex - 1;
        if (index >= 0) {
            console.log(this.videoPlaylists[index]);
            this.selectedRemove = this.videoPlaylists[index];
        } else {
            this.selectedRemove = undefined;
        }
    }
    private selectAdd(e: Event) {
        let target = e.target as HTMLSelectElement;
        this.elementAdd = target;
        let index = target.selectedIndex - 1;
        if (index >= 0) {
            console.log(this.allPlaylists[index]);
            this.selectedAdd = this.allPlaylists[index];
        } else {
            this.selectedAdd = undefined;
        }
    }
    private jumpFromPlaylist() {
        let playlist = this.selectedRemove;
        if (playlist) {
            window.open(`playlist.html?pid=${playlist.pid}`, "_blank");
        }
    }
    private removeFromPlaylist() {
        let playlist = this.selectedRemove;
        if (playlist) {
            playlist.videosAid = playlist.videosAid.filter(aid => aid !== this.video.aid);
            ClientApis.UpdatePlaylist.fetch(playlist.pid, {title: undefined, remove: [this.video.aid]}).then(_playlist => {
                this.videoPlaylists = this.videoPlaylists.filter(p => p.pid !== playlist.pid);
                this.selectedRemove = undefined;
                this.elementRemove.selectedIndex = 0;
            });
        }
    }
    private addToPlaylist() {
        let playlist = this.selectedAdd;
        if (playlist) {
            playlist.videosAid = playlist.videosAid.filter(aid => aid !== this.video.aid);
            playlist.videosAid.push(this.video.aid);
            ClientApis.UpdatePlaylist.fetch(playlist.pid, {title: undefined, add: [this.video.aid]}).then(_playlist => {
                let newArray = this.videoPlaylists.filter(p => p.pid !== playlist.pid);
                newArray.push(playlist);
                this.videoPlaylists = newArray;
                this.selectedAdd = undefined;
                this.elementAdd.selectedIndex = 0;
            });
        }
    }

    render() {
        return html`
            <span>播放列表</span>
            <span style="border: 1px gray solid; padding: 2px; margin: 2px;">
                <select @change=${(e: Event) => this.selectRemove(e)}>
                    <option>(在${this.videoPlaylists.length}个列表中)</option>
                    ${repeat(this.videoPlaylists, (playlist: PlaylistDB) => html`
                        <option>${playlist.title}</option>
                    `)}
                </select>
                <button @click=${() => this.jumpFromPlaylist()}>跳转</button>
                <button @click=${() => this.removeFromPlaylist()}>删除</button>
            </span>
            <span style="border: 1px gray solid; padding: 2px; margin: 2px;">
                <select @change=${(e: Event) => this.selectAdd(e)}>
                    <option>(共${this.allPlaylists.length}个列表)</option>
                    ${repeat(this.allPlaylists, (playlist: PlaylistDB) => html`
                        <option>${playlist.title}</option>
                    `)}
                </select>
                <button @click=${() => this.addToPlaylist()}>添加</button>
            </span>
        `;
    }

}
