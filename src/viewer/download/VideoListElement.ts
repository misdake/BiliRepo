import {css, html, LitElement} from "lit";
import {customElement, property} from "lit/decorators.js";
import {repeat} from "lit/directives/repeat.js";
import {VideoStatus} from "../../common/DownloadStatus";

@customElement('download-video-list-element')
export class VideoListElement extends LitElement {

    @property()
    videos: VideoStatus[];

    @property()
    icon: string;
    @property()
    onIconClick: (video: VideoStatus) => void;

    static styles = css`
        :host { display: block; }
        ul { padding: 0; margin: 0; list-style: none; }
    `;

    private atIconClick(video: VideoStatus) {
        if (this.onIconClick) {
            this.onIconClick(video);
        }
    }

    render() {
        return !this.videos ? html`` : html`
            <ul>
                ${repeat(this.videos, (video: VideoStatus) => html`
                    <videostatus-element .video=${video} .icon=${this.icon ? this.icon : undefined} .onIconClick=${() => this.atIconClick(video)}></videostatus-element>
                `)}
            </ul>
        `;
    }

}
