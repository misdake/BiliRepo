import {css, html, LitElement, type PropertyValues} from "lit";
import {customElement, property, state} from "lit/decorators.js";
import {PlaylistVideos, VideoDB} from "../../server/storage/dbTypes";
import {ClientApis} from "../common/api/ClientApi";

@customElement("playlist-editor-element")
export class PlaylistEditorElement extends LitElement {
    @property({attribute: false})
    playlist: PlaylistVideos;

    @state()
    private videos: VideoDB[] = [];
    @state()
    private originalAids: number[] = [];
    @state()
    private saving: boolean = false;
    @state()
    private message: string = "";
    @state()
    private dropTargetAid: number | undefined;
    @state()
    private dropAfter: boolean = false;

    private loadedPid: number | undefined;
    private draggedAid: number | undefined;

    protected willUpdate(changedProperties: PropertyValues): void {
        if (changedProperties.has("playlist") && this.playlist && this.loadedPid !== this.playlist.pid) {
            this.loadedPid = this.playlist.pid;
            this.videos = [...(this.playlist.videos || [])];
            this.originalAids = this.videos.map(video => video.aid);
            this.message = "";
        }
    }

    private get dirty() {
        let current = this.videos.map(video => video.aid);
        return current.length !== this.originalAids.length || current.some((aid, index) => aid !== this.originalAids[index]);
    }

    private pinVideo(aid: number) {
        let index = this.videos.findIndex(video => video.aid === aid);
        if (index <= 0) return;
        let next = [...this.videos];
        let [video] = next.splice(index, 1);
        next.unshift(video);
        this.videos = next;
        this.message = "顺序尚未保存";
    }

    private removeVideo(aid: number) {
        this.videos = this.videos.filter(video => video.aid !== aid);
        this.message = "修改尚未保存";
    }

    private reset() {
        if (!this.playlist) return;
        let videoMap = new Map((this.playlist.videos || []).map(video => [video.aid, video]));
        this.videos = this.originalAids.map(aid => videoMap.get(aid)).filter((video): video is VideoDB => video !== undefined);
        this.message = "已撤销未保存的修改";
    }

    private beginDrag(event: DragEvent, aid: number) {
        this.draggedAid = aid;
        event.dataTransfer!.effectAllowed = "move";
        event.dataTransfer!.setData("text/plain", String(aid));
    }

    private updateDropTarget(event: DragEvent, aid: number) {
        event.preventDefault();
        if (this.draggedAid === undefined || this.draggedAid === aid) return;
        let rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
        this.dropTargetAid = aid;
        this.dropAfter = event.clientY >= rect.top + rect.height / 2;
        if (event.dataTransfer) event.dataTransfer.dropEffect = "move";
    }

    private dropVideo(event: DragEvent, targetAid: number) {
        event.preventDefault();
        let sourceAid = this.draggedAid;
        let after = this.dropAfter;
        this.endDrag();
        if (sourceAid === undefined || sourceAid === targetAid) return;

        let next = [...this.videos];
        let sourceIndex = next.findIndex(video => video.aid === sourceAid);
        if (sourceIndex < 0) return;
        let [source] = next.splice(sourceIndex, 1);
        let targetIndex = next.findIndex(video => video.aid === targetAid);
        if (targetIndex < 0) return;
        next.splice(targetIndex + (after ? 1 : 0), 0, source);
        this.videos = next;
        this.message = "顺序尚未保存";
    }

    private endDrag() {
        this.draggedAid = undefined;
        this.dropTargetAid = undefined;
        this.dropAfter = false;
    }

    private async save() {
        if (!this.playlist || !this.dirty || this.saving) return;
        this.saving = true;
        this.message = "正在保存…";

        let order = this.videos.map(video => video.aid);
        let currentSet = new Set(order);
        let remove = this.originalAids.filter(aid => !currentSet.has(aid));
        try {
            let updated = await ClientApis.UpdatePlaylist.fetch(this.playlist.pid, {order, remove});
            let persistedOrder = updated && updated.videosAid ? updated.videosAid : order;
            let videoMap = new Map(this.videos.map(video => [video.aid, video]));
            this.videos = persistedOrder.map(aid => videoMap.get(aid)).filter((video): video is VideoDB => video !== undefined);
            this.originalAids = [...persistedOrder];
            this.playlist.videosAid = [...persistedOrder];
            this.playlist.videos = [...this.videos];
            this.message = "已保存";
        } catch (error) {
            let message = error instanceof Error ? error.message : String(error);
            this.message = `保存失败：${message}`;
        } finally {
            this.saving = false;
        }
    }

    private formatDate(ctime: number) {
        if (!ctime) return "时间未知";
        return new Date(ctime * 1000).toLocaleDateString("zh-CN");
    }

