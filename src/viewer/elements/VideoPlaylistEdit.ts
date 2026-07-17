import {css, html, LitElement, type PropertyValues} from "lit";
import {customElement, property, state} from "lit/decorators.js";
import {PlaylistDB, VideoDB} from "../../server/storage/dbTypes";
import {ClientApis, showRequestError} from "../common/api/ClientApi";
import {LatestRequest} from "../common/LatestRequest";
import {repeat} from "lit/directives/repeat.js";

@customElement('videoplaylistedit-element')
export class VideoPlaylistEditElement extends LitElement {

    @property()
    video: VideoDB;
    @property()
    videoPlaylists: PlaylistDB[] = [];
    @property()
    allPlaylists: PlaylistDB[] = [];

    protected updated(changedProperties: PropertyValues): void {
        super.updated(changedProperties);
        if (changedProperties.has("video")) {
            this.load();
        }
    }

    private loadGuard: LatestRequest = new LatestRequest();

    private load() {
        const token = this.loadGuard.begin();
        ClientApis.GetVideoPlaylists.fetch(this.video.aid).then(playlists => {
            if (!this.loadGuard.isCurrent(token)) return;
            this.videoPlaylists = playlists;
        }).catch(error => {
            if (!this.loadGuard.isCurrent(token)) return;
            showRequestError("加载视频所属播放列表", error);
        });
        ClientApis.ListAllPlaylists.fetch({}).then(all => {
            if (!this.loadGuard.isCurrent(token)) return;
            this.allPlaylists = all;
        }).catch(error => {
            if (!this.loadGuard.isCurrent(token)) return;
            showRequestError("加载播放列表", error);
        });
    }

    @state()
    private selectedRemove: PlaylistDB;
    @state()
    private selectedAdd: PlaylistDB;

    private selectRemove(e: Event) {
        let pid = parseInt((e.target as HTMLSelectElement).value);
        this.selectedRemove = this.videoPlaylists.find(playlist => playlist.pid === pid);
    }
    private selectAdd(e: Event) {
        let pid = parseInt((e.target as HTMLSelectElement).value);
        this.selectedAdd = this.allPlaylists.find(playlist => playlist.pid === pid);
    }
    private jumpFromPlaylist() {
        let playlist = this.selectedRemove;
        if (playlist) {
            window.open(`index.html?type=3&pid=${playlist.pid}`, "_blank");
        }
    }
    private removeFromPlaylist() {
        let playlist = this.selectedRemove;
        if (playlist) {
            ClientApis.UpdatePlaylist.fetch(playlist.pid, {remove: [this.video.aid]}).then(updatedPlaylist => {
                // replace local entries with the server-returned playlist
                this.allPlaylists = this.allPlaylists.map(p => p.pid === playlist.pid ? updatedPlaylist : p);
                this.videoPlaylists = this.videoPlaylists.filter(p => p.pid !== playlist.pid);
                this.selectedRemove = undefined;
            }).catch(error => {
                showRequestError("从播放列表删除", error);
            });
        }
    }
    private addToPlaylist() {
        let playlist = this.selectedAdd;
        if (playlist) {
            ClientApis.UpdatePlaylist.fetch(playlist.pid, {add: [this.video.aid]}).then(updatedPlaylist => {
                // replace local entries with the server-returned playlist
                this.allPlaylists = this.allPlaylists.map(p => p.pid === playlist.pid ? updatedPlaylist : p);
                this.videoPlaylists = [...this.videoPlaylists.filter(p => p.pid !== playlist.pid), updatedPlaylist];
                this.selectedAdd = undefined;
            }).catch(error => {
                showRequestError("添加到播放列表", error);
            });
        }
    }

    render() {
        return html`
            <section>
                <h4>播放列表</h4>
                <p>当前视频所在列表</p>
                <div class="action-row">
                <select .value=${this.selectedRemove ? `${this.selectedRemove.pid}` : ""} @change=${(e: Event) => this.selectRemove(e)}>
                    <option value="">(在${this.videoPlaylists.length}个列表中)</option>
                    ${repeat(this.videoPlaylists, (playlist: PlaylistDB) => html`
                        <option value=${playlist.pid}>${playlist.title}</option>
                    `)}
                </select>
                <button ?disabled=${!this.selectedRemove} @click=${() => this.jumpFromPlaylist()}>打开</button>
                <button class="danger" ?disabled=${!this.selectedRemove} @click=${() => this.removeFromPlaylist()}>移除</button>
                </div>
                <p>添加到其他列表</p>
                <div class="action-row">
                <select .value=${this.selectedAdd ? `${this.selectedAdd.pid}` : ""} @change=${(e: Event) => this.selectAdd(e)}>
                    <option value="">(共${this.allPlaylists.length}个列表)</option>
                    ${repeat(this.allPlaylists, (playlist: PlaylistDB) => html`
                        <option value=${playlist.pid}>${playlist.title}</option>
                    `)}
                </select>
                <button ?disabled=${!this.selectedAdd} @click=${() => this.addToPlaylist()}>添加</button>
                </div>
            </section>
        `;
    }

    static styles = css`
        :host { display: block; color: #344054; }
        section {
            padding: 10px;
            border: 1px solid #e4e7ec;
            border-radius: 8px;
            background: #f8fafc;
        }
        h4 { margin: 0 0 10px; color: #172033; }
        p { margin: 10px 0 5px; color: #667085; font-size: 12px; }
        .action-row { display: flex; align-items: center; gap: 5px; }
        select {
            min-width: 0;
            flex: 1;
            height: 32px;
            border: 1px solid #d0d5dd;
            border-radius: 6px;
            background: #fff;
            color: #344054;
        }
        button {
            height: 32px;
            padding: 5px 8px;
            border: 1px solid #d0d5dd;
            border-radius: 6px;
            background: #fff;
            color: #344054;
            cursor: pointer;
        }
        button.danger { color: #b42318; }
        button:disabled { opacity: .45; cursor: default; }
    `;

}
