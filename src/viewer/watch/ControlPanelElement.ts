import {css, html, LitElement, type PropertyValues, type TemplateResult} from "lit";
import {customElement, property, state} from "lit/decorators.js";
import "./PlaylistElement";
import "./TimestampEditElement";
import "./DanmakuListElement";
import "./PlaylistPickerElement";
import {Playlist} from "./Playlist";
import {PartTimestamps, PlaylistDB, Timestamp, VideoParts} from "../../server/storage/dbTypes";
import {Danmaku} from "../../server/download/Bilibili";
import {Player} from "./Player";
import {ClientApis, showRequestError} from "../common/api/ClientApi";
import {LatestRequest} from "../common/LatestRequest";
import {DanmakuPrefs, DEFAULT_DANMAKU_PREFS} from "./danmakuPrefs";

type TabId = "playlist" | "danmaku" | "timestamp" | "edit";

@customElement('controlpanel-element')
export class ControlPanelElement extends LitElement {

    @property()
    video: VideoParts;
    @property()
    partInfo: PartTimestamps;
    @property()
    player: Player;

    @property()
    playlist: Playlist;
    @property()
    playindex: number;
    @property()
    onPlayIndex: (index: number) => void;
    @property()
    onUpdateDanmaku: () => void;
    @property()
    onRedownload: () => void;
    @property()
    onDelete: () => void;
    @property()
    onTimestampsChanged: (timestamps: Timestamp[]) => void;

    @property()
    danmakuList: Danmaku[];
    @property({attribute: false})
    danmakuPrefs: DanmakuPrefs = DEFAULT_DANMAKU_PREFS;
    @property({attribute: false})
    onDanmakuPrefsChange: (prefs: DanmakuPrefs) => void;

    @state()
    private currentTab: TabId | null = null;
    @state()
    private forceShowTimestamps: boolean = false;
    @state()
    private playlistDialogOpen: boolean = false;
    @state()
    private allPlaylists: PlaylistDB[] = [];
    @state()
    private videoPlaylists: PlaylistDB[] = [];
    @state()
    private playlistsLoading: boolean = false;

    private playlistGuard: LatestRequest = new LatestRequest();

    protected updated(changedProperties: PropertyValues): void {
        super.updated(changedProperties);
        if (changedProperties.has("video")) {
            this.playlistDialogOpen = false;
            this.loadPlaylists();
        }
        if (changedProperties.has("partInfo")) {
            this.forceShowTimestamps = false;
        }
    }

    private async loadPlaylists() {
        if (!this.video) {
            this.videoPlaylists = [];
            return;
        }
        const token = this.playlistGuard.begin();
        this.playlistsLoading = true;
        try {
            const [videoPlaylists, allPlaylists] = await Promise.all([
                ClientApis.GetVideoPlaylists.fetch(this.video.aid),
                ClientApis.ListAllPlaylists.fetch({}),
            ]);
            if (!this.playlistGuard.isCurrent(token)) return;
            this.videoPlaylists = Array.isArray(videoPlaylists) ? videoPlaylists : [];
            this.allPlaylists = Array.isArray(allPlaylists) ? allPlaylists : [];
        } catch (error) {
            if (!this.playlistGuard.isCurrent(token)) return;
            showRequestError("加载播放列表", error);
        } finally {
            if (this.playlistGuard.isCurrent(token)) {
                this.playlistsLoading = false;
            }
        }
    }

    private async togglePlaylist(playlist: PlaylistDB, add: boolean) {
        if (!this.video) return;
        try {
            const updated = await ClientApis.UpdatePlaylist.fetch(
                playlist.pid,
                add ? {add: [this.video.aid]} : {remove: [this.video.aid]}
            );
            this.allPlaylists = this.allPlaylists.map(p => p.pid === playlist.pid ? updated : p);
            if (add) {
                this.videoPlaylists = [...this.videoPlaylists.filter(p => p.pid !== playlist.pid), updated];
            } else {
                this.videoPlaylists = this.videoPlaylists.filter(p => p.pid !== playlist.pid);
            }
        } catch (error) {
            showRequestError(add ? "添加到播放列表" : "从播放列表删除", error);
        }
    }

