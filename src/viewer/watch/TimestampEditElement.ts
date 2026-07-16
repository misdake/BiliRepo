import {css, html, LitElement} from "lit";
import {customElement, property} from "lit/decorators.js";
import {PartTimestamps, Timestamp} from "../../server/storage/dbTypes";
import {ClientApis, showRequestError} from "../common/api/ClientApi";
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
        }).catch(error => {
            showRequestError("新增时间点", error);
        });
    }

    private removeTimestamp(tid: number) {
        if (!this.part_timestamps.timestamps.find(i => i.tid === tid)) return;
        ClientApis.RemoveTimestamp.fetch(tid).then(content => {
            this.part_timestamps.timestamps = this.part_timestamps.timestamps.filter(i => i.tid !== tid);
            this.refreshTimestamps();
        }).catch(error => {
            showRequestError("删除时间点", error);
        });
    }

    render() {
        if (!this.part_timestamps) return html``;

        let timestamps = this.part_timestamps.timestamps;
        timestamps.sort((a, b) => a.time_second - b.time_second);

        let lines = [];

        for (let timestamp of timestamps) {
            lines.push(html`
                <li><a href="#" @click=${(e: Event) => {
                    this.seek(timestamp.time_second);
                    e.preventDefault();
                    return true;
                }}>${timestamp.name}</a>
                    <button @click=${() => this.removeTimestamp(timestamp.tid)}>删除</button>
                </li>
            `);
        }

        return html`
            <input-element .placeholder=${"新增时间点名称"} .input=${""} .buttonText=${"新增"} .checkInput=${(input: string) => this.addTimestamp(input)}></input-element>
            <ul>
                ${lines}
            </ul>
        `;
    }

    static styles = css`
        :host { display: block; color: #344054; }
        ul { padding: 0; margin: 10px 0 0; list-style: none; }
        li {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 8px;
            min-height: 38px;
            padding: 5px 7px;
            border-bottom: 1px solid #edf0f5;
        }
        a {
            min-width: 0;
            overflow: hidden;
            color: #2563eb;
            text-decoration: none;
            text-overflow: ellipsis;
            white-space: nowrap;
        }
        button {
            padding: 5px 8px;
            border: 1px solid #d0d5dd;
            border-radius: 6px;
            background: #fff;
            color: #b42318;
            cursor: pointer;
        }
    `;

}
