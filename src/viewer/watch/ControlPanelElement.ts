import {css, html, LitElement, type TemplateResult} from "lit";
import {customElement, property} from "lit/decorators.js";
import {PageElement} from "./PageElement";
import "./PlaylistElement";
import "./TimestampEditElement";
import "../elements/VideoPlaylistEdit";
import {ClientApis, showRequestError} from "../common/api/ClientApi";
import {Playlist} from "./Playlist";
import {Timestamp} from "../../server/storage/dbTypes";
import {Danmaku} from "../../server/download/Bilibili";

@customElement('controlpanel-element')
export class ControlPanelElement extends LitElement {

    @property()
    pageelement: PageElement;
    @property()
    playlist: Playlist;
    @property()
    playindex: number;

    @property()
    currentTab: number = 0;

    @property()
    danmakuList: Danmaku[];

    private tabs: { title: string, content: () => TemplateResult }[] = [
        {title: "当前播放", content: () => html`
            <playlist-element .onitemclick=${(index: number) => this.pageelement.updatePlayIndex(index)} .playlist=${this.playlist} .playindex=${this.playindex}></playlist-element>
        `},
        {title: "时间点", content: () => html`
            <div style="padding: 5px;">
                <timestampedit-element
                    .part_timestamps=${this.pageelement.currentPart}
                    .getCurrTime=${() => this.getCurrTime()}
                    .seek=${(second: number) => this.seek(second)}
                    .refresh=${(timestamps: Timestamp[]) => this.refreshTimestamps(timestamps)}
                ></timestampedit-element>
            </div>
        `},
        {title: "编辑", content: () => html`
            <div style="padding: 5px;">
                <videoplaylistedit-element .video=${this.pageelement.currentVideo}></videoplaylistedit-element>
                <h5>弹幕${this.danmakuList.length}条</h5>
                <h5><button @click=${() => this.updateDanmaku()}>更新弹幕</button></h5>
                <h5><button @click=${() => this.redownload()}>重新下载视频</button></h5>
            </div>
        `},
    ];

    private getCurrTime() {
        return this.pageelement.player ? this.pageelement.player.currentTime() : 0;
    }
    private seek(time_second: number) {
        if (this.pageelement.player) this.pageelement.player.seek(time_second);
    }
    private refreshTimestamps(timestamps: Timestamp[]) {
        if (!this.pageelement.player) return;
        let player = this.pageelement.player;
        player.refreshHighlight(timestamps);
    }

    private updateDanmaku() {
        ClientApis.UpdateDanmaku.fetch({}, {part: this.pageelement.currentPart}).then(content => {
            if (content === "good") {
                // alert("danmaku updated!");
                window.location.replace(`${window.location.href}&t=${~~this.pageelement.player.currentTime()}`);
            } else {
                alert("danmaku update failed!\nresponse: " + content);
            }
        }).catch(error => {
            showRequestError("更新弹幕", error);
        });
    }

    private redownload() {
        this.pageelement.player.unloadPlayer();
        setTimeout(() => {
            ClientApis.Redownload.fetch(this.pageelement.currentVideo.aid).then(content => {
                if (content === "good") {
                    window.location.replace(`index.html?type=5`);
                } else {
                    alert("redownload failed!\nresponse: " + content);
                }
            }).catch(error => {
                showRequestError("重新下载视频", error);
            });
        }, 100);
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
            <div class="tab-content">${this.tabs[this.currentTab].content()}</div>
        `;
    }

    static styles = css`
        :host {
            display: block;
            box-sizing: border-box;
            width: 320px;
            height: 540px;
            border-left: 1px solid #2a3141;
            border-right: 1px solid #dfe4ec;
            border-top: 1px solid #dfe4ec;
            border-bottom: 1px solid #dfe4ec;
            background: #fff;
            color: #172033;
        }
        .tabs {
            display: flex;
            height: 42px;
            line-height: 42px;
            border-bottom: 1px solid #dfe4ec;
            background: #f3f5f8;
        }
        .tab {
            flex: 1;
            color: #667085;
            text-align: center;
            user-select: none;
            cursor: pointer;
            font-size: 13px;
            font-weight: 600;
        }
        .tab:hover { color: #2563eb; }
        .tab-selected {
            position: relative;
            background: #dbeafe;
            color: #1d4ed8;
        }
        .tab-selected::after {
            content: "";
            position: absolute;
            left: 22px;
            right: 22px;
            bottom: 0;
            height: 3px;
            border-radius: 3px 3px 0 0;
            background: #2563eb;
        }
        .tab-content {
            box-sizing: border-box;
            width: 100%;
            min-width: 0;
            height: 496px;
            overflow-y: auto;
        }
        playlist-element {
            display: block;
            box-sizing: border-box;
            width: 100%;
            min-width: 0;
            position: relative;
            height: 496px;
        }
        button, select {
            min-height: 32px;
            border: 1px solid #d0d5dd;
            border-radius: 6px;
            background: #fff;
            color: #344054;
            font: inherit;
        }
        button { padding: 5px 9px; cursor: pointer; }
    `;

}
