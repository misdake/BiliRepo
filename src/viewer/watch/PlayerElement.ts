import {css, customElement, html, LitElement, property, PropertyValues} from "lit-element";
import {Player} from "./Player";
import {PartTimestamps, VideoParts} from "../../server/storage/dbTypes";

@customElement('player-element')
export class PlayerElement extends LitElement {

    private player: Player = null;
    private loadPlayer() {
        if (!this.player) {
            this.player = new Player(this.shadowRoot.getElementById('dplayer'), this.onEnded, this.danmakuSetting);
            this.player.onResize = (w, h) => this.onResize(w, h);
        }
        if (this.onLoad) this.onLoad(this.player);
    }

    private loadVideo() {
        if (this.video && this.part && this.player) {
            this.player.loadVideoPart(this.video.aid, this.part.index, this.part.timestamps);
        }
    }

    @property()
    video: VideoParts;
    @property()
    part: PartTimestamps;
    @property()
    onLoad: (player: Player) => void;
    @property()
    onEnded: () => void;
    @property()
    danmakuSetting: { fontSize: number; lineHeight: number; speed: number };

    constructor() {
        super();
        this.danmakuSetting = {
            fontSize: 32,
            lineHeight: 30,
            speed: 10,
        };
    }

    onResize(w: number, h: number) {
        let font = h / 30;
        this.danmakuSetting.fontSize = font;
        this.danmakuSetting.lineHeight = font * 1.25;
        this.danmakuSetting.speed = w / 100;
        this.requestUpdate();
        console.log("resize!", w, h, this.danmakuSetting);
    }

    update(_changedProperties: PropertyValues) {
        super.update(_changedProperties);
        this.updateComplete.then(_ => {
            this.loadPlayer();
            setTimeout(() => this.loadVideo(), 0);
        });
    }

    render() {
        return html`
            <link rel="stylesheet" href="lib/DPlayer.min.css">
            <style>
                .dplayer-danmaku .dplayer-danmaku-right.dplayer-danmaku-move {
                    will-change: transform;
                    -webkit-animation: danmaku ${this.danmakuSetting.speed}s linear;
                    animation: danmaku ${this.danmakuSetting.speed}s linear;
                    -webkit-animation-play-state: paused;
                    animation-play-state: paused
                }
            
                .dplayer-danmaku-item {
                    font-size: ${this.danmakuSetting.fontSize}px !important;
                }
            </style>
            <div id="dplayer"></div>
        `;
    }

    static styles = css`
        .dplayer {
            width: 960px;
            height: 540px;
        }
    `;

}
