import {html, LitElement} from "lit";
import {customElement, property} from "lit/decorators.js";
import {PartTimestamps, Timestamp} from "../../server/storage/dbTypes";
import {ClientApis} from "../common/api/ClientApi";
import "../elements/InputElement";

@customElement('timestampedit-element')
export class TimestampEditElement extends LitElement {

    @property()
    part_timestamps: PartTimestamps;

    @property()
    getCurrTime: () => number;
    @property()
    seek: (second: number) => void;
    @property()
    refresh: (timestamps: Timestamp[]) => void;

    createRenderRoot() {
        return this;
    }

    private refreshTimestamps() {
        if (this.refresh) this.refresh(this.part_timestamps.timestamps);
        this.requestUpdate();
    }

    private addTimestamp(input: string) {
        input = input.trim();
        if (!input.length) return;
        let aid = this.part_timestamps.aid;
        let part = this.part_timestamps.index;
        ClientApis.AddTimestamp.fetch({}, { aid: aid, part: part, time_second: this.getCurrTime(), name: input }).then(content => {
            this.part_timestamps.timestamps.push(content);
            this.refreshTimestamps();
        });
    }

    private removeTimestamp(tid: number) {
        if (!this.part_timestamps.timestamps.find(i => i.tid === tid)) return;
        ClientApis.RemoveTimestamp.fetch(tid).then(content => {
            this.part_timestamps.timestamps = this.part_timestamps.timestamps.filter(i => i.tid !== tid);
            this.refreshTimestamps();
        });
    }

    render() {
        if (!this.part_timestamps) return html``;

        let timestamps = this.part_timestamps.timestamps;
        timestamps.sort((a, b) => a.time_second - b.time_second);

        let lines = [];

        for (let timestamp of timestamps) {
            lines.push(html`
                <li style="margin: 5px 0;"><a style="padding: 0 5px; text-decoration: none;" href="#" @click=${(e: Event) => {
                    this.seek(timestamp.time_second);
                    e.preventDefault();
                    return true;
                }}>${timestamp.name}</a>
                    <button @click=${() => this.removeTimestamp(timestamp.tid)}>删除</button>
                </li>
            `);
        }

        return html`
            <input-element .placeholder=${"新增时间点名称"} .input=${""} .buttonText=${"新增"} .checkInput="${(input: string) => this.addTimestamp(input)}" .showClearButton=${false}></input-element>
            <ul style="padding: 0; margin: 0; max-width: 100%;">
                ${lines}
            </ul>
        `;
    }

}
