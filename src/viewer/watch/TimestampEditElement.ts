import {css, html, LitElement} from "lit";
import {customElement, property} from "lit/decorators.js";
import {PartTimestamps, Timestamp} from "../../server/storage/dbTypes";
import {ClientApis, showRequestError} from "../common/api/ClientApi";
import "../elements/InputElement";
import {formatTime} from "./formatTime";

@customElement('timestampedit-element')
export class TimestampEditElement extends LitElement {

    @property()
    part_timestamps: PartTimestamps;

    @property()
    getCurrTime: () => number;
    @property()
    seek: (second: number) => void;
    @property()
    onChange: (timestamps: Timestamp[]) => void;

    private addTimestamp(input: string) {
        input = input.trim();
        if (!input.length) return;
        let aid = this.part_timestamps.aid;
        let part = this.part_timestamps.index;
        ClientApis.AddTimestamp.fetch({}, { aid: aid, part: part, time_second: this.getCurrTime(), name: input }).then(content => {
            // don't mutate the part_timestamps prop: hand a new array to the owner
            if (this.onChange) this.onChange([...this.part_timestamps.timestamps, content]);
        }).catch(error => {
            showRequestError("新增时间点", error);
        });
    }

    private removeTimestamp(tid: number) {
        const target = this.part_timestamps.timestamps.find(i => i.tid === tid);
        if (!target) return;
        if (!window.confirm(`确认删除时间点「${target.name}」吗？`)) return;
        ClientApis.RemoveTimestamp.fetch(tid).then(content => {
            if (this.onChange) this.onChange(this.part_timestamps.timestamps.filter(i => i.tid !== tid));
        }).catch(error => {
            showRequestError("删除时间点", error);
        });
    }

    render() {
        if (!this.part_timestamps) return html``;

        let timestamps = [...this.part_timestamps.timestamps].sort((a, b) => a.time_second - b.time_second);

        let lines = [];

        for (let timestamp of timestamps) {
            const timeText = formatTime(timestamp.time_second);
            lines.push(html`
                <li><a href="#" title="${timeText} ${timestamp.name}" @click=${(e: Event) => {
                    this.seek(timestamp.time_second);
                    e.preventDefault();
                    return true;
                }}><span class="time">${timeText}</span><span class="name">${timestamp.name}</span></a>
                    <button @click=${() => this.removeTimestamp(timestamp.tid)}>删除</button>
                </li>
            `);
        }

        return html`
            <input-element .placeholder=${"新增时间点名称"} .input=${""} .buttonText=${"新增"} .checkInput=${(input: string) => this.addTimestamp(input)}></input-element>
            ${lines.length === 0 ? html`
                <div class="empty">暂无时间点，输入名称即可标记当前播放位置。</div>
            ` : html`
                <ul>
                    ${lines}
                </ul>
            `}
        `;
    }

    static styles = css`
        :host { display: block; color: #344054; }
        input-element {
            display: block;
            width: 100%;
            --control-height: 34px;
            --input-width: 0px;
        }
        ul { padding: 0; margin: 12px 0 0; list-style: none; }
        li {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 6px;
            min-height: 38px;
            padding: 0 6px 0 0;
            border-bottom: 1px solid #edf0f5;
        }
        li:last-child { border-bottom: 0; }
        a {
            box-sizing: border-box;
            display: flex;
            align-items: center;
            gap: 8px;
            flex: 1;
            min-width: 0;
            min-height: 38px;
            padding: 8px 6px;
            border-radius: 6px;
            color: var(--primary, #2563eb);
            font-size: 13px;
            line-height: 18px;
            text-decoration: none;
            transition: background-color .15s ease, color .15s ease;
        }
        a:hover {
            background: #f8fafc;
            color: #1d4ed8;
        }
        a:hover .name {
            text-decoration: underline;
        }
        .time {
            flex-shrink: 0;
            padding: 1px 6px;
            border-radius: 4px;
            background: #eef2f6;
            color: #475467;
            font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
            font-size: 12px;
            line-height: 18px;
            font-variant-numeric: tabular-nums;
            transition: background-color .15s ease, color .15s ease;
        }
        a:hover .time {
            background: #dbeafe;
            color: #1d4ed8;
        }
        .name {
            flex: 1;
            min-width: 0;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }
        button {
            flex-shrink: 0;
            align-self: center;
            padding: 4px 8px;
            border: 1px solid #f4c7c3;
            border-radius: 6px;
            background: #fff;
            color: var(--danger, #b42318);
            font: inherit;
            font-size: 12px;
            line-height: 1.3;
            cursor: pointer;
            transition: background-color .15s ease, border-color .15s ease;
        }
        button:hover {
            background: #fff6f5;
            border-color: #e9a39d;
        }
        .empty {
            margin-top: 12px;
            padding: 28px 14px;
            border: 1px dashed #d0d5dd;
            border-radius: 8px;
            color: var(--muted, #667085);
            font-size: 13px;
            line-height: 1.5;
            text-align: center;
        }
    `;

}
