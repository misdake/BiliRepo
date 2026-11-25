import DPlayer, { DPlayerAPIBackend } from "dplayer";
import { httpget } from "../common/api/ClientApi";
import { LatestRequest } from "../common/LatestRequest";
import { Timestamp } from "../../server/storage/dbTypes";
import { Danmaku } from "../../server/download/Bilibili";

enum DPlayerEvents {
    abort = 'abort',
    canplay = 'canplay',
    canplaythrough = 'canplaythrough',
    durationchange = 'durationchange',
    emptied = 'emptied',
    ended = 'ended',
    error = 'error',
    loadeddata = 'loadeddata',
    loadedmetadata = 'loadedmetadata',
    loadstart = 'loadstart',
    mozaudioavailable = 'mozaudioavailable',
    pause = 'pause',
    play = 'play',
    playing = 'playing',
    progress = 'progress',
    ratechange = 'ratechange',
    seeked = 'seeked',
    seeking = 'seeking',
    stalled = 'stalled',
    suspend = 'suspend',
    timeupdate = 'timeupdate',
    volumechange = 'volumechange',
    waiting = 'waiting',
    screenshot = 'screenshot',
    thumbnails_show = 'thumbnails_show',
    thumbnails_hide = 'thumbnails_hide',
    danmaku_show = 'danmaku_show',
    danmaku_hide = 'danmaku_hide',
    danmaku_clear = 'danmaku_clear',
    danmaku_loaded = 'danmaku_loaded',
    danmaku_send = 'danmaku_send',
    danmaku_opacity = 'danmaku_opacity',
    contextmenu_show = 'contextmenu_show',
    contextmenu_hide = 'contextmenu_hide',
    notice_show = 'notice_show',
    notice_hide = 'notice_hide',
    quality_start = 'quality_start',
    quality_end = 'quality_end',
    destroy = 'destroy',
    resize = 'resize',
    fullscreen = 'fullscreen',
    fullscreen_cancel = 'fullscreen_cancel',
    subtitle_show = 'subtitle_show',
    subtitle_hide = 'subtitle_hide',
    subtitle_change = 'subtitle_change'
}

export interface DanmakuSetting {
    fontSize: number;
    lineHeight: number;
    velocity: number;
    speedScale: number;
}

export class Player {

    private dp: DPlayer | null = null;
    private readonly apiBackend: DPlayerAPIBackend;

    private aid: number = 0;
    private part: number = 0;
    private danmakuGuard: LatestRequest = new LatestRequest();
    private pendingDanmaku: { aid: number, part: number, token: number } | null = null;
    private container: HTMLElement;
    private onEnded: () => void;
    private danmakuSetting: DanmakuSetting;
    private isFullscreen: boolean = false;
    private readonly resizeObserver: ResizeObserver;
    private lastContainerWidth: number = 0;
    private resizeSeekRaf: number = 0;

    onResize!: (w: number, h: number) => void;

    danmakuList!: Danmaku[];
    onDanmakuLoaded!: (danmakuList: Danmaku[]) => void;

    constructor(container: HTMLElement, onEnded: () => void, danmakuSetting: DanmakuSetting) {
        this.container = container;
        this.danmakuSetting = danmakuSetting;
        this.resizeObserver = new ResizeObserver(() => this.triggerResize());
        this.resizeObserver.observe(this.container);
        this.apiBackend = {
            read: (options) => {
                // Snapshot the pending part: by the time DPlayer calls read()
                // or the response arrives, loadVideoPart() may have moved on
                // to another aid/part and destroyed this player instance.
                const pending = this.pendingDanmaku;
                if (!pending) return;
                httpget(`${serverConfig.repoRoot}repo/${pending.aid}/p${pending.part}.json`, content => {
                    if (!this.danmakuGuard.isCurrent(pending.token)) return;
                    try {
                        let result = JSON.parse(content).data;
                        options.success(result);
                        this.danmakuList = result;
                        if (this.onDanmakuLoaded) this.onDanmakuLoaded(this.danmakuList);
                    } catch (error) {
                        if (options.error) options.error(error);
                    }
                }, error => {
                    if (this.danmakuGuard.isCurrent(pending.token) && options.error) options.error(error);
                });
            },
            send: (options) => {
            }
        };

        this.onEnded = onEnded;
    }

