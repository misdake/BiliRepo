import {customElement, html, LitElement, property} from "lit-element";
import {VideoDB} from "../../server/storage/dbTypes";
import "./VideoElements";
import {PagedContainer} from "./PagedContainer";
import {repeat} from "lit-html/directives/repeat";
import {ClientApis} from "../common/api/ClientApi";

@customElement('videolist-element')
export class VideoListElement extends LitElement {

    @property()
    videos: VideoDB[];

    @property()
    params: { key: string, value: number }[];

    createRenderRoot() {
        return this;
    }

    render() {
        return html`
            <ul style="padding: 0; margin: 0 -10px;">
                ${repeat(this.videos, (video: VideoDB) => html`<videoblock-element .video=${video} .params=${this.params}></videoblock-element>`)}
            </ul>
        `;
    }

}

@customElement('pagedvideo-container')
export class PagedVideoContainer extends PagedContainer<VideoDB> {

    @property()
    params: { key: string, value: number }[];

    private openRandom() {
        ClientApis.GetVideoRandom.fetch({}).then(video => {
            window.open(`watch.html?aid=${video.aid}`, '_blank');
        });
    }

    constructor() {
        super();
        super.rightRenderer = () => html`
            <button style="float: right;" @click=${() => this.openRandom()}>随机视频</button>
        `;
        super.listRenderer = list => html`<videolist-element .videos=${list.result} .params=${this.params}></videolist-element>`;
    }

}
