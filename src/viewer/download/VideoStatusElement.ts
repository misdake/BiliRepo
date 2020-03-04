import {css, customElement, html, LitElement, property} from "lit-element";
import {VideoStatus} from "../../common/DownloadStatus";

@customElement('videostatus-element')
export class VideoStatusElement extends LitElement {

    @property()
    video: VideoStatus;
    @property()
    icon: string;
    @property()
    onIconClick: () => void;

    static styles = css`
        .videoItem {
            display: inline;
            float: left;
            padding: 10px;
            width: 300px;
            height: 90px;
            position: relative;
            overflow: hidden;
        }
        
        .thumbContainer {
            width: 160px;
            height: 90px;
            position: relative;
        }
        
        .thumb {
            object-fit: cover;
            max-width: 160px;
            max-height: 90px;
            width: 100%;
            height: 100%;
        }
        
        .title {
            position: absolute;
            left: 175px;
            top: 10px;
            width: 140px;
            display: inline;
        }
        
        .icon {
            color: #FFF;
            background: #800;
            padding: 5px 10px;
            cursor: pointer;
            position: absolute;
            bottom: 10px;
            right: 10px;
        }
    `;

    private trigger() {
        if (this.onIconClick) this.onIconClick();
    }

    render() {
        if (this.video) {
            this.video.title = this.video.title || "";
            this.video.pic = this.video.pic || "data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs%3D";
        }

        let video = !this.video ? html`
            <li class="videoItem">
                <div class="thumbContainer" style="background:#CCCCCC">
                </div>
                <span class="title">preview</span>
            </li>
        ` : html`
            <li class="videoItem">
                <div class="thumbContainer">
                    <img class="thumb" src="${this.video.pic}" alt="thumb"/>
                </div>
                <span class="title">${this.video.title}</span>
                ${this.icon ? html`<div class="icon" @click="${() => this.trigger()}">${this.icon}</div>` : html``}
            </li>
        `;

        return (this.video && this.video.done) ? html`
            <a href="watch.html?aid=${this.video.aid}">
                ${video}
            </a>
        ` : html`
            ${video}
        `;
    }

}
