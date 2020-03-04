import {css, customElement, html, LitElement, property} from "lit-element";
import {VideoStatus} from "../../common/DownloadStatus";

@customElement('videodownload-element')
export class VideoDownloadElement extends LitElement {

    @property()
    video: VideoStatus;

    static styles = css`        
        .thumbContainer {
            width: 160px;
            height: 90px;
            position: relative;
            cursor: default;
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
            cursor: default;
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
            cursor: default;
            margin: 10px 0 0 0;
            width: 440px;
        }
        .part_state {
            display: inline-flex;
            width: 15px;
            white-space: nowrap;
            overflow: hidden;
        }
        .part_title {
            display: inline-flex;
            width: 345px;
            white-space: nowrap;
            overflow: hidden;
        }
        .part_percent {
            display: inline-block;
            position: relative;
            width: 70px;
            text-align: right;
            white-space: nowrap;
            overflow: visible;
        }
        .part_percent:hover .part_size {
            visibility: visible;
            opacity: 1;
        }
        .part_size {
            display: inline-block;
            position: absolute;
            visibility: hidden;
            background: gray;
            color: white;
            top: -100%;
            right: 100%;
            margin-right: -100%;
            margin-top: -5px;
            padding: 2px 5px;
            z-index: 1;
            opacity: 0;
            transition: opacity 0.3s;
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
                            <span class="part_percent" >
                                ${part.progress}%
                                <span class="part_size">${part.curr || "?"} / ${part.total || "?"}</span>
                            </span>
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
