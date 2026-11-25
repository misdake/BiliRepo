import {css, html, LitElement, type PropertyValues} from "lit";
import {customElement, property, state} from "lit/decorators.js";
import type {PlaylistVideos, VideoDB} from "../../server/storage/dbTypes";
import {ClientApis, showRequestError} from "../common/api/ClientApi";
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
    @state()
    private editingTitle: boolean = false;
    @state()
    private titleDraft: string = "";
    @state()
    private renaming: boolean = false;

    private loadId: number = 0;

    protected updated(changedProperties: PropertyValues): void {
        if (changedProperties.has("pid")) this.loadPlaylist();
    }

    private async loadPlaylist() {
        const loadId = ++this.loadId;
        this.loading = true;
        this.error = "";
        this.editingTitle = false;
        this.titleDraft = "";
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

    private async startRename() {
        if (!this.playlist) return;
        this.titleDraft = this.playlist.title;
        this.editingTitle = true;
        await this.updateComplete;
        const input = this.shadowRoot?.querySelector<HTMLInputElement>(".title-input");
        if (input) {
            input.focus();
            input.select();
        }
    }

    private cancelRename() {
        if (this.renaming) return;
        this.editingTitle = false;
        this.titleDraft = "";
    }

    private async commitRename() {
        if (!this.playlist || this.renaming) return;
        const title = this.titleDraft.trim();
        if (!title || title === this.playlist.title) {
            this.editingTitle = false;
            return;
        }
        this.renaming = true;
        try {
            const updated = await ClientApis.UpdatePlaylist.fetch(this.pid, {title});
            this.playlist = {...this.playlist, title: updated.title};
            document.title = updated.title;
            this.editingTitle = false;
        } catch (error) {
            showRequestError("更新播放列表名称", error);
        } finally {
            this.renaming = false;
        }
    }

    private onTitleKeyDown(e: KeyboardEvent) {
        if (e.key === "Enter") {
            e.preventDefault();
            this.commitRename();
        } else if (e.key === "Escape") {
            e.preventDefault();
            this.cancelRename();
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
                    ${this.editingTitle ? html`
                        <div class="title-edit">
                            <input class="title-input"
                                .value=${this.titleDraft}
                                ?disabled=${this.renaming}
                                aria-label="播放列表名称"
                                @input=${(e: Event) => this.titleDraft = (e.target as HTMLInputElement).value}
                                @keydown=${(e: KeyboardEvent) => this.onTitleKeyDown(e)} />
                            <button class="title-save" ?disabled=${this.renaming} @click=${() => this.commitRename()}>${this.renaming ? "保存中…" : "保存"}</button>
                            <button class="title-cancel" ?disabled=${this.renaming} @click=${() => this.cancelRename()}>取消</button>
                        </div>
                    ` : html`
                        <div class="title-display">
                            <h1>${this.playlist.title}</h1>
                            <button class="icon-button" title="重命名" aria-label="重命名播放列表" @click=${() => this.startRename()}>
                                <svg viewBox="0 0 24 24" aria-hidden="true">
                                    <path d="M12 20h9"></path>
                                    <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"></path>
                                </svg>
                            </button>
                        </div>
                    `}
                </div>
                <div class="detail-actions">
                    <button class="danger" @click=${() => this.removePlaylist()}>删除列表</button>
                </div>
            </div>
            <playlist-editor-element .playlist=${this.playlist} .onSaved=${(videosAid: number[], videos: VideoDB[]) => {
                this.playlist = {...this.playlist, videosAid, videos};
            }}></playlist-editor-element>
        `;
    }

    static styles = css`
        :host { display: block; }
        .detail-header {
            min-height: 44px;
            margin-bottom: 12px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 20px;
        }
        .heading {
            flex: 1;
            min-width: 0;
            display: flex;
            align-items: center;
            gap: 12px;
        }
        .detail-actions {
            flex-shrink: 0;
            display: flex;
            align-items: center;
            gap: 10px;
        }
        .title-display {
            min-width: 0;
            display: flex;
            align-items: center;
            gap: 6px;
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
        .icon-button {
            flex-shrink: 0;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: 30px;
            height: 30px;
            padding: 0;
            border: 1px solid transparent;
            border-radius: 7px;
            background: transparent;
            color: #667085;
            cursor: pointer;
            transition: background-color .15s ease, border-color .15s ease, color .15s ease;
        }
        .icon-button:hover {
            border-color: #d0d5dd;
            background: #f8fafc;
            color: #2563eb;
        }
        .icon-button svg {
            width: 16px;
            height: 16px;
            fill: none;
            stroke: currentColor;
            stroke-width: 1.8;
            stroke-linecap: round;
            stroke-linejoin: round;
        }
        .title-edit {
            flex: 1;
            min-width: 0;
            max-width: 480px;
            display: flex;
            align-items: center;
            gap: 6px;
        }
        .title-input {
            box-sizing: border-box;
            flex: 1;
            min-width: 0;
            height: 34px;
            padding: 0 10px;
            border: 1px solid #2563eb;
            border-radius: 8px;
            background: #fff;
            color: #172033;
            font: inherit;
            font-size: 16px;
            font-weight: 600;
            outline: none;
            box-shadow: 0 0 0 3px rgba(37, 99, 235, .12);
        }
        .title-save, .title-cancel {
            box-sizing: border-box;
            flex-shrink: 0;
            height: 34px;
            padding: 0 12px;
            border: 1px solid #d0d5dd;
            border-radius: 8px;
            background: #fff;
            color: #344054;
            font: inherit;
            font-size: 13px;
            white-space: nowrap;
            cursor: pointer;
        }
        .title-save {
            border-color: #2563eb;
            background: #2563eb;
            color: #fff;
        }
        .title-save:hover:not(:disabled) { background: #1d4ed8; }
        .title-cancel:hover:not(:disabled) {
            background: #f8fafc;
            border-color: #98a2b3;
        }
        .title-save:disabled, .title-cancel:disabled {
            opacity: .45;
            cursor: default;
        }
        a { text-decoration: none; }
        .back, button.danger {
            box-sizing: border-box;
            flex-shrink: 0;
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
        button.danger:hover { border-color: #e9a39d; background: #fff6f5; }
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
