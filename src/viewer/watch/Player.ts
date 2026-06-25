import DPlayer, {DPlayerAPIBackend} from "dplayer";
import {httpget} from "../common/api/ClientApi";
import {Timestamp} from "../../server/storage/dbTypes";
import {Danmaku} from "../../server/download/Bilibili";

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
    private container: HTMLElement;
    private onEnded: () => void;
    private danmakuSetting: { fontSize: number; lineHeight: number; speed: number };
    private isFullscreen: boolean = false;

    onResize!: (w: number, h: number) => void;

    danmakuList!: Danmaku[];
    onDanmakuLoaded!: (danmakuList: Danmaku[]) => void;

    constructor(container: HTMLElement, onEnded: () => void, danmakuSetting: { fontSize: number, lineHeight: number, speed: number }) {
        this.container = container;
        this.danmakuSetting = danmakuSetting;
        this.apiBackend = {
            read: (options) => {
                if (!(this.aid && this.part)) return;
                httpget(`${serverConfig.repoRoot}repo/${this.aid}/p${this.part}.json`, content => {
                    let result = JSON.parse(content).data;
                    options.success(result);
                    this.danmakuList = result;
                    if (this.onDanmakuLoaded) this.onDanmakuLoaded(this.danmakuList);
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

        if (this.dp) {
            this.dp.pause();
            this.dp.destroy();
            this.dp = null;
        }

        let highlight = timestamps.map(timestamp => ({
            text: timestamp.name,
            time: timestamp.time_second,
        }));

        // @ts-ignore
        const dp: DPlayer = window.createPlayer(this.container, this.apiBackend, {url: `${serverConfig.repoRoot}repo/${aid}/p${part}.mp4`}, highlight);
        this.dp = dp;
        // @ts-ignore
        dp.danmaku.options.height = this.danmakuSetting.lineHeight;

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
        if (this.dp) {
            this.dp.destroy();
        }
    }

    triggerResize() {
        if (!this.dp) return;
        let w = this.dp.video.clientWidth;
        let h = this.dp.video.clientHeight;
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

}