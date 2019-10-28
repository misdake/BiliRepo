import {css, html, LitElement, property} from "lit-element";
import {VideoStatus} from "../../common/DownloadStatus";

export class VideoStatusElement extends LitElement {

    static register() {
        customElements.define('videostatus-element', VideoStatusElement);
    }

    @property()
    video: VideoStatus;
    @property()
    icon: string;
    @property()
    oniconclick: () => void;

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
    `;

    render() {
        let video = !this.video ? html`` : html`
            <li class="videoItem">
                <div class="thumbContainer">
                    <img class="thumb" src="${this.video.pic}" alt="thumb"/>
                </div>
                <span class="title">${this.video.title}</span>
            </li>`;

        return html`
            ${video}
        `;
    }

}