import {customElement, html, LitElement, property} from "lit-element";
import {VideoDB} from "../../server/storage/dbTypes";
import "./VideoElements";
import {PagedContainer} from "./PagedContainer";
import {repeat} from "lit-html/directives/repeat";

@customElement('videolist-element')
export class VideoListElement extends LitElement {

    @property()
    videos: VideoDB[];

    createRenderRoot() {
        return this;
    }

    render() {
        return html`
            <ul style="padding: 0; margin: 0 -10px;">
                ${repeat(this.videos, (video: VideoDB) => html`<videoblock-element .video=${video}></videoblock-element>`)}
            </ul>
        `;
    }

}

@customElement('pagedvideo-container')
export class PagedVideoContainer extends PagedContainer<VideoDB> {

    constructor() {
        super();
        super.listRenderer = list => html`<videolist-element .videos=${list.result}></videolist-element>`;
    }

}
