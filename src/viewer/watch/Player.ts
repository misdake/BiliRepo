import {httpget} from "../../common/network";
import DPlayer, {DPlayerAPIBackend} from "dplayer";

// if dplayer switchs videos when flvjs is fetching data, dplayer will not stop flvjs, causing errors and infinite loading.
// this seems to be fixed in later versions (currently 1.25).

// here is the 99% fix:
// hijack createPlayer to save the player object.
// when unloading video, call relevant functions to unload flvjs player correctly.
// this is a 99% fix. infinite loading still occurs after extreme actions.

let currentPlayer: any = null;
{
    // @ts-ignore
    let saved = flvjs.createPlayer;
    // @ts-ignore
    flvjs.createPlayer = function (options: any) {
        // @ts-ignore
        currentPlayer = saved(options);
        // @ts-ignore
        return currentPlayer;
    };
}

function unloadPlayer() {
    if (!currentPlayer) return;
    currentPlayer.pause();
    // @ts-ignore
    currentPlayer.unload();
    // @ts-ignore
    currentPlayer.detachMediaElement();
    // @ts-ignore
    currentPlayer.destroy();
    // @ts-ignore
    currentPlayer = null;
}

// ↑
// fix end

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
            unloadPlayer(); //unload flvjs player
            this.dp.destroy();
            this.dp = null;
        }

        // @ts-ignore
        this.dp = window.createPlayer(this.container, this.apiBackend, {url: `repo/${aid}/p${part}.flv`});
        // @ts-ignore
        this.dp.danmaku.options.height = 50;
        // @ts-ignore
        this.dp.danmaku.options.speed = 10;

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

