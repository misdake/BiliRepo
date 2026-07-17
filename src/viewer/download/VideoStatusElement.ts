import {css, html, LitElement} from "lit";
import {customElement, property} from "lit/decorators.js";
import {VideoStatus} from "../../common/DownloadStatus";

@customElement('videostatus-element')
export class VideoStatusElement extends LitElement {

    @property()
    video: VideoStatus;
    @property()
    iconShow: boolean;
    @property()
    icon: string;
    @property()
    onIconClick: () => void;

    static styles = css`
        :host { display: block; }
        a {
            display: block;
            color: inherit;
            text-decoration: none;
        }
        .videoItem {
            display: grid;
            grid-template-columns: 112px minmax(0, 1fr);
            gap: 10px;
            min-height: 76px;
            padding: 10px;
            border-bottom: 1px solid #edf0f5;
            position: relative;
            overflow: hidden;
        }
        .videoItem:hover { background: #f8fafc; }
        .thumbContainer {
            width: 112px;
            height: 63px;
            position: relative;
            border-radius: 6px;
            overflow: hidden;
        }
        
        .thumb {
            object-fit: cover;
            width: 100%;
            height: 100%;
        }
        .title {
            display: -webkit-box;
            padding-right: 2px;
            color: #172033;
            font-size: 13px;
            font-weight: 600;
            line-height: 1.45;
            -webkit-box-orient: vertical;
            -webkit-line-clamp: 3;
            overflow: hidden;
        }
        .icon {
            padding: 5px 8px;
            border: 1px solid #d0d5dd;
            border-radius: 6px;
            background: rgba(255, 255, 255, .94);
            color: #b42318;
            cursor: pointer;
            position: absolute;
            bottom: 8px;
            right: 8px;
            display: block;
            font-size: 12px;
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

        let iconCss = (this.icon && this.iconShow) ? "display: block;" : "";
        let icon = this.icon ? html`<div class="icon" style=${iconCss} @click="${() => this.trigger()}">${this.icon}</div>` : html``;

        let video = !this.video ? html`
            <div class="videoItem">
                <div class="thumbContainer" style="background:#CCCCCC">
                </div>
                <span class="title">输入视频编号后在这里确认</span>
            </div>
        ` : html`
            <div class="videoItem">
                <div class="thumbContainer">
                    <img class="thumb" src="${this.video.pic}" alt="thumb"/>
                </div>
                <span class="title">${this.video.title}</span>
                ${icon}
            </div>
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
