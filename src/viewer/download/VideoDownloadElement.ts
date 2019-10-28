import {css, html, LitElement, property} from "lit-element";
import {VideoStatus} from "../../common/DownloadStatus";

export class VideoDownloadElement extends LitElement {

    static register() {
        customElements.define('videodownload-element', VideoDownloadElement);
    }

    @property()
    video: VideoStatus;

    static styles = css`        
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
        
        .left {
            float: left;
            margin: 10px 0 0 10px;
            width: 160px;
        }
        .title {
            left: 0;
            top: 100px;
            width: 160px;
        }
        
        .right {
            float: right;
            margin: 10px 10px 0 0;
            width: 430px;
            height: 100px;
        }
        .part {
            clear: left;
            position: relative;
        }
        .part_state {
            float: left;
            width: 15px;
            white-space: nowrap;
            overflow: hidden;
        }
        .part_title {
            float: left;
            width: 345px;
            white-space: nowrap;
            overflow: hidden;
        }
        .part_percent {
            float: right;
            width: 70px;
            text-align: right;
            white-space: nowrap;
            overflow: hidden;
        }
        .part_progress {
            position: relative;
            width: 415px;
            left: 15px;
        }
    `;

    render() {
        if (this.video) {
            this.video.title = this.video.title || "";
            this.video.pic = this.video.pic || "data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs%3D";
        }

        let parts = [];
        if (this.video && this.video.parts && this.video.parts.length) {
            if (this.video.parts) for (let part of this.video.parts) {
                let finish = part.done || part.failed;
                let icon = finish ? (part.done ? "☑" : "☒") : "☐";
                if (part.progress === undefined) {
                    parts.push(html`
                        <div class="part">
                            <span class="part_state">${icon}</span>
                            <span class="part_title">${part.title}</span>
                        </div>
                    `);
                } else {
                    parts.push(html`
                        <div class="part">
                            <span class="part_state">${icon}</span>
                            <span class="part_title">${part.title}</span>
                            <span class="part_percent">${part.progress}%</span>
                            <progress class="part_progress" max="100" value="${part.progress}"></progress>
                        </div>
                    `);
                }
            }
        }

        let video = !this.video ? html`` : html`
            <div class="left">
                <div class="thumbContainer">
                    <img class="thumb" src="${this.video.pic}" alt="thumb"/>
                </div>
                <div class="title">${this.video.title}</div>
            </div>
            <div class="right">
                ${parts}
            </div>
            <div style="clear:both;"></div>
        `;

        return html`
            ${video}
        `;
    }

}