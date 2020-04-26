import {css, customElement, html, LitElement, property, PropertyValues} from "lit-element";
import {Player} from "./Player";
import {PartDB, VideoParts} from "../../server/storage/dbTypes";

@customElement('player-element')
export class PlayerElement extends LitElement {

    private player: Player = null;
    private loadPlayer() {
        if (!this.player) {
            this.player = new Player(this.shadowRoot.getElementById('dplayer'), this.onEnded);
        }
    }

    private loadVideo() {
        if (this.video && this.part && this.player) {
            this.player.loadVideoPart(this.video.aid, this.part.index);
        }
    }

    @property()
    danmakuFontSize: number;
    @property()
    danmakuMoveTime: number;


    @property()
    video: VideoParts;
    @property()
    part: PartDB;
    @property()
    onEnded: () => void;


    constructor() {
        super();
        this.danmakuFontSize = 32;
        this.danmakuMoveTime = 10; //TODO 根据屏幕宽度改变
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
                    -webkit-animation: danmaku ${this.danmakuMoveTime}s linear;
                    animation: danmaku ${this.danmakuMoveTime}s linear;
                    -webkit-animation-play-state: paused;
                    animation-play-state: paused
                }
            
                .dplayer-danmaku-item {
                    font-size: ${this.danmakuFontSize}px !important;
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