    loadVideoPart(aid: number, part: number, timestamps: Timestamp[]) {
        if (this.aid == aid && this.part == part) return;

        this.aid = aid;
        this.part = part;
        this.pendingDanmaku = { aid, part, token: this.danmakuGuard.begin() };

        if (this.dp) {
            this.cancelPendingResizeSeek();
            this.dp.pause();
            this.dp.destroy();
            this.dp = null;
        }

        let highlight = timestamps.map(timestamp => ({
            text: timestamp.name,
            time: timestamp.time_second,
        }));

        const dp = new DPlayer({
            container: this.container,
            screenshot: false,
            video: { url: `${serverConfig.repoRoot}repo/${aid}/p${part}.mp4` },
            hotkey: true,
            danmaku: { id: '', api: '' },
            apiBackend: this.apiBackend,
            highlight,
        });
        this.dp = dp;
        // @ts-ignore
        dp.danmaku.options.height = this.danmakuSetting.lineHeight;

        this._patchDanmakuEngine(dp);

        dp.on(DPlayerEvents.canplay, () => {
            if (this.timeOnCanplay) {
                this.seek(this.timeOnCanplay);
                this.timeOnCanplay = undefined;
            }
        });
        dp.on(DPlayerEvents.ended, () => {
            if (this.onEnded) this.onEnded();
        });
        dp.on(DPlayerEvents.resize, () => {
            setTimeout(() => this.triggerResize());
        });
        dp.on(DPlayerEvents.fullscreen, () => {
            this.isFullscreen = true;
        });
        dp.on(DPlayerEvents.fullscreen_cancel, () => {
            this.isFullscreen = false;
        });

        this.triggerResize();

        if (!document.hidden) {
            dp.play();
        }
    }

    private cancelPendingResizeSeek() {
        if (this.resizeSeekRaf) {
            cancelAnimationFrame(this.resizeSeekRaf);
            this.resizeSeekRaf = 0;
        }
    }

    private scheduleResizeSeek() {
        if (this.resizeSeekRaf || !this.dp) return;
        this.resizeSeekRaf = requestAnimationFrame(() => {
            this.resizeSeekRaf = 0;
            if (!this.dp) return;
            // @ts-ignore
            this.dp.danmaku.seek();
        });
    }

    unloadPlayer() {
        this.danmakuGuard.begin(); // invalidate any in-flight danmaku request
        this.cancelPendingResizeSeek();
        if (this.dp) {
            this.dp.destroy();
        }
    }

    triggerResize() {
        if (!this.dp) return;
        const w = this.container.clientWidth;
        const h = this.container.clientHeight;
        if (w <= 0 || h <= 0) return;

        const prevFontSize = this.danmakuSetting.fontSize;
        const prevLineHeight = this.danmakuSetting.lineHeight;
        const prevVelocity = this.danmakuSetting.velocity;
        const prevSpeedScale = this.danmakuSetting.speedScale;
        const prevWidth = this.lastContainerWidth;

        if (this.onResize) {
            this.onResize(w, h);
        }

        // @ts-ignore
        this.dp.danmaku.options.height = this.danmakuSetting.lineHeight;

        const changed = prevFontSize !== this.danmakuSetting.fontSize
            || prevLineHeight !== this.danmakuSetting.lineHeight
            || prevVelocity !== this.danmakuSetting.velocity
            || prevSpeedScale !== this.danmakuSetting.speedScale
            || prevWidth !== w;

        if (changed) {
            this.lastContainerWidth = w;
            this.scheduleResizeSeek();
        }
    }

    timeOnCanplay: number | undefined = undefined;

    setTimeOnCanplay(t: number) {
        this.timeOnCanplay = t;
    }

    currentTime() {
        return this.dp ? this.dp.video.currentTime : 0;
    }

    seek(second: number) {
        if (this.dp) {
            this.dp.seek(second);
            this.dp.play();
        }
    }

    toggleFullScreen() {
        if (!this.dp) return;
        if (this.isFullscreen) {
            this.dp.fullScreen.cancel('browser');
        } else {
            this.dp.fullScreen.request('browser');
        }
    }

    refreshHighlight(timestamps: Timestamp[]) {
        if (!this.dp) return;
        let highlight = timestamps.map(timestamp => ({
            text: timestamp.name,
            time: timestamp.time_second,
        }));
        // @ts-ignore
        this.dp.options.highlight = highlight;
        // @ts-ignore
        let t: NodeList = this.dp.container.querySelectorAll(".dplayer-highlight");
        t.forEach((node) => {
            if (node.parentNode) {
                node.parentNode.removeChild(node);
            }
        });
        this.dp.events.trigger("durationchange");
    }

    // ============================================================
    // Monkey-patch: dynamic danmaku measure, constant velocity,
    //               and simulated-replay seek
    // ============================================================

