import DPlayer, {DPlayerAPIBackend} from "dplayer";
import {httpget} from "../common/api/ClientApi";
import {Timestamp} from "../../server/storage/dbTypes";

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
    private onTimeUpdate: (time_second: number) => void;
    private onEnded: () => void;

    constructor(container: HTMLElement, onTimeUpdate: (time_second: number) => void, onEnded: () => void) {
        this.container = container;
        this.apiBackend = {
            read: (options) => {
                if (!(this.aid && this.part)) return;
                httpget(`${serverConfig.repoRoot}repo/${this.aid}/p${this.part}.json`, content => {
                    options.success(JSON.parse(content).data);
                });
            },
            send: (options) => {
            }
        };

        this.onTimeUpdate = onTimeUpdate;
        this.onEnded = onEnded;
    }

    loadVideoPart(aid: number, part: number, timestamps: Timestamp[]) {
        if (this.aid == aid && this.part == part) return;

        this.aid = aid;
        this.part = part;

        if (this.dp) {
            this.dp.pause();
            unloadPlayer(); //unload flvjs player
            this.dp.destroy();
            this.dp = null;
        }

        let highlight = timestamps.map(timestamp => ({
            text: timestamp.name,
            time: timestamp.time_second,
        }));

        // @ts-ignore
        this.dp = window.createPlayer(this.container, this.apiBackend, {url: `${serverConfig.repoRoot}repo/${aid}/p${part}.flv`}, highlight);
        // @ts-ignore
        this.dp.danmaku.options.height = 50;
        // @ts-ignore
        this.dp.danmaku.options.speed = 10;

        // @ts-ignore
        this.dp.on("ended", () => {
            if (this.onEnded) this.onEnded();
        });
        // @ts-ignore
        this.dp.on("timeupdate", () => {
            if (this.onTimeUpdate) this.onTimeUpdate(this.dp.video.currentTime);
        });

        if (!document.hidden) {
            this.dp.play();
        }
    }

    move(second: number) {
        if (this.dp) this.dp.seek(second);
    }

}