    render() {
        if (!this.playlist) return html``;

        return html`
            <section class="editor">
                <div class="editor-header">
                    <div>
                        <strong>${this.videos.length}</strong> 个视频
                        <span class="hint">拖动左侧把手调整顺序，或直接置顶；修改后统一保存。</span>
                    </div>
                    <div class="editor-actions">
                        <span class="message ${this.message.startsWith("保存失败") ? "error" : ""}">${this.message}</span>
                        <button class="secondary" ?disabled=${!this.dirty || this.saving} @click=${() => this.reset()}>撤销</button>
                        <button class="primary" ?disabled=${!this.dirty || this.saving} @click=${() => this.save()}>${this.saving ? "保存中…" : "保存顺序"}</button>
                    </div>
                </div>

                ${this.videos.length === 0 ? html`
                    <div class="empty">播放列表中还没有视频。</div>
                ` : html`
                    <ol class="video-list">
                        ${this.videos.map((video, index) => {
                            let dropClass = this.dropTargetAid === video.aid ? (this.dropAfter ? "drop-after" : "drop-before") : "";
                            return html`
                                <li class="video-row ${dropClass}"
                                    @dragover=${(event: DragEvent) => this.updateDropTarget(event, video.aid)}
                                    @drop=${(event: DragEvent) => this.dropVideo(event, video.aid)}>
                                    <span class="position">${index + 1}</span>
                                    <span class="drag-handle" title="拖动排序" .draggable=${true}
                                        @dragstart=${(event: DragEvent) => this.beginDrag(event, video.aid)}
                                        @dragend=${() => this.endDrag()}>⋮⋮</span>
                                    <a class="thumb-link" href=${`watch.html?pid=${this.playlist.pid}&aid=${video.aid}`}>
                                        <img src="${serverConfig.repoRoot}repo/${video.aid}/thumb.jpg" alt=""/>
                                    </a>
                                    <div class="video-info">
                                        <a class="title" href=${`watch.html?pid=${this.playlist.pid}&aid=${video.aid}`}>${video.title}</a>
                                        <span class="meta">AV${video.aid} · ${this.formatDate(video.ctime)}</span>
                                    </div>
                                    <div class="row-actions">
                                        <a class="button-link" href=${`watch.html?pid=${this.playlist.pid}&aid=${video.aid}`}>播放</a>
                                        <button ?disabled=${index === 0} @click=${() => this.pinVideo(video.aid)}>置顶</button>
                                        <button class="danger" @click=${() => this.removeVideo(video.aid)}>移除</button>
                                    </div>
                                </li>
                            `;
                        })}
                    </ol>
                `}
            </section>
        `;
    }

    static styles = css`
        :host {
            display: block;
            color: var(--text, #172033);
        }
        .editor {
            border: 1px solid var(--border, #dfe4ec);
            border-radius: 12px;
            background: #fff;
            overflow: hidden;
        }
        .editor-header {
            min-height: 42px;
            padding: 14px 16px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 20px;
            border-bottom: 1px solid var(--border, #dfe4ec);
            background: #f8fafc;
        }
        .hint {
            margin-left: 10px;
            color: var(--muted, #667085);
            font-size: 13px;
        }
        .editor-actions, .row-actions {
            display: flex;
            align-items: center;
            gap: 8px;
        }
        .message {
            color: var(--muted, #667085);
            font-size: 13px;
            min-width: 76px;
            text-align: right;
        }
        .message.error {
            color: #b42318;
        }
        button, .button-link {
            box-sizing: border-box;
            min-height: 34px;
            padding: 7px 12px;
            border: 1px solid #cfd6e3;
            border-radius: 7px;
            background: #fff;
            color: #344054;
            font: inherit;
            font-size: 13px;
            line-height: 18px;
            text-decoration: none;
            cursor: pointer;
        }
        button:hover:not(:disabled), .button-link:hover {
            border-color: #98a2b3;
            background: #f8fafc;
        }
        button:disabled {
            cursor: default;
            opacity: .45;
        }
        button.primary {
            border-color: #2563eb;
            background: #2563eb;
            color: #fff;
        }
        button.danger {
            color: #b42318;
        }
        .video-list {
            list-style: none;
            padding: 0;
            margin: 0;
        }
        .video-row {
            position: relative;
            display: grid;
            grid-template-columns: 38px 28px 144px minmax(0, 1fr) auto;
            align-items: center;
            gap: 14px;
            min-height: 92px;
            padding: 12px 16px;
            border-bottom: 1px solid #edf0f5;
        }
        .video-row:last-child {
            border-bottom: 0;
        }
        .video-row:hover {
            background: #fbfcfe;
        }
        .video-row.drop-before::before, .video-row.drop-after::after {
            content: "";
            position: absolute;
            left: 12px;
            right: 12px;
            height: 3px;
            border-radius: 3px;
            background: #2563eb;
        }
        .video-row.drop-before::before { top: -2px; }
        .video-row.drop-after::after { bottom: -2px; }
        .position {
            color: #98a2b3;
            text-align: right;
            font-variant-numeric: tabular-nums;
        }
        .drag-handle {
            color: #667085;
            font-size: 21px;
            cursor: grab;
            user-select: none;
        }
        .drag-handle:active { cursor: grabbing; }
        .thumb-link, img {
            display: block;
            width: 144px;
            height: 81px;
        }
        img {
            border-radius: 7px;
            object-fit: cover;
            background: #eef1f5;
        }
        .video-info {
            min-width: 0;
            display: flex;
            flex-direction: column;
            gap: 8px;
        }
        .title {
            overflow: hidden;
            color: #172033;
            font-weight: 600;
            line-height: 1.45;
            text-decoration: none;
            text-overflow: ellipsis;
            white-space: nowrap;
        }
        .title:hover { color: #2563eb; }
        .meta {
            color: #98a2b3;
            font-size: 12px;
        }
        .empty {
            padding: 54px 20px;
            color: var(--muted, #667085);
            text-align: center;
        }
    `;
}
