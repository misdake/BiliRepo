import {css, html, LitElement} from "lit";
import {customElement, property} from "lit/decorators.js";
import type {Timestamp} from "../../server/storage/dbTypes";
import {PagedContainer} from "./PagedContainer";
import {repeat} from "lit/directives/repeat.js";
import {mediaGridStyles} from "./MediaCardElement";
import "./MediaCardElement";

@customElement('timestampblock-element')
export class TimestampBlockElement extends LitElement {

    @property()
    timestamp: Timestamp;

    static styles = css`:host { display: block; min-width: 0; height: 100%; }`;

    render() {
        return html`<media-card-element
            .href=${`watch.html?aid=${this.timestamp.aid}&p=${this.timestamp.part}&t=${~~this.timestamp.time_second}`}
            .thumbnailAid=${this.timestamp.aid}
            .title=${this.timestamp.name}
        ></media-card-element>`;
    }

}

@customElement('timestamplist-element')
export class TimestampListElement extends LitElement {

    @property()
    timestamps: Timestamp[];

    render() {
        return html`
            <ul>
                ${repeat(this.timestamps, (timestamp: Timestamp) => html`<timestampblock-element .timestamp=${timestamp}></timestampblock-element>`)}
            </ul>
        `;
    }

    static styles = mediaGridStyles;

}

@customElement('pagedtimestamp-container')
export class PagedTimestampContainer extends PagedContainer<Timestamp> {

    constructor() {
        super();
        this.listRenderer = list => html`
            <timestamplist-element .timestamps=${list.result}></timestamplist-element>`;
    }

}
