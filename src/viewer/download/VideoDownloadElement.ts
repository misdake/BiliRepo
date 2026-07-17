import {css, html, LitElement} from "lit";
import {customElement, property} from "lit/decorators.js";
import {VideoStatus} from "../../common/DownloadStatus";

@customElement('videodownload-element')
export class VideoDownloadElement extends LitElement {

    @property()
    video: VideoStatus;

    static styles = css`        
        :host { display: block; }
        .download-detail {
            display: grid;
            grid-template-columns: 176px minmax(0, 1fr);
            gap: 16px;
            padding: 14px;
        }
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
            cursor: default;
            width: 160px;
        }
        .title {
            left: 0;
            top: 100px;
            width: 160px;
        }
        
        .right { 
            cursor: default;
            min-width: 0;
        }
        .part_state {
            display: inline-flex;
            width: 15px;
            white-space: nowrap;
            overflow: hidden;
        }
        .part_title {
            display: inline-flex;
            width: calc(100% - 94px);
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
            width: calc(100% - 15px);
            left: 15px;
        }
    `;

    render() {
        const EMPTY_THUMB = "data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs%3D";
        let title = this.video ? (this.video.title || "") : "";
        let pic = this.video ? (this.video.pic || EMPTY_THUMB) : EMPTY_THUMB;

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
                                <span class="part_size">${part.quality} ${part.curr || "?"} / ${part.total || "?"}</span>
                            </span>
                            <progress class="part_progress" max="100" value="${part.progress}"></progress>
                        </div>
                    `);
                }
            }
        }

        let video = !this.video ? html`` : html`
            <div class="download-detail">
                <div class="left">
                    <div class="thumbContainer">
                        <img class="thumb" src="${pic}" alt="thumb"/>
                    </div>
                    <div class="title">${title}</div>
                </div>
                <div class="right">
                    ${parts}
                </div>
            </div>
        `;

        return html`
            ${video}
        `;
    }

}
