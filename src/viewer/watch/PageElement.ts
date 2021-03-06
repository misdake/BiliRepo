import {css, customElement, html, LitElement, property} from "lit-element";
import {Playlist} from "./Playlist";
import "./VideoTitleElement";
import "../elements/GuideElement";
import "./PlayerElement";
import "../elements/MemberElement";
import "./VideoDescElement";
import "./ControlPanelElement";
import {PartDB, PartTimestamps, VideoParts} from "../../server/storage/dbTypes";
import {Player} from "./Player";
import {Danmaku} from "../../server/download/Bilibili";

@customElement('page-element')
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

    private onPlayerLoad(player:Player) {
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

    protected firstUpdated(_changedProperties: Map<PropertyKey, unknown>): void {
        if (this.playlist && this.playindex >= 0 && this.playindex < this.playlist.items.length) {
            this.updatePlayIndex(this.playindex);
        }
    }

    static styles = css`
        #page {
            width: 1280px;
            max-width: 100%;
            margin: 0 auto;
        }
        
        #header {
            clear: both;
        }
        title-element {
        }
        #guide {
            float: right;
            width: 62px;
        }
        #blink {
            text-align: right;
            text-decoration: none;
            padding: 0;
            color: blue;
            display: block;
        }        
        member-element {
            float: right;
            width: 256px;
        }
        
        #player {
            position: relative;
            margin: 10px 0;
        }
        
        controlpanel-element {
            position: absolute;
            left: 960px;
            top: 0px;
            height: 540px;
            right: 0;
            overflow-y: hidden;
        }
    `;

    render() {
        return html`
            <div id="page">
                <div id="header">
                    <div id="guide">
                        <guide-element></guide-element>
                        ${!this.currentVideo ? html`` : html`
                        <a id="blink" target="_blank" rel="noopener noreferrer" href="https://www.bilibili.com/video/av${this.currentVideo.aid}${this.currentPart ? `?p=${this.currentPart.index}` : ''}">B站链接</a>
                        `}
                    </div>
                    
                    <member-element .member=${this.currentVideo ? this.currentVideo.member : null}></member-element>
                    <videotitle-element .video=${this.currentVideo} .part=${this.currentPart}></videotitle-element>
                    <div style="clear: both;"></div>
                </div>
                <div id="player">
                    <player-element .onLoad=${(player: Player) => this.onPlayerLoad(player)} .onEnded=${() => this.onPartEnded()} .video=${this.currentVideo} .part=${this.currentPart}></player-element>
                    <controlpanel-element .danmakuList=${this.danmakuList} .currentTab=0 .pageelement=${this} .playlist=${this.playlist} .playindex=${this.playindex}></controlpanel-element>
                    <div style="clear: both;"></div>
                </div>
                <div id="info">
                    <videodesc-element .video=${this.currentVideo} .part=${this.currentPart}></videodesc-element>
                </div>
            </div>
        `;
    }

}
