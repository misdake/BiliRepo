import {httpget} from "../common/network";
import DPlayer, {DPlayerAPIBackend} from "dplayer";

export class Player {

    private readonly dp: DPlayer;
    private readonly apiBackend: DPlayerAPIBackend;

    private aid: number;
    private part: number;

    constructor(container: HTMLElement) {
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

        // @ts-ignore
        this.dp = window.createPlayer(container, this.apiBackend);
        // @ts-ignore
        window.player = this;
        // @ts-ignore
        this.dp.danmaku.options.height = 50;
        // @ts-ignore
        this.dp.danmaku.options.speed = 10;
    }

    loadVideoPart(aid: number, part: number) {
        if (this.aid == aid && this.part == part) return;

        this.aid = aid;
        this.part = part;

        this.dp.switchVideo(
            {
                url: `repo/${aid}/p${part}.flv`,
            },
            {
                id: '',
                api: '',
            }
        );

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

