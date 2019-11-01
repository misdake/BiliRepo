import {httpget} from "../../common/network";
import DPlayer, {DPlayerAPIBackend} from "dplayer";

// @ts-ignore
let saved = flvjs.createPlayer;
// @ts-ignore
flvjs.createPlayer = function (options: any) {
    // @ts-ignore
    window.flvPlayer = saved(options);
    // @ts-ignore
    return window.flvPlayer;
};

export class Player {

    private dp: DPlayer;
    private readonly apiBackend: DPlayerAPIBackend;

    private aid: number;
    private part: number;
    private container: HTMLElement;

    constructor(container: HTMLElement) {
        this.container = container;
        console.log("new Player()");
        this.apiBackend = {
            read: (options) => {
                if (!(this.aid && this.part)) return;
                httpget(`repo/${this.aid}/p${this.part}.json`, content => {
                    options.success(JSON.parse(content).data);
                });
            },
            send: (options) => {
            }
        };
    }

    loadVideoPart(aid: number, part: number) {
        if (this.aid == aid && this.part == part) return;

        this.aid = aid;
        this.part = part;

        if (this.dp) {
            this.dp.pause();
            // @ts-ignore
            if (window.flvPlayer) {
                // @ts-ignore
                window.flvPlayer.unload();
                // @ts-ignore
                window.flvPlayer.detachMediaElement();
                // @ts-ignore
                window.flvPlayer.destroy();
                // @ts-ignore
                window.flvPlayer = null;
            }
            this.dp.destroy();
            this.dp = null;
        }

        // @ts-ignore
        this.dp = window.createPlayer(this.container, this.apiBackend, {url: `repo/${aid}/p${part}.flv`});
        // @ts-ignore
        this.dp.danmaku.options.height = 50;
        // @ts-ignore
        this.dp.danmaku.options.speed = 10;

        // this.dp.switchVideo(
        //     {
        //         url: `repo/${aid}/p${part}.flv`,
        //     },
        //     {
        //         id: '',
        //         api: '',
        //     }
        // );

        if (!document.hidden) {
            this.dp.play();
        }
    }

    // play() {
    //
    // }
    // stop() {
    //
    // }

    // setVolume() {
    //
    // }
    move(second: number) {
        if (this.dp) this.dp.seek(second);
    }

    setHighlight() {
        // highlight: [
        //     {
        //         text: 'marker for 20s',
        //         time: 20,
        //     },
        //     {
        //         text: 'marker for 2mins',
        //         time: 120,
        //     },
        // ],
    }

}

