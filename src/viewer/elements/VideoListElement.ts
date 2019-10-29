import {html, LitElement, property} from "lit-element";
import {repeat} from "lit-html/directives/repeat";
import {VideoBlockElement} from "./VideoElements";
import {VideoDB} from "../../server/storage/dbTypes";

export class VideoListElement extends LitElement {

    static register() {
        VideoBlockElement.register();
        customElements.define('videolist-element', VideoListElement);
    }

    @property()
    videos: VideoDB [];

    render() {
        return html`
            <ul>
                ${repeat(this.videos, (video: VideoDB) => html`<videoblock-element .video=${video}></videoblock-element>`)}
            </ul>
        `;
    }

}