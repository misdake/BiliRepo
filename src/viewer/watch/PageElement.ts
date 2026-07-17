import {css, html, LitElement, type PropertyValues} from "lit";
import {customElement, property} from "lit/decorators.js";
import {Playlist} from "./Playlist";
import "./VideoTitleElement";
import "../elements/ViewTypeElement";
import "./PlayerElement";
import "../elements/MemberElement";
import "./VideoDescElement";
import "./ControlPanelElement";
import {PartDB, PartTimestamps, VideoParts} from "../../server/storage/dbTypes";
import {Player} from "./Player";
import {Danmaku} from "../../server/download/Bilibili";
import type {ViewType} from "../index/indexViewType";

@customElement('watch-page-element')
export class PageElement extends LitElement {

    @property() //property for auto update
    currentVideo: VideoParts;
    @property() //property for auto update
    currentPart: PartTimestamps;
    @property()
    danmakuList: Danmaku[];

    player: Player;

    @property()
    playlist: Playlist;
    @property()
    playindex: number;

    @property()
    onPlayerLoaded: (pageelement: PageElement) => void;
    @property()
    onBeginPart: (video: VideoParts, part: PartDB) => void;

    constructor() {
        super();
        this.playlist = null;
        this.playindex = -1;
    }

    public updatePlayIndex(index: number) {
        this.playindex = index;
        let playlistItem = this.playlist.items[this.playindex];
        console.log("play index ", index);
        this.danmakuList = [];
        this.updateCurrentVideoPart(playlistItem.video, playlistItem.part);
    }

    public updateCurrentVideoPart(video: VideoParts, part: PartDB) {
        this.currentVideo = video;
        document.title = this.currentVideo.title;

        //update url
        if (this.onBeginPart) this.onBeginPart(video, part);

        this.currentPart = null;
        for (let page of this.currentVideo.parts) {
            if (page == part) {
                this.currentPart = page;
                break;
            }
        }
    }

    private onPlayerLoad(player: Player) {
        this.player = player;
        if (this.onPlayerLoaded) this.onPlayerLoaded(this);
        this.player.onDanmakuLoaded = danmakuList => {
            this.danmakuList = danmakuList;
        };
    }

    private onPartEnded() {
        if (this.playindex < this.playlist.items.length - 1) {
            this.updatePlayIndex(this.playindex + 1);
        }
    }

    protected firstUpdated(_changedProperties: PropertyValues): void {
        if (this.playlist && this.playindex >= 0 && this.playindex < this.playlist.items.length) {
            this.updatePlayIndex(this.playindex);
        }
    }

    static styles = css`
        :host {
            display: block;
            position: relative;
            box-sizing: border-box;
            width: 1330px;
            min-height: 100vh;
            margin: 0 auto;
            color: var(--text, #172033);
        }
        #scroll-viewport {
            width: 100%;
            min-height: 100vh;
        }
        #surface {
            box-sizing: border-box;
            width: 1300px;
            min-height: 100vh;
            margin: 0 auto;
            padding: 10px 0;
            background: #fff;
            box-shadow: inset 1px 0 var(--border, #dfe4ec), inset -1px 0 var(--border, #dfe4ec);
        }
        #page {
            width: 1280px;
            margin: 0 auto;
        }
        #section-nav {
            position: absolute;
            top: 8px;
            right: calc(50% + 650px + 12px);
            width: 124px;
            margin: 0;
        }
        #header {
            display: grid;
            grid-template-columns: 960px 320px;
            align-items: center;
            gap: 0;
            margin-bottom: 8px;
        }
        #meta {
            display: flex;
            flex-direction: row;
            align-items: center;
            justify-content: flex-end;
            gap: 6px;
            padding-left: 10px;
        }
        #blink {
            text-decoration: none;
            padding: 4px 6px;
            border-radius: 7px;
            color: #2563eb;
            font-size: 12px;
        }
        #blink:hover {
            background: #eaf1ff;
        }        
        member-element {
            display: block;
            width: 150px;
            flex-shrink: 0;
            --member-avatar-size: 32px;
            --member-card-height: 48px;
            --member-card-padding: 4px;
        }
        #player {
            position: relative;
            width: 1280px;
            height: 540px;
            background: #0b1020;
            overflow: hidden;
        }
        controlpanel-element {
            position: absolute;
            left: 960px;
            top: 0;
            height: 540px;
            right: 0;
        }
        #info {
            margin-top: 12px;
            color: #475467;
            line-height: 1.65;
        }
    `;

    render() {
        return html`
            <nav id="section-nav">
                <viewtype-element .onClick=${(type: ViewType) => window.location.assign(`index.html?type=${type}`)}></viewtype-element>
            </nav>
            <div id="scroll-viewport">
                <div id="surface">
                    <div id="page">
                        <div id="header">
                            <videotitle-element .video=${this.currentVideo} .part_info=${this.currentPart}></videotitle-element>
                            <div id="meta">
                                <member-element .member=${this.currentVideo ? this.currentVideo.member : null}></member-element>
                                ${!this.currentVideo ? html`` : html`
                                <a id="blink" target="_blank" rel="noopener noreferrer" href="https://www.bilibili.com/video/av${this.currentVideo.aid}${this.currentPart ? `?p=${this.currentPart.index}` : ''}">打开 B 站视频</a>
                                `}
                            </div>
                        </div>
                        <div id="player">
                            <player-element .onLoad=${(player: Player) => this.onPlayerLoad(player)} .onEnded=${() => this.onPartEnded()} .video=${this.currentVideo} .part_timestamps=${this.currentPart}></player-element>
                            <controlpanel-element .danmakuList=${this.danmakuList} .currentTab=0 .pageelement=${this} .playlist=${this.playlist} .playindex=${this.playindex}></controlpanel-element>
                        </div>
                        ${this.currentVideo && this.currentVideo.desc && this.currentVideo.desc.trim() ? html`
                            <div id="info">
                                <videodesc-element .video=${this.currentVideo} .part_info=${this.currentPart}></videodesc-element>
                            </div>
                        ` : html``}
                    </div>
                </div>
            </div>
        `;
    }

}