    private async createAndAddPlaylist(title: string) {
        if (!this.video) return;
        try {
            const created = await ClientApis.AddPlaylist.fetch({}, {title, aids: [this.video.aid]});
            this.allPlaylists = [created, ...this.allPlaylists];
            this.videoPlaylists = [...this.videoPlaylists, created];
        } catch (error) {
            showRequestError("新建播放列表", error);
        }
    }

    private getCurrTime() {
        return this.player ? this.player.currentTime() : 0;
    }

    private seek(time_second: number) {
        if (this.player) this.player.seek(time_second);
    }

    private getVisibleTabs(): { id: TabId, title: string }[] {
        const tabs: { id: TabId, title: string }[] = [];
        if (this.playlist && this.playlist.items && this.playlist.items.length > 1) {
            tabs.push({id: "playlist", title: "当前播放"});
        }
        tabs.push({id: "danmaku", title: "弹幕"});
        const hasTimestamps = Boolean(this.partInfo && this.partInfo.timestamps && this.partInfo.timestamps.length > 0);
        if (hasTimestamps || this.forceShowTimestamps) {
            tabs.push({id: "timestamp", title: "时间点"});
        }
        tabs.push({id: "edit", title: "编辑"});
        return tabs;
    }

    private clickHeader(id: TabId) {
        this.currentTab = id;
        if (id !== "timestamp") {
            this.forceShowTimestamps = false;
        }
    }

    private renderPlaylistStarIcon(count: number): TemplateResult {
        if (count >= 2) {
            return html`
                <svg class="tile-icon tile-icon--star" viewBox="0 0 28 24" aria-hidden="true">
                    <polygon points="15.8,2.6 18.6,8.3 24.8,9.2 20.3,13.6 21.4,19.8 15.8,16.9 10.2,19.8 11.3,13.6 6.8,9.2 13,8.3"
                        fill="#f59e0b" stroke="#b45309" stroke-width="1.4" stroke-linejoin="round"></polygon>
                    <polygon points="11.2,2.6 14,8.3 20.2,9.2 15.7,13.6 16.8,19.8 11.2,16.9 5.6,19.8 6.7,13.6 2.2,9.2 8.4,8.3"
                        fill="#fbbf24" stroke="#fffbeb" stroke-width="2.6" stroke-linejoin="round"></polygon>
                    <polygon points="11.2,2.6 14,8.3 20.2,9.2 15.7,13.6 16.8,19.8 11.2,16.9 5.6,19.8 6.7,13.6 2.2,9.2 8.4,8.3"
                        fill="#fbbf24" stroke="#d97706" stroke-width="1.5" stroke-linejoin="round"></polygon>
                </svg>
            `;
        }
        if (count === 1) {
            return html`
                <svg class="tile-icon tile-icon--star" viewBox="0 0 28 24" aria-hidden="true">
                    <polygon points="14,2.5 16.9,8.4 23.4,9.3 18.7,13.9 19.8,20.4 14,17.3 8.2,20.4 9.3,13.9 4.6,9.3 11.1,8.4"
                        fill="#fbbf24" stroke="#d97706" stroke-width="1.6" stroke-linejoin="round"></polygon>
                </svg>
            `;
        }
        return html`
            <svg class="tile-icon tile-icon--star" viewBox="0 0 28 24" aria-hidden="true">
                <polygon points="14,2.5 16.9,8.4 23.4,9.3 18.7,13.9 19.8,20.4 14,17.3 8.2,20.4 9.3,13.9 4.6,9.3 11.1,8.4"
                    fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"></polygon>
            </svg>
        `;
    }

