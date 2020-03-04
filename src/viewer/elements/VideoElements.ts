import {css, customElement, html, LitElement, property} from "lit-element";
import {PartDB, VideoDB} from "../../server/storage/dbTypes";

@customElement('videolabel-element')
export class VideoLabelElement extends LitElement {

    @property()
    video: VideoDB;
    @property()
    part: PartDB;

    @property()
    videoSelected: boolean;
    @property()
    partSelected: boolean;

    @property()
    onitemclick: () => void;

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
        .videoItemSelected {
            background: #e5f5fb;
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
        
        .part {
            display: inline;
            float: left;
            margin-left: 20px;
            padding: 10px;
            width: 280px;
            position: relative;
            overflow: hidden;
        }
        .partSelected {
            background: #e5f5fb;
        }
    `;

    render() {
        let videoClass = this.videoSelected ? "videoItem videoItemSelected" : "videoItem";
        let partClass = this.partSelected ? "part partSelected" : "part";
        let video = !this.video ? html`` : html`
            <li class="${videoClass}" @click=${() => this.onitemclick()}>
                <div class="thumbContainer">
                    <img class="thumb" src="repo/${this.video.aid}/thumb.jpg" alt="thumb"/>
                </div>
                <span class="title">${this.video.title}</span>
            </li>`;
        let part = !this.part ? html`` : html`
            <li class="${partClass}" @click=${() => this.onitemclick()}>
                <span>${this.part.index}</span>
            </li>`;

        return html`
            ${video}
            ${part}
        `;
    }

}

@customElement('videoblock-element')
export class VideoBlockElement extends LitElement {

    @property()
    video: VideoDB;

    static styles = css`
        .videoItem {
            display: inline;
            float: left;
            margin: 10px;
            width: 320px;
            height: 240px;
            overflow: hidden;
        }
        
        .thumbContainer {
            width: 320px;
            height: 180px;
            position: relative;
        }
        
        .thumb {
            display: block;
            object-fit: cover;
            max-width: 320px;
            max-height: 180px;
            width: 100%;
            height: 100%;
        }
    `;

    render() {
        return html`
            <li class="videoItem">
                <a href=${'watch.html?aid=' + this.video.aid}>
                    <div class="thumbContainer">
                        <img class="thumb" src="repo/${this.video.aid}/thumb.jpg" alt="thumb"/>
                    </div>
                    <span>${this.video.title}</span>
                </a>
            </li>
        `;
    }

}
