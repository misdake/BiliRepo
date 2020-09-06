import {css, customElement, html, LitElement, property} from "lit-element";
import {Timestamp} from "../../server/storage/dbTypes";
import "./InputElement";
import {PagedContainer} from "./PagedContainer";
import {repeat} from "lit-html/directives/repeat";

@customElement('timestampblock-element')
export class TimestampBlockElement extends LitElement {

    @property()
    timestamp: Timestamp;

    static styles = css`
        .timestampItem {
            display: inline;
            float: left;
            margin: 10px;
            width: 305px;
            height: 228px;
            overflow: hidden;
        }
        
        a {
            text-decoration: none;
        }
        
        .thumbContainer {
            width: 305px;
            height: 180px;
            position: relative;
            margin-bottom: 3px;
        }
        
        .thumb {
            display: block;
            object-fit: cover;
            max-width: 305px;
            max-height: 180px;
            width: 100%;
            height: 100%;
        }
    `;

    render() {
        return html`
            <li class="timestampItem">
                <a href=${`watch.html?aid=${this.timestamp.aid}&p=${this.timestamp.part}&t=${~~this.timestamp.time_second}`}>
                    <div class="thumbContainer">
                        <img class="thumb" src="${serverConfig.repoRoot}repo/${this.timestamp.aid}/thumb.jpg" alt="thumb"/>
                    </div>
                    <span>${this.timestamp.name}</span>
                </a>
            </li>
        `;
    }

}

@customElement('timestamplist-element')
export class TimestampListElement extends LitElement {

    @property()
    timestamps: Timestamp[];

    createRenderRoot() {
        return this;
    }

    render() {
        return html`
            <ul style="padding: 0; margin: 0 -16px;">
                ${repeat(this.timestamps, (timestamp: Timestamp) => html`<timestampblock-element style="float: left;" .timestamp=${timestamp}></timestampblock-element>`)}
            </ul>
        `;
    }

}

@customElement('pagedtimestamp-container')
export class PagedTimestampContainer extends PagedContainer<Timestamp> {

    constructor() {
        super();
        super.listRenderer = list => html`<timestamplist-element .timestamps=${list.result}></timestamplist-element>`;
    }

}
