import {css, customElement, html, LitElement, property, TemplateResult} from "lit-element";
import {PageElement} from "./PageElement";
import "./PlaylistElement";
import "./TimestampEditElement";
import "../elements/VideoPlaylistEdit";
import {ClientApis} from "../common/api/ClientApi";
import {Playlist} from "./Playlist";
import {Timestamp} from "../../server/storage/dbTypes";

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

    private tabs: { title: string, content: () => TemplateResult }[] = [
        {title: "播放列表", content: () => html`
            <playlist-element .onitemclick=${(index: number) => this.pageelement.updatePlayIndex(index)} .playlist=${this.playlist} .playindex=${this.playindex}></playlist-element>
        `},
        {title: "时间点", content: () => html`
            <div style="padding: 5px;">
                <timestampedit-element
                    .part=${this.pageelement.currentPart}
                    .getCurrTime=${() => this.getCurrTime()}
                    .seek=${(second: number) => this.seek(second)}
                    .refresh=${(timestamps: Timestamp[]) => this.refreshTimestamps(timestamps)}
                ></timestampedit-element>
            </div>
        `},
        {title: "编辑", content: () => html`
            <div style="padding: 5px;">
                <videoplaylistedit-element .video=${this.pageelement.currentVideo}></videoplaylistedit-element>
                <h5><button @click=${() => this.updateDanmaku()}>更新弹幕</button></h5>
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
        });
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
            <div style="display:flex; height: 30px; line-height: 30px;">${headers}</div>
            ${this.tabs[this.currentTab].content()}
        `;
    }

    static styles = css`
        .tab {
            flex: 1;
            color: blue;
            background: rgb(224, 224, 224);
            text-align: center;
            user-select: none;
        }
        .tab-selected {
            background: rgb(135, 206, 235);
        }
        playlist-element {
            position: relative;
            height: 510px;
        }
        ul {
            overflow-y: hidden;
        }
        ul:hover {
            overflow-y: auto;
        }
    `;

}
