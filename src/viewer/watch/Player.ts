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

export class Player {

    private dp: DPlayer | null = null;
    private readonly apiBackend: DPlayerAPIBackend;

    private aid: number = 0;
    private part: number = 0;
    private danmakuGuard: LatestRequest = new LatestRequest();
    private pendingDanmaku: { aid: number, part: number, token: number } | null = null;
    private container: HTMLElement;
    private onEnded: () => void;
    private danmakuSetting: { fontSize: number; lineHeight: number; speed: number };
    private isFullscreen: boolean = false;
    private readonly resizeObserver: ResizeObserver;

    onResize!: (w: number, h: number) => void;

    danmakuList!: Danmaku[];
    onDanmakuLoaded!: (danmakuList: Danmaku[]) => void;

    constructor(container: HTMLElement, onEnded: () => void, danmakuSetting: { fontSize: number, lineHeight: number, speed: number }) {
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

        // --- [NEW] Monkey-patch: fix empty danmaku screen after seek ---
        // Replaces danmaku.seek() with a "simulated replay": clear →
        // synchronously call draw() for all historical danmaku up to targetTime
        // → use negative animation-delay to skip the already-elapsed portion,
        // reusing draw()'s tunnel lane assignment and collision detection.
        // Original behavior: dm.clear() only, which blanks the screen.
        this._patchDanmakuSeek(dp);

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

    unloadPlayer() {
        this.danmakuGuard.begin(); // invalidate any in-flight danmaku request
        if (this.dp) {
            this.dp.destroy();
        }
    }

    triggerResize() {
        if (!this.dp) return;
        const w = this.container.clientWidth;
        const h = this.container.clientHeight;
        if (w <= 0 || h <= 0) return;
        if (this.onResize) {
            this.onResize(w, h);
            // @ts-ignore
            if (this.dp.danmaku.options.height !== this.danmakuSetting.lineHeight) {
                // @ts-ignore
                this.dp.danmaku.options.height = this.danmakuSetting.lineHeight;
                // @ts-ignore
                const tunnel = this.dp.danmaku.danTunnel;
                const lineHeight = this.danmakuSetting.lineHeight;
                const reposition = (list: { [index: number]: HTMLDivElement[] }, position: 'top' | 'bottom', clearTransform: boolean) => {
                    for (const index in list) {
                        const items = list[index];
                        if (!items) continue;
                        const idx = Number(index);
                        for (const item of items) {
                            item.style[position] = (idx * lineHeight) + 'px';
                            if (clearTransform) {
                                item.style.transform = '';
                            }
                        }
                    }
                };
                if (tunnel) {
                    reposition(tunnel.right, 'top', false);
                    reposition(tunnel.top, 'top', true);
                    reposition(tunnel.bottom, 'bottom', true);
                }
            }
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
    // Monkey-patch: fix empty danmaku screen after seek
    // ============================================================

    /**
     * [NEW] Monkey-patch: replace DPlayer's built-in danmaku.seek().
     *
     * **Original behavior** (danmaku.js seek):
     *   seek() { this.clear(); }
     *   Simply clears all on-screen danmaku, resulting in a blank screen.
     *
     * **New behavior** (this replacement):
     *   clear → filter danmaku visible at targetTime → sequential draw() with
     *   dynamic CSS correction → use negative animation-delay to jump each
     *   danmaku to its correct on-screen position at targetTime.
     *
     *   This fully reuses draw()'s tunnel lane assignment and collision
     *   detection logic (getTunnel / AABB), ensuring the result matches
     *   normal playback as if the video had been playing to targetTime.
     *
     *   **All logic below is NEW** except for:
     *   - dm.clear()              ← from original seek()
     *   - danIndex update loop    ← from original seek()
     *
     * @param dp - DPlayer instance
     */
    private _patchDanmakuSeek(dp: DPlayer) {
        // This patch depends on DPlayer 1.27.0 internals (danmaku.js: dan,
        // danIndex, draw, clear, container, options.time). dplayer is pinned
        // to 1.27.0 in package.json (exact version, enforced via npm
        // "overrides"). Verify the internals before patching: if they ever
        // drift, keep the original seek() instead of breaking playback.
        // @ts-ignore — dm properties are not covered by DPlayer type declarations
        const dmProbe = dp.danmaku as any;
        const internalsOk = dmProbe &&
            Array.isArray(dmProbe.dan) &&
            typeof dmProbe.danIndex === "number" &&
            typeof dmProbe.draw === "function" &&
            typeof dmProbe.clear === "function" &&
            dmProbe.container &&
            dmProbe.options && typeof dmProbe.options.time === "function";
        if (!internalsOk) {
            console.error("[Player] DPlayer danmaku internals mismatch; seek patch skipped. Expected dplayer@1.27.0, check node_modules.");
            return;
        }

        // [NEW] Animation duration constants (must match danmaku.scss and
        //       PlayerElement inline CSS in PlayerElement.ts)
        const FIXED_DURATION = 4;                          // top/bottom fixed danmaku (seconds)

        /** [NEW] Return animation duration for a given danmaku type.
         *  Read speed at call time: PlayerElement mutates danmakuSetting on
         *  resize, which also updates the CSS animation duration; a captured
         *  constant would go stale after the first resize. */
        const getDuration = (type: number | string): number => {
            return (type === 0 || type === 'right') ? this.danmakuSetting.speed : FIXED_DURATION;
        };

        /**
         * [NEW] Reposition all existing danmaku DOM elements so their
         * animation-delay reflects a negative offset from each element's
         * original time to baseTime.
         *
         * This ensures getBoundingClientRect() inside getTunnel() sees each
         * element at the correct on-screen position for the baseTime moment,
         * so lane assignment (collision detection) works correctly.
         */
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

        // @ts-ignore — [NEW] replace danmaku.seek
        dp.danmaku.seek = (targetTime?: number) => {
            // @ts-ignore — dm properties are not covered by DPlayer type declarations
            const dm = dp.danmaku as any;

            // [NEW] Use current video time when targetTime is not provided
            if (targetTime === undefined) {
                targetTime = dm.options.time();
            }

            // ---- Step 1: clear screen (ORIGINAL seek behavior) ----
            dm.clear();

            const danList = dm.dan as any[];
            if (!danList || !danList.length) {
                // [NEW] No danmaku data leftover after clear, nothing more to do
                return;
            }

            // ---- Step 2: [NEW] filter danmaku still visible at targetTime ----
            // Lower bound: danmaku.time + animation-duration > targetTime (not yet finished)
            // Upper bound: danmaku.time ≤ targetTime (already emitted)
            const visibleList: any[] = [];
            for (let i = 0; i < danList.length; i++) {
                const item = danList[i];
                if (item.time > targetTime!) break;           // not emitted yet
                const dur = getDuration(item.type);
                if (item.time + dur <= targetTime!) continue; // already disappeared by targetTime
                visibleList.push(item);
            }

            // ---- Step 3: [NEW] sequential draw with dynamic CSS correction ----
            // Key insight (see danmaku.js getTunnel()):
            //   draw() uses getBoundingClientRect() on existing tunnel elements to
            //   perform AABB collision detection and assign lanes.
            //
            //   Before each draw(), we must reposition all already-created elements
            //   to the position they would have at "this danmaku's time", so that
            //   getTunnel() sees the correct collision state.
            //
            //   Example: seek to 100s, visibleList = [{time: 92}, {time: 95}, {time: 98}]:
            //     draw(92) → tunnel empty → lane 0 (elapsed=0)
            //     reposition all to 95s → 92 is near the right edge (~3s in)
            //     draw(95) → getTunnel sees 92 on the right → lane 1
            //     reposition all to 98s → draw(98) ...
            //     finally reposition all to targetTime.
            const existingElements: { el: HTMLElement; time: number }[] = [];

            for (let i = 0; i < visibleList.length; i++) {
                const item = visibleList[i];

                // ① [NEW] Reposition existing elements to this item's time
                repositionExisting(existingElements, item.time);

                // ② [NEW] Build danmaku data and call draw()
                //    getBoundingClientRect inside draw() will see positions from step ①,
                //    so collision detection produces correct lane assignment.
                dm.draw([{
                    text: item.text,
                    color: item.color,
                    type: (item.type === 'top' ? 1 : item.type === 'bottom' ? 2 : 0),
                }]);

                // ③ [NEW] Locate the newly created element and record it
                const allItems = dm.container.getElementsByClassName('dplayer-danmaku-item');
                const newEl = allItems[allItems.length - 1] as HTMLElement;
                if (newEl) {
                    // New element starts from the right edge (elapsed = 0)
                    newEl.style.animationDelay = '0s';
                    newEl.style.webkitAnimationDelay = '0s';

                    existingElements.push({ el: newEl, time: item.time });
                }
            }

            // ---- Step 4: [NEW] reposition all elements to targetTime ----
            repositionExisting(existingElements, targetTime!);

            // ---- Step 5: update danIndex (ORIGINAL seek behavior) ----
            // This logic is copied from the original danmaku.js seek():
            //   for (let i = 0; i < this.dan.length; i++) {
            //       if (this.dan[i].time >= this.options.time()) {
            //           this.danIndex = i; break;
            //       }
            //       this.danIndex = this.dan.length;
            //   }
            for (let i = 0; i < danList.length; i++) {
                if (danList[i].time >= targetTime!) {
                    dm.danIndex = i;
                    break;
                }
                dm.danIndex = danList.length;
            }
        };
    }

}