    private renderEditTab(): TemplateResult {
        const playlistCount = this.videoPlaylists.length;

        return html`
            <div class="tab-panel">
                <div class="edit-grid">
                    <button type="button"
                        class="edit-tile ${playlistCount > 0 ? "edit-tile--active" : ""}"
                        title=${playlistCount === 0 ? "未加入列表" : `已在 ${playlistCount} 个列表`}
                        @click=${() => {
                            this.playlistDialogOpen = true;
                            if (this.allPlaylists.length === 0 && !this.playlistsLoading) this.loadPlaylists();
                        }}>
                        ${this.renderPlaylistStarIcon(playlistCount)}
                        <span class="tile-label">播放列表</span>
                    </button>
                    <button type="button"
                        class="edit-tile"
                        @click=${() => {
                            this.forceShowTimestamps = true;
                            this.currentTab = "timestamp";
                        }}>
                        <svg class="tile-icon" viewBox="0 0 24 24" aria-hidden="true">
                            <circle cx="12" cy="12" r="9"></circle>
                            <path d="M12 7v5l3.5 2"></path>
                        </svg>
                        <span class="tile-label">时间点</span>
                    </button>
                    <button type="button"
                        class="edit-tile"
                        @click=${() => this.onRedownload && this.onRedownload()}>
                        <svg class="tile-icon" viewBox="0 0 24 24" aria-hidden="true">
                            <path d="M3 12a9 9 0 0 1 15.3-6.4L21 8"></path>
                            <path d="M21 3v5h-5"></path>
                            <path d="M21 12a9 9 0 0 1-15.3 6.4L3 16"></path>
                            <path d="M3 21v-5h5"></path>
                        </svg>
                        <span class="tile-label">重新下载</span>
                    </button>
                    <button type="button"
                        class="edit-tile edit-tile--danger"
                        @click=${() => this.onDelete && this.onDelete()}>
                        <svg class="tile-icon" viewBox="0 0 24 24" aria-hidden="true">
                            <path d="M3 6h18"></path>
                            <path d="M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2"></path>
                            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"></path>
                            <path d="M10 11v6"></path>
                            <path d="M14 11v6"></path>
                        </svg>
                        <span class="tile-label">删除视频</span>
                    </button>
                </div>
            </div>
        `;
    }

    private renderTabContent(activeTab: TabId): TemplateResult {
        switch (activeTab) {
            case "playlist":
                return html`
                    <playlist-element
                        .onitemclick=${(index: number) => this.onPlayIndex && this.onPlayIndex(index)}
                        .playlist=${this.playlist}
                        .playindex=${this.playindex}
                    ></playlist-element>
                `;
            case "danmaku":
                return html`
                    <danmakulist-element
                        .danmakuList=${this.danmakuList}
                        .danmakuPrefs=${this.danmakuPrefs}
                        .onDanmakuPrefsChange=${this.onDanmakuPrefsChange}
                        .seek=${(second: number) => this.seek(second)}
                        .onUpdateDanmaku=${() => this.onUpdateDanmaku && this.onUpdateDanmaku()}
                    ></danmakulist-element>
                `;
            case "timestamp":
                return html`
                    <div class="tab-panel">
                        <timestampedit-element
                            .part_timestamps=${this.partInfo}
                            .getCurrTime=${() => this.getCurrTime()}
                            .seek=${(second: number) => this.seek(second)}
                            .onChange=${(timestamps: Timestamp[]) => this.onTimestampsChanged && this.onTimestampsChanged(timestamps)}
                        ></timestampedit-element>
                    </div>
                `;
            case "edit":
                return this.renderEditTab();
        }
    }

    render() {
        const visibleTabs = this.getVisibleTabs();
        const activeTab = (this.currentTab && visibleTabs.some(t => t.id === this.currentTab))
            ? this.currentTab
            : visibleTabs[0].id;
        const isFlush = activeTab === "playlist" || activeTab === "danmaku";

        return html`
            <div class="tabs">
                ${visibleTabs.map(tab => html`
                    <div class="tab ${tab.id === activeTab ? "tab-selected" : ""}" @click=${() => this.clickHeader(tab.id)}>${tab.title}</div>
                `)}
            </div>
            <div class="tab-content ${isFlush ? "tab-content--flush" : ""}">${this.renderTabContent(activeTab)}</div>
            ${this.playlistDialogOpen ? html`
                <playlistpicker-element
                    .video=${this.video}
                    .allPlaylists=${this.allPlaylists}
                    .videoPlaylistIds=${new Set(this.videoPlaylists.map(p => p.pid))}
                    .loading=${this.playlistsLoading}
                    .onToggle=${(playlist: PlaylistDB, add: boolean) => this.togglePlaylist(playlist, add)}
                    .onCreateAndAdd=${(title: string) => this.createAndAddPlaylist(title)}
                    .onClose=${() => { this.playlistDialogOpen = false; }}
                ></playlistpicker-element>
            ` : html``}
        `;
    }

