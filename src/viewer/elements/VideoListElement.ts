import {customElement, html, LitElement, property} from "lit-element";
import {repeat} from "lit-html/directives/repeat";
import "./VideoElements";
import {VideoDB} from "../../server/storage/dbTypes";

@customElement('videolist-element')
export class VideoListElement extends LitElement {

    @property()
    videos: VideoDB[];

    createRenderRoot() {
        return this;
    }

    render() {
        return html`
            <ul style="padding: 0; margin: 0;">
                ${repeat(this.videos, (video: VideoDB) => html`<videoblock-element .video=${video}></videoblock-element>`)}
            </ul>
        `;
    }

}
