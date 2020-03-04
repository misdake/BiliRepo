import {css, customElement, html, LitElement, property} from "lit-element";
import {repeat} from "lit-html/directives/repeat";
import {VideoStatus} from "../../common/DownloadStatus";

@customElement('videolist-element')
export class VideoListElement extends LitElement {

    @property()
    videos: VideoStatus[];

    @property()
    icon: string;
    @property()
    onIconClick: (video: VideoStatus) => void;

    static style = css`
    `;

    private atIconClick(video: VideoStatus) {
        if (this.onIconClick) {
            this.onIconClick(video);
        }
    }

    render() {
        return !this.videos ? html`` : html`
            <ul style="padding: 0; margin: 0;">
                ${repeat(this.videos, (video: VideoStatus) => html`
                    <videostatus-element .video=${video} .icon=${this.icon ? this.icon : undefined} .onIconClick=${() => this.atIconClick(video)}></videostatus-element>
                `)}
            </ul>
        `;
    }

}
