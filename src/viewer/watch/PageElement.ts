import {css, customElement, html, LitElement, property} from "lit-element";
import {Playlist} from "./Playlist";
import "./VideoTitleElement";
import "../elements/GuideElement";
import "./PlayerElement";
import "../elements/MemberElement";
import "../elements/VideoDescElement";
import "../elements/VideoPlaylistEdit";
import "./PlaylistElement";
import {PartDB, VideoParts} from "../../server/storage/dbTypes";

@customElement('page-element')
export class PageElement extends LitElement {

    currentVideo: VideoParts;
    currentPart: PartDB;

    @property()
    playlist: Playlist;
    @property()
    playindex: number;

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
        this.performUpdate();
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
        guide-element {
            float: right;
            width: 54px;
        }
        member-element {
            float: right;
            width: 256px;
        }
        
        #player {
            position: relative;
            margin: 10px 0;
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
        }
    `;

    render() {
        return html`
            <div id="page">
                <div id="header">
                    <guide-element></guide-element>
                    <member-element .member=${this.currentVideo ? this.currentVideo.member : null}></member-element>
                    <videotitle-element .video=${this.currentVideo} .part=${this.currentPart}></videotitle-element>
                    <div style="clear: both;"></div>
                </div>
                <div id="player">
                    <player-element .video=${this.currentVideo} .part=${this.currentPart}></player-element>
                    <playlist-element .onitemclick=${(index: number) => this.updatePlayIndex(index)} .playlist=${this.playlist} .playindex=${this.playindex}></playlist-element>
                    <div style="clear: both;"></div>
                </div>
                <div id="info">
                    <videodesc-element .video=${this.currentVideo} .part=${this.currentPart}></videodesc-element>
                </div>
                <div id="playlistedit">
                    <videoplaylistedit-element .video=${this.currentVideo}></videoplaylistedit-element>
                </div>
            </div>
        `;
    }

}
