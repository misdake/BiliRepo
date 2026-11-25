import {css, html, LitElement, type PropertyValues} from "lit";
import {customElement, property, state} from "lit/decorators.js";
import type {Danmaku} from "../../server/download/Bilibili";
import {formatTime} from "./formatTime";
import {
    DANMAKU_FONT_EFFECTS,
    DANMAKU_SCALE_STOPS,
    DanmakuFontEffect,
    DanmakuPrefs,
    DEFAULT_DANMAKU_PREFS,
    isDefaultDanmakuPrefs,
    scaleToStopIndex,
} from "./danmakuPrefs";

const ROW_HEIGHT = 30;
const OVERSCAN = 8;

@customElement("danmakulist-element")
export class DanmakuListElement extends LitElement {
    @property({attribute: false})
    danmakuList: Danmaku[] = [];
    @property({attribute: false})
    danmakuPrefs: DanmakuPrefs = DEFAULT_DANMAKU_PREFS;
    @property({attribute: false})
    onDanmakuPrefsChange: (prefs: DanmakuPrefs) => void;
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
    @state()
    private settingsOpen: boolean = false;

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

    private emitPrefs(patch: Partial<DanmakuPrefs>) {
        if (!this.onDanmakuPrefsChange) return;
        const current = this.danmakuPrefs || DEFAULT_DANMAKU_PREFS;
        this.onDanmakuPrefsChange({ ...current, ...patch });
    }

    private renderSettingsDrawer(prefs: DanmakuPrefs) {
        const fontIndex = scaleToStopIndex(prefs.fontScale);
        const speedIndex = scaleToStopIndex(prefs.speedScale);

        return html`
            <div class="settings-drawer">
                <label class="setting-row">
                    <span class="setting-label">字号</span>
                    <input type="range"
                        min="0"
                        max="${DANMAKU_SCALE_STOPS.length - 1}"
                        step="1"
                        .value=${String(fontIndex)}
                        @input=${(e: Event) => {
                            const idx = Number((e.target as HTMLInputElement).value);
                            this.emitPrefs({ fontScale: DANMAKU_SCALE_STOPS[idx] });
                        }} />
                    <span class="setting-val">${prefs.fontScale}x</span>
                </label>
                <label class="setting-row">
                    <span class="setting-label">速度</span>
                    <input type="range"
                        min="0"
                        max="${DANMAKU_SCALE_STOPS.length - 1}"
                        step="1"
                        .value=${String(speedIndex)}
                        @input=${(e: Event) => {
                            const idx = Number((e.target as HTMLInputElement).value);
                            this.emitPrefs({ speedScale: DANMAKU_SCALE_STOPS[idx] });
                        }} />
                    <span class="setting-val">${prefs.speedScale}x</span>
                </label>
                <div class="setting-row">
                    <span class="setting-label">效果</span>
                    <div class="effect-group">
                        ${DANMAKU_FONT_EFFECTS.map(fx => html`
                            <button type="button"
                                class="effect-btn ${prefs.fontEffect === fx.id ? "active" : ""}"
                                @click=${() => this.emitPrefs({ fontEffect: fx.id as DanmakuFontEffect })}>
                                ${fx.label}
                            </button>
                        `)}
                    </div>
                </div>
                <div class="setting-footer">
                    <label class="scale-check">
                        <input type="checkbox"
                            .checked=${prefs.scaleWithPlayer}
                            @change=${(e: Event) => this.emitPrefs({ scaleWithPlayer: (e.target as HTMLInputElement).checked })} />
                        <span>随播放器尺寸缩放</span>
                    </label>
                    <button type="button"
                        class="reset-btn"
                        ?disabled=${isDefaultDanmakuPrefs(prefs)}
                        @click=${() => this.onDanmakuPrefsChange && this.onDanmakuPrefsChange({ ...DEFAULT_DANMAKU_PREFS })}>
                        重置
                    </button>
                </div>
            </div>
        `;
    }

    render() {
        const prefs = this.danmakuPrefs || DEFAULT_DANMAKU_PREFS;
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
                        <button type="button"
                            class="icon-btn ${this.settingsOpen ? "active" : ""}"
                            title="弹幕显示设置"
                            aria-label="弹幕显示设置"
                            @click=${() => { this.settingsOpen = !this.settingsOpen; }}>
                            <svg viewBox="0 0 24 24" aria-hidden="true">
                                <path d="M4 6h16M4 12h16M4 18h16"></path>
                                <circle cx="9" cy="6" r="2.2" fill="currentColor" stroke="none"></circle>
                                <circle cx="15" cy="12" r="2.2" fill="currentColor" stroke="none"></circle>
                                <circle cx="10" cy="18" r="2.2" fill="currentColor" stroke="none"></circle>
                            </svg>
                        </button>
                    </div>
                </div>
                ${this.settingsOpen ? this.renderSettingsDrawer(prefs) : ""}
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
        .icon-btn {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: 26px;
            padding: 0;
        }
        .icon-btn svg {
            width: 14px;
            height: 14px;
            fill: none;
            stroke: currentColor;
            stroke-width: 1.8;
            stroke-linecap: round;
        }
        .icon-btn.active {
            border-color: var(--primary, #2563eb);
            background: #eaf1ff;
            color: var(--primary, #2563eb);
        }
        .settings-drawer {
            flex: 0 0 auto;
            padding: 10px 12px;
            display: flex;
            flex-direction: column;
            gap: 9px;
            border-bottom: 1px solid var(--border, #dfe4ec);
            background: var(--surface-subtle, #f8fafc);
        }
        .setting-row {
            display: flex;
            align-items: center;
            gap: 8px;
        }
        .setting-label {
            flex-shrink: 0;
            width: 30px;
            color: #475467;
            font-size: 12px;
            font-weight: 600;
        }
        .setting-row input[type="range"] {
            flex: 1;
            min-width: 0;
            margin: 0;
            accent-color: var(--primary, #2563eb);
            cursor: pointer;
        }
        .setting-val {
            flex-shrink: 0;
            width: 38px;
            text-align: right;
            color: #344054;
            font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
            font-size: 12px;
            font-variant-numeric: tabular-nums;
        }
        .effect-group {
            flex: 1;
            min-width: 0;
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 4px;
        }
        .effect-btn {
            height: 26px;
            padding: 0 4px;
            font-size: 11.5px;
        }
        .effect-btn.active {
            border-color: var(--primary, #2563eb);
            background: var(--primary, #2563eb);
            color: #fff;
        }
        .setting-footer {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 8px;
            padding-top: 2px;
        }
        .scale-check {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            color: #344054;
            font-size: 12px;
            user-select: none;
            cursor: pointer;
        }
        .scale-check input[type="checkbox"] {
            margin: 0;
            accent-color: var(--primary, #2563eb);
            cursor: pointer;
        }
        .reset-btn:disabled {
            opacity: .45;
            cursor: default;
        }
        .reset-btn:disabled:hover {
            border-color: #d0d5dd;
            background: #fff;
            color: #344054;
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
