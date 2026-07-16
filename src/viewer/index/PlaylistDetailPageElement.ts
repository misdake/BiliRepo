import {css, html, LitElement, type PropertyValues} from "lit";
import {customElement, property, state} from "lit/decorators.js";
import type {PlaylistVideos} from "../../server/storage/dbTypes";
import {ClientApis, showRequestError} from "../common/api/ClientApi";
import "../elements/InputElement";
import "../elements/PlaylistEditorElement";

@customElement("playlist-detail-page-element")
export class PlaylistDetailPageElement extends LitElement {
    @property({type: Number})
    pid: number;

    @state()
    private playlist: PlaylistVideos;
    @state()
    private loading: boolean = true;
    @state()
    private error: string = "";

    private loadId: number = 0;

    protected updated(changedProperties: PropertyValues): void {
        if (changedProperties.has("pid")) this.loadPlaylist();
    }

    private async loadPlaylist() {
        const loadId = ++this.loadId;
        this.loading = true;
        this.error = "";
        try {
            const playlist = await ClientApis.GetPlaylistVideos.fetch(this.pid);
            if (loadId !== this.loadId) return;
            if (!playlist) throw new Error("没有找到该播放列表");
            this.playlist = playlist;
            document.title = playlist.title;
        } catch (error) {
            if (loadId !== this.loadId) return;
            this.error = error instanceof Error ? error.message : String(error);
        } finally {
            if (loadId === this.loadId) this.loading = false;
        }
    }

    private async renamePlaylist(input: string) {
        const title = input.trim();
        if (!title || title === this.playlist.title) return;
        try {
            const updated = await ClientApis.UpdatePlaylist.fetch(this.pid, {title});
            this.playlist = {...this.playlist, title: updated.title};
            document.title = updated.title;
        } catch (error) {
            showRequestError("更新播放列表名称", error);
        }
    }

    private async removePlaylist() {
        if (!confirm(`确认删除列表 ${this.playlist.title} ?`)) return;
        try {
            await ClientApis.RemovePlaylist.fetch(this.playlist.pid);
            window.location.assign("index.html?type=3");
        } catch (error) {
            showRequestError("删除播放列表", error);
        }
    }

    render() {
        if (this.loading) return html`<div class="status">正在加载播放列表…</div>`;
        if (this.error) return html`
            <div class="status error">加载播放列表失败：${this.error}
                <button @click=${() => this.loadPlaylist()}>重试</button>
                <a href="index.html?type=3">返回播放列表</a>
            </div>`;

        return html`
            <div class="detail-header">
                <div class="heading">
                    <a class="back" href="index.html?type=3">← 返回播放列表</a>
                    <h1>${this.playlist.title}</h1>
                </div>
                <div class="detail-actions">
                    <input-element .placeholder=${"新的播放列表名称"} .input=${this.playlist.title} .buttonText=${"更新名称"} .checkInput=${(input: string) => this.renamePlaylist(input)}></input-element>
                    <button class="danger" @click=${() => this.removePlaylist()}>删除列表</button>
                </div>
            </div>
            <div class="hint">可拖拽排序，所有编辑操作始终显示。</div>
            <playlist-editor-element .playlist=${this.playlist}></playlist-editor-element>
        `;
    }

    static styles = css`
        :host { display: block; }
        .detail-header {
            min-height: 44px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 20px;
        }
        .heading, .detail-actions {
            min-width: 0;
            display: flex;
            align-items: center;
            gap: 10px;
        }
        h1 {
            margin: 0;
            overflow: hidden;
            color: #172033;
            font-size: 20px;
            line-height: 1.25;
            text-overflow: ellipsis;
            white-space: nowrap;
        }
        a { text-decoration: none; }
        .back, button.danger {
            box-sizing: border-box;
            min-height: 34px;
            padding: 7px 11px;
            border: 1px solid #d0d5dd;
            border-radius: 8px;
            background: #fff;
            color: #475467;
            font: inherit;
            white-space: nowrap;
            cursor: pointer;
        }
        .back:hover { border-color: #98a2b3; color: #2563eb; }
        button.danger { border-color: #f4c7c3; color: #b42318; }
        .hint {
            margin: 4px 0 10px;
            color: #667085;
            font-size: 13px;
        }
        .status {
            padding: 54px 20px;
            border: 1px dashed #d0d5dd;
            border-radius: 10px;
            color: #667085;
            text-align: center;
        }
        .status.error { color: #b42318; }
        .status button, .status a { margin-left: 8px; }
    `;
}
