import {css, html, LitElement} from "lit";
import {customElement, property} from "lit/decorators.js";
import type {VideoDB} from "../../server/storage/dbTypes";
import "./MediaCardElement";

@customElement('videoblock-element')
export class VideoBlockElement extends LitElement {

    @property()
    video: VideoDB;

    @property()
    params: { key: string, value: number }[];

    static styles = css`:host { display: block; min-width: 0; height: 100%; }`;

    render() {
        let param = this.params ? "&" + this.params.map(i => `${i.key}=${i.value}`).join("&") : "";
        return html`<media-card-element
            .href=${'watch.html?aid=' + this.video.aid + param}
            .thumbnailAid=${this.video.aid}
            .title=${this.video.title}
        ></media-card-element>`;
    }

}