    private _patchDanmakuEngine(dp: DPlayer) {
        // This patch depends on DPlayer 1.27.0 internals (danmaku.js: dan,
        // danIndex, danTunnel, draw, clear, container, options.time,
        // options.height, _measure, _danAnimation). dplayer is pinned to
        // 1.27.0 in package.json. Verify internals before patching.
        // @ts-ignore — dm properties are not covered by DPlayer type declarations
        const dmProbe = dp.danmaku as any;
        const internalsOk = dmProbe &&
            Array.isArray(dmProbe.dan) &&
            typeof dmProbe.danIndex === "number" &&
            dmProbe.danTunnel &&
            typeof dmProbe.draw === "function" &&
            typeof dmProbe.clear === "function" &&
            dmProbe.container &&
            dmProbe.options &&
            typeof dmProbe.options.time === "function" &&
            typeof dmProbe._measure === "function" &&
            typeof dmProbe._danAnimation === "function";
        if (!internalsOk) {
            console.error("[Player] DPlayer danmaku internals mismatch; danmaku patch skipped. Expected dplayer@1.27.0, check node_modules.");
            return;
        }

        const getVelocity = (): number => Math.max(10, this.danmakuSetting.velocity || 160);
        const getRightDuration = (itemWidth: number, containerWidth: number): number => {
            return (containerWidth + itemWidth) / getVelocity();
        };
        const getFixedDuration = (): number => {
            return Math.max(0.75, 4 / (this.danmakuSetting.speedScale || 1));
        };

        const normalizeType = (type: number | string | undefined): 'right' | 'top' | 'bottom' => {
            if (type === 1 || type === 'top') return 'top';
            if (type === 2 || type === 'bottom') return 'bottom';
            return 'right';
        };

        const normalizeColor = (color: number | string | undefined): string => {
            if (typeof color === 'string') {
                return color.startsWith('#') ? color : `#${color}`;
            }
            if (typeof color === 'number' && Number.isFinite(color)) {
                return `#${('000000' + Math.floor(color).toString(16)).slice(-6)}`;
            }
            return '#ffffff';
        };

        let measureCtx: CanvasRenderingContext2D | null = null;
        let measuredFontSize = -1;

        dmProbe._measure = (text: string): number => {
            const targetFontSize = this.danmakuSetting.fontSize || 18;
            if (!measureCtx || measuredFontSize !== targetFontSize) {
                if (!measureCtx) {
                    measureCtx = document.createElement('canvas').getContext('2d');
                }
                if (measureCtx) {
                    const demoEl = dmProbe.container.querySelector('.dplayer-danmaku-item--demo')
                        || dmProbe.container.querySelector('.dplayer-danmaku-item');
                    const cs = demoEl ? getComputedStyle(demoEl) : null;
                    const fontWeight = cs ? cs.fontWeight : 'normal';
                    const fontFamily = cs ? cs.fontFamily : 'sans-serif';
                    measureCtx.font = `${fontWeight} ${targetFontSize}px ${fontFamily}`;
                    measuredFontSize = targetFontSize;
                }
            }
            if (!measureCtx) return Math.ceil((text || '').length * targetFontSize) + 10;
            return Math.ceil(measureCtx.measureText(text || '').width) + 10;
        };

        dmProbe._danAnimation = (type: number | string): string => {
            const norm = normalizeType(type);
            if (norm === 'right') {
                const containerWidth = dmProbe.container.offsetWidth || 960;
                return `${getRightDuration(160, containerWidth)}s`;
            }
            return `${getFixedDuration()}s`;
        };

        dmProbe.draw = (dan: any) => {
            if (!dmProbe.showing) return undefined;
            const list = Array.isArray(dan) ? dan : [dan];
            if (!list.length) return undefined;

            const containerWidth = dmProbe.container.offsetWidth || 960;
            const containerHeight = dmProbe.container.offsetHeight || 540;
            const fontSize = this.danmakuSetting.fontSize || 18;
            const topMargin = fontSize * 0.2;
            const lineHeight = Math.max(1, dmProbe.options.height || this.danmakuSetting.lineHeight || 22.5);
            const maxTunnel = Math.max(1, Math.floor((containerHeight - topMargin) / lineHeight));
            const containerRect = dmProbe.container.getBoundingClientRect();

            const findLane = (el: HTMLDivElement, type: 'right' | 'top' | 'bottom'): number => {
                if (!dmProbe.danTunnel[type]) dmProbe.danTunnel[type] = {};
                const typeTunnels = dmProbe.danTunnel[type];

                const bindRemove = (tunnelArr: HTMLDivElement[]) => {
                    el.addEventListener('animationend', () => {
                        const idx = tunnelArr.indexOf(el);
                        if (idx >= 0) tunnelArr.splice(idx, 1);
                    });
                };

                for (let lane = 0; dmProbe.unlimited || lane < maxTunnel; lane++) {
                    const key = String(lane);
                    const arr: HTMLDivElement[] | undefined = typeTunnels[key];
                    if (!arr || !arr.length) {
                        typeTunnels[key] = [el];
                        bindRemove(typeTunnels[key]);
                        return lane % maxTunnel;
                    }
                    if (type !== 'right') continue;

                    const lastEl = arr[arr.length - 1];
                    const lastRect = lastEl.getBoundingClientRect();
                    const hasLayout = lastRect.width > 0 || lastRect.height > 0;
                    const entered = hasLayout ? containerRect.right - lastRect.right : 0;
                    if (entered >= 16) {
                        arr.push(el);
                        bindRemove(arr);
                        return lane % maxTunnel;
                    }
                }
                return -1;
            };

            const fragment = document.createDocumentFragment();
            for (let i = 0; i < list.length; i++) {
                const raw = list[i];
                if (!raw) continue;
                const type = normalizeType(raw.type);
                const el = document.createElement('div');
                el.classList.add('dplayer-danmaku-item', `dplayer-danmaku-${type}`);

                if (raw.border) {
                    const span = document.createElement('span');
                    span.style.border = String(raw.border);
                    span.textContent = raw.text ?? '';
                    el.appendChild(span);
                } else {
                    el.textContent = raw.text ?? '';
                }

                el.style.opacity = String(dmProbe._opacity ?? 1);
                el.style.color = normalizeColor(raw.color);
                el.addEventListener('animationend', () => {
                    if (el.parentNode === dmProbe.container) {
                        dmProbe.container.removeChild(el);
                    }
                });

                const itemWidth = dmProbe._measure(raw.text ?? '');
                const lane = findLane(el, type);
                if (lane < 0) continue;

                let duration: number;
                if (type === 'right') {
                    el.style.width = `${itemWidth}px`;
                    el.style.top = `${topMargin + lineHeight * lane}px`;
                    el.style.transform = `translateX(-${containerWidth}px)`;
                    duration = getRightDuration(itemWidth, containerWidth);
                } else if (type === 'top') {
                    el.style.top = `${topMargin + lineHeight * lane}px`;
                    duration = getFixedDuration();
                } else {
                    el.style.bottom = `${topMargin + lineHeight * lane}px`;
                    duration = getFixedDuration();
                }

                el.classList.add('dplayer-danmaku-move');
                el.style.animationDuration = `${duration}s`;
                fragment.appendChild(el);
            }

            dmProbe.container.appendChild(fragment);
            return fragment;
        };

        function repositionExisting(
            existingEls: { el: HTMLElement; time: number }[],
            baseTime: number
        ) {
            for (const rec of existingEls) {
                const elapsed = baseTime - rec.time;
                rec.el.style.animationDelay = `${-elapsed}s`;
                rec.el.style.webkitAnimationDelay = `${-elapsed}s`;
            }
        }

        dmProbe.seek = (targetTime?: number) => {
            if (targetTime === undefined) {
                targetTime = dmProbe.options.time();
            }

            dmProbe.clear();

            const danList = dmProbe.dan as any[];
            if (!danList || !danList.length) {
                return;
            }

            const containerWidth = dmProbe.container.offsetWidth || 960;
            const visibleList: any[] = [];
            for (let i = 0; i < danList.length; i++) {
                const item = danList[i];
                if (item.time > targetTime!) break;
                const norm = normalizeType(item.type);
                const dur = norm === 'right'
                    ? getRightDuration(dmProbe._measure(item.text ?? ''), containerWidth)
                    : getFixedDuration();
                if (item.time + dur <= targetTime!) continue;
                visibleList.push(item);
            }

            const existingElements: { el: HTMLElement; time: number }[] = [];

            for (let i = 0; i < visibleList.length; i++) {
                const item = visibleList[i];
                repositionExisting(existingElements, item.time);

                dmProbe.draw([{
                    text: item.text,
                    color: item.color,
                    type: item.type,
                }]);

                const allItems = dmProbe.container.getElementsByClassName('dplayer-danmaku-item');
                const newEl = allItems[allItems.length - 1] as HTMLElement;
                if (newEl) {
                    newEl.style.animationDelay = '0s';
                    newEl.style.webkitAnimationDelay = '0s';
                    existingElements.push({ el: newEl, time: item.time });
                }
            }

            repositionExisting(existingElements, targetTime!);

            dmProbe.danIndex = danList.length;
            for (let i = 0; i < danList.length; i++) {
                if (danList[i].time > targetTime!) {
                    dmProbe.danIndex = i;
                    break;
                }
            }
        };
    }

}
