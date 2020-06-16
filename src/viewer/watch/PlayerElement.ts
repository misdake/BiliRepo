import {css, customElement, html, LitElement, property, PropertyValues} from "lit-element";
import {Player} from "./Player";
import {PartTimestamps, VideoParts} from "../../server/storage/dbTypes";

@customElement('player-element')
export class PlayerElement extends LitElement {
    private danmakuSetting: { fontSize: number; lineHeight: number; speed: number };

    private player: Player = null;
    private loadPlayer() {
        if (!this.player) {
            this.player = new Player(this.shadowRoot.getElementById('dplayer'), this.onEnded, this.danmakuSetting);
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

    constructor() {
        super();
        this.danmakuSetting = { //TODO 改为可动态设置的，在resize的时候变化
            fontSize: 32,
            lineHeight: 40,
            speed: 10,
        }
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