    static styles = css`
        :host {
            position: relative;
            display: flex;
            flex-direction: column;
            box-sizing: border-box;
            width: 320px;
            height: 540px;
            overflow: hidden;
            border-left: 1px solid #2a3141;
            border-right: 1px solid var(--border, #dfe4ec);
            border-top: 1px solid var(--border, #dfe4ec);
            border-bottom: 1px solid var(--border, #dfe4ec);
            background: var(--surface, #fff);
            color: var(--text, #172033);
        }
        .tabs {
            display: flex;
            flex: 0 0 42px;
            box-sizing: border-box;
            height: 42px;
            border-bottom: 1px solid var(--border, #dfe4ec);
            background: var(--surface-subtle, #f8fafc);
        }
        .tab {
            position: relative;
            flex: 1;
            display: flex;
            align-items: center;
            justify-content: center;
            color: var(--muted, #667085);
            user-select: none;
            cursor: pointer;
            font-size: 13px;
            font-weight: 600;
            transition: background-color .15s ease, color .15s ease;
        }
        .tab::after {
            content: "";
            position: absolute;
            left: 28px;
            right: 28px;
            bottom: -1px;
            height: 2px;
            border-radius: 2px 2px 0 0;
            background: rgba(37, 99, 235, .35);
            transition: left .15s ease, right .15s ease, height .15s ease, background-color .15s ease;
        }
        .tab:hover {
            background: rgba(37, 99, 235, .05);
            color: var(--primary, #2563eb);
        }
        .tab:not(.tab-selected):hover::after {
            left: 22px;
            right: 22px;
            background: rgba(37, 99, 235, .65);
        }
        .tab-selected {
            background: var(--surface, #fff);
            color: var(--primary, #2563eb);
        }
        .tab-selected:hover {
            background: var(--surface, #fff);
        }
        .tab-selected::after {
            left: 16px;
            right: 16px;
            height: 3px;
            background: var(--primary, #2563eb);
        }
        .tab-content {
            box-sizing: border-box;
            flex: 1;
            width: 100%;
            min-width: 0;
            min-height: 0;
            overflow-x: hidden;
            overflow-y: auto;
            scrollbar-width: thin;
            scrollbar-color: #cbd5e1 transparent;
        }
        .tab-content--flush {
            overflow: hidden;
        }
        .tab-panel {
            box-sizing: border-box;
            padding: 12px;
        }
        playlist-element,
        danmakulist-element {
            display: block;
            box-sizing: border-box;
            width: 100%;
            min-width: 0;
            position: relative;
            height: 100%;
            min-height: 0;
        }
        .edit-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 10px;
        }
        .edit-tile {
            box-sizing: border-box;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 8px;
            height: 112px;
            padding: 12px 8px;
            border: 1px solid var(--border, #dfe4ec);
            border-radius: 12px;
            background: var(--surface-subtle, #f8fafc);
            color: #344054;
            font: inherit;
            cursor: pointer;
            transition: border-color .15s ease, background-color .15s ease, color .15s ease, transform .15s ease, box-shadow .15s ease;
        }
        .edit-tile:hover {
            border-color: #b9c8e2;
            background: #f5f8ff;
            color: var(--primary, #2563eb);
            box-shadow: 0 4px 12px rgba(16, 24, 40, .06);
            transform: translateY(-1px);
        }
        .edit-tile--active {
            border-color: #fcd34d;
            background: #fffbeb;
            color: #92400e;
        }
        .edit-tile--active:hover {
            border-color: #f59e0b;
            background: #fef3c7;
            color: #78350f;
        }
        .edit-tile--danger {
            border-color: #f4c7c3;
            background: #fffafa;
            color: var(--danger, #b42318);
        }
        .edit-tile--danger:hover {
            border-color: #e9a39d;
            background: #fff1f0;
            color: var(--danger, #b42318);
        }
        .tile-icon {
            width: 44px;
            height: 44px;
            fill: none;
            stroke: currentColor;
            stroke-width: 1.75;
            stroke-linecap: round;
            stroke-linejoin: round;
        }
        .tile-icon--star {
            width: 50px;
            height: 44px;
        }
        .tile-label {
            font-size: 13px;
            font-weight: 600;
            line-height: 1.3;
        }
    `;

}
