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

    private dp: DPlayer;
    private readonly apiBackend: DPlayerAPIBackend;

    private aid: number;
    private part: number;
    private container: HTMLElement;
    private onEnded: () => void;
    private danmakuSetting: { fontSize: number; lineHeight: number; speed: number };

    onResize: (w: number, h: number) => void;

    danmakuList: Danmaku[];
    onDanmakuLoaded: (danmakuList: Danmaku[]) => void;

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
        this.dp = window.createPlayer(this.container, this.apiBackend, {url: `${serverConfig.repoRoot}repo/${aid}/p${part}.mp4`}, highlight);
        // @ts-ignore
        this.dp.danmaku.options.height = this.danmakuSetting.lineHeight;

        this.dp.on(DPlayerEvents.canplay, () => {
            if (this.timeOnCanplay) {
                this.seek(this.timeOnCanplay);
                this.timeOnCanplay = undefined;
            }
        });
        this.dp.on(DPlayerEvents.ended, () => {
            if (this.onEnded) this.onEnded();
        });
        this.dp.on(DPlayerEvents.resize, () => {
            setTimeout(() => this.triggerResize());
        });

        this.triggerResize();

        if (!document.hidden) {
            this.dp.play();
        }
    }

    unloadPlayer() {
        if (this.dp) {
            this.dp.destroy();
        }
    }

    triggerResize() {
        let w = this.dp.video.clientWidth;
        let h = this.dp.video.clientHeight;
        if (this.onResize) {
            this.onResize(w, h);
            // @ts-ignore
            if (this.dp.danmaku.options.height !== this.danmakuSetting.lineHeight) {
                // @ts-ignore
                this.dp.danmaku.options.height = this.danmakuSetting.lineHeight;
                // @ts-ignore
                if (this.dp.danmaku.showing) {
                    this.dp.danmaku.hide();
                    this.dp.danmaku.show();
                }
            }
        }
    }

    timeOnCanplay: number = undefined;

    setTimeOnCanplay(t: number) {
        this.timeOnCanplay = t;
    }

    currentTime() {
        return this.dp.video.currentTime;
    }

    seek(second: number) {
        if (this.dp) {
            this.dp.seek(second);
            this.dp.play();
        }
    }

    refreshHighlight(timestamps: Timestamp[]) {
        let highlight = timestamps.map(timestamp => ({
            text: timestamp.name,
            time: timestamp.time_second,
        }));
        // @ts-ignore
        this.dp.options.highlight = highlight;
        // @ts-ignore
        let t: NodeList = this.dp.container.querySelectorAll(".dplayer-highlight");
        t.forEach((node) => node.parentNode.removeChild(node));
        this.dp.events.trigger("durationchange");
    }

}

