import {css, html, LitElement, type PropertyValues} from "lit";
import {customElement, property, state} from "lit/decorators.js";
import type {Danmaku} from "../../server/download/Bilibili";
import {formatTime} from "./formatTime";

const ROW_HEIGHT = 30;
const OVERSCAN = 8;

@customElement("danmakulist-element")
export class DanmakuListElement extends LitElement {
    @property({attribute: false})
    danmakuList: Danmaku[] = [];
    @property({attribute: false})
    seek: (second: number) => void;
    @property({attribute: false})
    onUpdateDanmaku: () => void;

    @state()
    private sortDesc: boolean = false;
    @state()
    private listScrollTop: number = 0;
    @state()
    private viewportHeight: number = 460;

    private lastList: Danmaku[] | undefined;
    private lastSortDesc: boolean = false;
    private sortedCache: Danmaku[] = [];
    private resizeObserver: ResizeObserver | undefined;

    private getSortedList(): Danmaku[] {
        const list = this.danmakuList || [];
        if (this.lastList === list && this.lastSortDesc === this.sortDesc) {
            return this.sortedCache;
        }
        const copy = [...list];
        copy.sort((a, b) => this.sortDesc ? b.time - a.time : a.time - b.time);
        this.lastList = list;
        this.lastSortDesc = this.sortDesc;
        this.sortedCache = copy;
        return copy;
    }

    protected firstUpdated(_changedProperties: PropertyValues): void {
        const viewport = this.shadowRoot?.querySelector<HTMLElement>(".list-viewport");
        if (!viewport) return;
        this.viewportHeight = viewport.clientHeight || 460;
        this.resizeObserver = new ResizeObserver(() => {
            if (viewport.clientHeight > 0) {
                this.viewportHeight = viewport.clientHeight;
            }
        });
        this.resizeObserver.observe(viewport);
    }

    disconnectedCallback(): void {
        super.disconnectedCallback();
        if (this.resizeObserver) {
            this.resizeObserver.disconnect();
            this.resizeObserver = undefined;
        }
    }

    protected updated(changedProperties: PropertyValues): void {
        if (changedProperties.has("danmakuList")) {
            this.resetScroll();
        }
    }

    private resetScroll() {
        this.listScrollTop = 0;
        const viewport = this.shadowRoot?.querySelector<HTMLElement>(".list-viewport");
        if (viewport) viewport.scrollTop = 0;
    }

    private toggleSort() {
        this.sortDesc = !this.sortDesc;
        this.resetScroll();
    }

    private onScroll(e: Event) {
        const target = e.currentTarget as HTMLElement;
        this.listScrollTop = target.scrollTop;
    }

    render() {
        const sorted = this.getSortedList();
        const total = sorted.length;
        const start = Math.max(0, Math.floor(this.listScrollTop / ROW_HEIGHT) - OVERSCAN);
        const end = Math.min(total, Math.ceil((this.listScrollTop + this.viewportHeight) / ROW_HEIGHT) + OVERSCAN);

        const rows = [];
        for (let i = start; i < end; i++) {
            const item = sorted[i];
            const timeText = formatTime(item.time);
            rows.push(html`
                <div class="row"
                    style="top: ${i * ROW_HEIGHT}px"
                    title="${timeText} ${item.text}"
                    @dblclick=${() => this.seek && this.seek(item.time)}>
                    <span class="time">${timeText}</span>
                    <span class="text">${item.text}</span>
                </div>
            `);
        }

        return html`
            <div class="container">
                <div class="header">
                    <span class="count">${total} 条弹幕</span>
                    <div class="actions">
                        <button type="button" @click=${() => this.toggleSort()}>${this.sortDesc ? "时间 ↓" : "时间 ↑"}</button>
                        <button type="button" @click=${() => this.onUpdateDanmaku && this.onUpdateDanmaku()}>更新弹幕</button>
                    </div>
                </div>
                <div class="list-viewport" @scroll=${(e: Event) => this.onScroll(e)}>
                    ${total === 0 ? html`
                        <div class="empty">暂无弹幕</div>
                    ` : html`
                        <div class="list-spacer" style="height: ${total * ROW_HEIGHT}px">
                            ${rows}
                        </div>
                    `}
                </div>
            </div>
        `;
    }

    static styles = css`
        :host {
            display: block;
            box-sizing: border-box;
            width: 100%;
            height: 100%;
            min-height: 0;
        }
        .container {
            display: flex;
            flex-direction: column;
            width: 100%;
            height: 100%;
            min-height: 0;
        }
        .header {
            flex: 0 0 auto;
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 8px;
            padding: 8px 10px;
            border-bottom: 1px solid #edf0f5;
            background: var(--surface, #fff);
        }
        .count {
            color: var(--muted, #667085);
            font-size: 12px;
            white-space: nowrap;
        }
        .actions {
            display: flex;
            align-items: center;
            gap: 6px;
        }
        button {
            box-sizing: border-box;
            height: 26px;
            padding: 0 8px;
            border: 1px solid #d0d5dd;
            border-radius: 6px;
            background: #fff;
            color: #344054;
            font: inherit;
            font-size: 12px;
            white-space: nowrap;
            cursor: pointer;
            transition: background-color .15s ease, border-color .15s ease, color .15s ease;
        }
        button:hover {
            border-color: #98a2b3;
            background: #f8fafc;
            color: var(--primary, #2563eb);
        }
        .list-viewport {
            position: relative;
            flex: 1;
            min-height: 0;
            overflow-y: auto;
            overflow-x: hidden;
            scrollbar-width: thin;
            scrollbar-color: #cbd5e1 transparent;
        }
        .list-spacer {
            position: relative;
            width: 100%;
        }
        .row {
            position: absolute;
            left: 0;
            right: 0;
            box-sizing: border-box;
            height: 30px;
            padding: 0 10px;
            display: flex;
            align-items: center;
            gap: 8px;
            cursor: pointer;
            user-select: none;
            transition: background-color .12s ease;
        }
        .row:hover {
            background: #f8fafc;
        }
        .time {
            flex-shrink: 0;
            width: 52px;
            color: var(--muted, #667085);
            font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
            font-size: 12px;
            font-variant-numeric: tabular-nums;
            transition: color .12s ease;
        }
        .row:hover .time {
            color: var(--primary, #2563eb);
        }
        .text {
            flex: 1;
            min-width: 0;
            overflow: hidden;
            color: #344054;
            font-size: 12.5px;
            text-overflow: ellipsis;
            white-space: nowrap;
        }
        .empty {
            padding: 48px 16px;
            color: var(--muted, #667085);
            font-size: 13px;
            text-align: center;
        }
    `;
}
