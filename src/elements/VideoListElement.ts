import {html, LitElement, property} from "lit-element";
import {BilibiliVideo} from "../common/types";
import {repeat} from "lit-html/directives/repeat";
import {VideoBlockElement} from "./VideoElements";

export class VideoListElement extends LitElement {

    static register() {
        VideoBlockElement.register();
        customElements.define('videolist-element', VideoListElement);
    }

    @property()
    videos: BilibiliVideo[];

    render() {
        return html`
            <ul>
                ${repeat(this.videos, (video: BilibiliVideo) => html`<videoblock-element .video=${video}></videoblock-element>`)}
            </ul>
        `;
    }

}