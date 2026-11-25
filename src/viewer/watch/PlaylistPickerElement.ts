import {css, html, LitElement} from "lit";
import {customElement, property, state} from "lit/decorators.js";
import type {PlaylistDB, VideoParts} from "../../server/storage/dbTypes";

@customElement("playlistpicker-element")
export class PlaylistPickerElement extends LitElement {
    @property({attribute: false})
    video: VideoParts;
    @property({attribute: false})
    allPlaylists: PlaylistDB[] = [];
    @property({attribute: false})
    videoPlaylistIds: Set<number> = new Set();
    @property({type: Boolean})
    loading: boolean = false;
    @property({attribute: false})
    onToggle: (playlist: PlaylistDB, add: boolean) => Promise<void>;
    @property({attribute: false})
    onCreateAndAdd: (title: string) => Promise<void>;
    @property({attribute: false})
    onClose: () => void;

    @state()
    private pendingPids: Set<number> = new Set();
    @state()
    private newTitle: string = "";
    @state()
    private creating: boolean = false;

    private handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape") {
            e.preventDefault();
            if (this.onClose) this.onClose();
        }
    };

    connectedCallback(): void {
        super.connectedCallback();
        window.addEventListener("keydown", this.handleKeyDown);
    }

    disconnectedCallback(): void {
        super.disconnectedCallback();
        window.removeEventListener("keydown", this.handleKeyDown);
    }

    private async handleToggle(playlist: PlaylistDB, checked: boolean) {
        if (!this.onToggle || this.pendingPids.has(playlist.pid)) return;
        const nextPending = new Set(this.pendingPids);
        nextPending.add(playlist.pid);
        this.pendingPids = nextPending;
        try {
            await this.onToggle(playlist, checked);
        } finally {
            const after = new Set(this.pendingPids);
            after.delete(playlist.pid);
            this.pendingPids = after;
        }
    }

    private async handleCreate() {
        const title = this.newTitle.trim();
        if (!title || this.creating || !this.onCreateAndAdd) return;
        this.creating = true;
        try {
            await this.onCreateAndAdd(title);
            this.newTitle = "";
        } finally {
            this.creating = false;
        }
    }

    private onCreateKeyDown(e: KeyboardEvent) {
        if (e.key === "Enter") {
            e.preventDefault();
            this.handleCreate();
        }
    }

    render() {
        const playlists = this.allPlaylists || [];
        return html`
            <div class="picker">
                <div class="picker-header">
                    <span class="picker-title">加入播放列表</span>
                    <button type="button" class="close-btn" aria-label="关闭" title="关闭" @click=${() => this.onClose && this.onClose()}>✕</button>
                </div>
                <div class="picker-body">
                    ${this.loading && playlists.length === 0 ? html`
                        <div class="status">正在加载播放列表…</div>
                    ` : playlists.length === 0 ? html`
                        <div class="status">暂无播放列表，可在下方新建。</div>
                    ` : playlists.map(playlist => {
                        const checked = this.videoPlaylistIds.has(playlist.pid);
                        const pending = this.pendingPids.has(playlist.pid);
                        const count = playlist.videosAid ? playlist.videosAid.length : 0;
                        return html`
                            <div class="playlist-item">
                                <label class="playlist-row">
                                    <input type="checkbox"
                                        .checked=${checked}
                                        ?disabled=${pending}
                                        @change=${(e: Event) => this.handleToggle(playlist, (e.target as HTMLInputElement).checked)} />
                                    <span class="playlist-title" title=${playlist.title}>${playlist.title}</span>
                                    <span class="playlist-count">${count}</span>
                                </label>
                                <a class="open-link"
                                    href="index.html?type=3&pid=${playlist.pid}"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    title="管理播放列表">↗</a>
                            </div>
                        `;
                    })}
                </div>
                <div class="picker-footer">
                    <input class="new-input"
                        placeholder="新建列表名称"
                        .value=${this.newTitle}
                        ?disabled=${this.creating}
                        @input=${(e: Event) => this.newTitle = (e.target as HTMLInputElement).value}
                        @keydown=${(e: KeyboardEvent) => this.onCreateKeyDown(e)} />
                    <button type="button"
                        class="create-btn"
                        ?disabled=${!this.newTitle.trim() || this.creating}
                        @click=${() => this.handleCreate()}>${this.creating ? "创建中…" : "新建"}</button>
                </div>
            </div>
        `;
    }

    static styles = css`
        :host {
            position: absolute;
            inset: 0;
            z-index: 10;
            display: block;
            background: var(--surface, #fff);
        }
        .picker {
            display: flex;
            flex-direction: column;
            width: 100%;
            height: 100%;
            min-height: 0;
        }
        .picker-header {
            flex: 0 0 42px;
            box-sizing: border-box;
            height: 42px;
            padding: 0 12px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            border-bottom: 1px solid var(--border, #dfe4ec);
            background: var(--surface-subtle, #f8fafc);
        }
        .picker-title {
            color: var(--text, #172033);
            font-size: 13px;
            font-weight: 600;
        }
        .close-btn {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: 26px;
            height: 26px;
            padding: 0;
            border: 1px solid transparent;
            border-radius: 6px;
            background: transparent;
            color: var(--muted, #667085);
            font: inherit;
            font-size: 14px;
            cursor: pointer;
            transition: background-color .15s ease, color .15s ease;
        }
        .close-btn:hover {
            background: #e2e8f0;
            color: var(--text, #172033);
        }
        .picker-body {
            flex: 1;
            min-height: 0;
            padding: 6px;
            overflow-y: auto;
            overflow-x: hidden;
            scrollbar-width: thin;
            scrollbar-color: #cbd5e1 transparent;
        }
        .playlist-item {
            display: flex;
            align-items: center;
            gap: 4px;
            border-radius: 7px;
            transition: background-color .12s ease;
        }
        .playlist-item:hover {
            background: #f8fafc;
        }
        .playlist-row {
            flex: 1;
            min-width: 0;
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 8px 6px 8px 8px;
            cursor: pointer;
            user-select: none;
        }
        .playlist-row input[type="checkbox"] {
            flex-shrink: 0;
            width: 15px;
            height: 15px;
            margin: 0;
            accent-color: var(--primary, #2563eb);
            cursor: pointer;
        }
        .playlist-title {
            flex: 1;
            min-width: 0;
            overflow: hidden;
            color: #344054;
            font-size: 13px;
            text-overflow: ellipsis;
            white-space: nowrap;
        }
        .playlist-count {
            flex-shrink: 0;
            color: var(--muted, #667085);
            font-size: 12px;
            font-variant-numeric: tabular-nums;
        }
        .open-link {
            flex-shrink: 0;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: 26px;
            height: 26px;
            margin-right: 4px;
            border-radius: 6px;
            color: var(--muted, #667085);
            font-size: 13px;
            text-decoration: none;
            transition: background-color .12s ease, color .12s ease;
        }
        .open-link:hover {
            background: #eaf1ff;
            color: var(--primary, #2563eb);
        }
        .picker-footer {
            flex: 0 0 auto;
            padding: 10px 12px;
            display: flex;
            align-items: center;
            gap: 6px;
            border-top: 1px solid var(--border, #dfe4ec);
            background: var(--surface-subtle, #f8fafc);
        }
        .new-input {
            box-sizing: border-box;
            flex: 1;
            min-width: 0;
            height: 32px;
            padding: 0 9px;
            border: 1px solid #d0d5dd;
            border-radius: 7px;
            background: #fff;
            color: var(--text, #172033);
            font: inherit;
            font-size: 13px;
            outline: none;
        }
        .new-input:focus {
            border-color: var(--primary, #2563eb);
            box-shadow: 0 0 0 3px rgba(37, 99, 235, .12);
        }
        .create-btn {
            box-sizing: border-box;
            flex-shrink: 0;
            height: 32px;
            padding: 0 11px;
            border: 1px solid var(--primary, #2563eb);
            border-radius: 7px;
            background: var(--primary, #2563eb);
            color: #fff;
            font: inherit;
            font-size: 12px;
            white-space: nowrap;
            cursor: pointer;
            transition: background-color .15s ease;
        }
        .create-btn:hover:not(:disabled) {
            background: #1d4ed8;
        }
        .create-btn:disabled {
            opacity: .45;
            cursor: default;
        }
        .status {
            padding: 40px 16px;
            color: var(--muted, #667085);
            font-size: 13px;
            text-align: center;
        }
    `;
}
