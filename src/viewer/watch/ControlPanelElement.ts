import {css, html, LitElement, type TemplateResult} from "lit";
import {customElement, property} from "lit/decorators.js";
import "./PlaylistElement";
import "./TimestampEditElement";
import "../elements/VideoPlaylistEdit";
import {Playlist} from "./Playlist";
import {PartTimestamps, Timestamp, VideoParts} from "../../server/storage/dbTypes";
import {Danmaku} from "../../server/download/Bilibili";
import {Player} from "./Player";

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
    currentTab: number = 0;

    @property()
    danmakuList: Danmaku[];

    private tabs: { title: string, content: () => TemplateResult }[] = [
        {title: "当前播放", content: () => html`
            <playlist-element .onitemclick=${(index: number) => this.onPlayIndex && this.onPlayIndex(index)} .playlist=${this.playlist} .playindex=${this.playindex}></playlist-element>
        `},
        {title: "时间点", content: () => html`
            <div class="tab-panel">
                <timestampedit-element
                    .part_timestamps=${this.partInfo}
                    .getCurrTime=${() => this.getCurrTime()}
                    .seek=${(second: number) => this.seek(second)}
                    .onChange=${(timestamps: Timestamp[]) => this.onTimestampsChanged && this.onTimestampsChanged(timestamps)}
                ></timestampedit-element>
            </div>
        `},
        {title: "编辑", content: () => html`
            <div class="tab-panel edit-panel">
                <videoplaylistedit-element .video=${this.video}></videoplaylistedit-element>
                <section class="edit-card">
                    <div class="edit-card-header">
                        <h4>视频操作</h4>
                        <span class="badge">弹幕 ${this.danmakuList ? this.danmakuList.length : 0} 条</span>
                    </div>
                    <div class="edit-actions">
                        <button @click=${() => this.onUpdateDanmaku && this.onUpdateDanmaku()}>更新弹幕</button>
                        <button @click=${() => this.onRedownload && this.onRedownload()}>重新下载视频</button>
                    </div>
                </section>
                <section class="edit-card edit-card--danger">
                    <div class="edit-card-header">
                        <h4>危险操作</h4>
                    </div>
                    <button class="danger full-width" @click=${() => this.onDelete && this.onDelete()}>删除视频</button>
                </section>
            </div>
        `},
    ];

    private getCurrTime() {
        return this.player ? this.player.currentTime() : 0;
    }
    private seek(time_second: number) {
        if (this.player) this.player.seek(time_second);
    }

    private clickHeader(index: number) {
        this.currentTab = index;
    }

    render() {
        let headers: TemplateResult[] = [];
        for (let i = 0; i < this.tabs.length; i++) {
            let tab = this.tabs[i];
            if (i !== this.currentTab) {
                headers.push(html`<div class="tab" @click=${() => this.clickHeader(i)}>${tab.title}</div>`);
            } else {
                headers.push(html`<div class="tab tab-selected" @click=${() => this.clickHeader(i)}>${tab.title}</div>`);
            }
        }

        return html`
            <div class="tabs">${headers}</div>
            <div class="tab-content ${this.currentTab === 0 ? "tab-content--flush" : ""}">${this.tabs[this.currentTab].content()}</div>
        `;
    }

    static styles = css`
        :host {
            display: flex;
            flex-direction: column;
            box-sizing: border-box;
            width: 320px;
            height: 540px;
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
            left: 36px;
            right: 36px;
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
            left: 28px;
            right: 28px;
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
            left: 20px;
            right: 20px;
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
        playlist-element {
            display: block;
            box-sizing: border-box;
            width: 100%;
            min-width: 0;
            position: relative;
            height: 100%;
            min-height: 0;
        }
        .edit-panel {
            display: flex;
            flex-direction: column;
            gap: 12px;
        }
        .edit-card {
            padding: 12px;
            border: 1px solid var(--border, #dfe4ec);
            border-radius: 10px;
            background: var(--surface-subtle, #f8fafc);
        }
        .edit-card--danger {
            border-color: #f4c7c3;
            background: #fffafa;
        }
        .edit-card-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 8px;
            margin-bottom: 10px;
        }
        .edit-card h4 {
            margin: 0;
            color: var(--text, #172033);
            font-size: 13px;
            font-weight: 600;
            line-height: 1.4;
        }
        .edit-card--danger h4 {
            color: var(--danger, #b42318);
        }
        .badge {
            padding: 2px 8px;
            border: 1px solid var(--border, #dfe4ec);
            border-radius: 999px;
            background: var(--surface, #fff);
            color: var(--muted, #667085);
            font-size: 12px;
            line-height: 1.4;
            white-space: nowrap;
        }
        .edit-actions {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 8px;
        }
        button {
            box-sizing: border-box;
            height: 34px;
            padding: 0 10px;
            border: 1px solid #d0d5dd;
            border-radius: 6px;
            background: #fff;
            color: #344054;
            font: inherit;
            font-size: 13px;
            white-space: nowrap;
            cursor: pointer;
            transition: background-color .15s ease, border-color .15s ease, color .15s ease;
        }
        button:hover {
            border-color: #98a2b3;
            background: #f8fafc;
            color: var(--text, #172033);
        }
        button.danger {
            border-color: #f4c7c3;
            color: var(--danger, #b42318);
        }
        button.danger:hover {
            border-color: #e9a39d;
            background: #fff6f5;
            color: var(--danger, #b42318);
        }
        button.full-width {
            width: 100%;
        }
    `;

}
