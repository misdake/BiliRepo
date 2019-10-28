import {css, html, LitElement, property} from "lit-element";
import {BilibiliPage, BilibiliVideo} from "../../common/types";
import {Playlist} from "../../common/Playlist";
import {VideoTitleElement} from "../elements/VideoTitleElement";
import {GuideElement} from "../elements/GuideElement";
import {PlayerElement} from "./PlayerElement";
import {MemberElement} from "../elements/MemberElement";
import {VideoDescElement} from "../elements/VideoDescElement";
import {PlaylistElement} from "../elements/PlaylistElement";

export class PageElement extends LitElement {

    static register() {
        VideoTitleElement.register();
        GuideElement.register();
        PlayerElement.register();
        MemberElement.register();
        VideoDescElement.register();
        PlaylistElement.register();
        customElements.define('page-element', PageElement);
    }

    currentVideo: BilibiliVideo;
    currentPart: BilibiliPage;

    @property()
    playlist: Playlist;
    @property()
    playindex: number;

    constructor() {
        super();
        this.playlist = null;
        this.playindex = -1;
    }

    public updatePlayIndex(index: number) {
        this.playindex = index;
        let playlistItem = this.playlist.items[this.playindex];
        console.log("play index ", index);
        this.updateCurrentVideoPart(playlistItem.video, playlistItem.part);
    }

    public updateCurrentVideoPart(video: BilibiliVideo, part: BilibiliPage) {
        this.currentVideo = video;
        document.title = this.currentVideo.title;

        this.currentPart = null;
        for (let page of this.currentVideo.pages) {
            if (page == part) {
                this.currentPart = page;
                break;
            }
        }
        this.performUpdate();
    }

    protected firstUpdated(_changedProperties: Map<PropertyKey, unknown>): void {
        if (this.playlist && this.playindex >= 0 && this.playindex < this.playlist.items.length) {
            this.updatePlayIndex(this.playindex);
        }
        // @ts-ignore
        window.page = this;
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
        guide-element {
            float:right;
        }
        member-element {
            float:right;
        }
        
        #player {
            position: relative;
        }
        player-element {
            // width: 960px;
            // height: 540px;
        }
        playlist-element {
            position: absolute;
            left: 960px;
            top: 0px;
            height: 540px;
            overflow-y: hidden;
        }
        playlist-element:hover {
            overflow-y: auto;
        }
        
        #info {
            clear: both;
        }
    `;

    render() {
        return html`
            <div id="page">
                <div id="header">
                    <guide-element></guide-element>
                    <member-element .member=${this.currentVideo ? this.currentVideo.owner : null}></member-element>
                    <videotitle-element .video=${this.currentVideo} .part=${this.currentPart}></videotitle-element>
                </div>
                <div id="player">
                    <player-element .video=${this.currentVideo} .part=${this.currentPart}></player-element>
                    <playlist-element .onitemclick=${(index: number) => this.updatePlayIndex(index)} .playlist=${this.playlist} .playindex=${this.playindex}></playlist-element>
                </div>
                <div id="info">
                    <videodesc-element .video=${this.currentVideo} .part=${this.currentPart}></videodesc-element>
                </div>
            </div>
        `;
    }

}