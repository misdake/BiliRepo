import { css, html, LitElement, type PropertyValues } from "lit";
import { customElement, property } from "lit/decorators.js";
import { Player, type DanmakuSetting } from "./Player";
import { PartTimestamps, VideoParts } from "../../server/storage/dbTypes";
import { DanmakuFontEffect, DanmakuPrefs, DEFAULT_DANMAKU_PREFS } from "./danmakuPrefs";

@customElement('player-element')
export class PlayerElement extends LitElement {

    private player: Player | null = null;

    private loadPlayer() {
        if (!this.player) {
            const container = this.shadowRoot!.getElementById('dplayer')!;
            this.player = new Player(container, this.onEnded, this.danmakuSetting);
            this.player.onResize = (w, h) => this.onResize(w, h);

            // double-click to toggle fullscreen
            container.addEventListener('dblclick', () => {
                if (this.player) {
                    this.player.toggleFullScreen();
                }
            });
        }
        if (this.onLoad) this.onLoad(this.player);
    }

    private loadVideo() {
        if (this.video && this.part_timestamps && this.player) {
            this.player.loadVideoPart(this.video.aid, this.part_timestamps.index, this.part_timestamps.timestamps);
        }
    }

    @property()
    video!: VideoParts;
    @property()
    part_timestamps!: PartTimestamps;
    @property()
    onLoad!: (player: Player) => void;
    @property()
    onEnded!: () => void;
    @property()
    danmakuSetting!: DanmakuSetting;
    @property({ attribute: false })
    danmakuPrefs: DanmakuPrefs = DEFAULT_DANMAKU_PREFS;

    constructor() {
        super();
        this.danmakuSetting = {
            fontSize: 18,
            lineHeight: 22.5,
            velocity: 160,
            speedScale: 1,
        };
    }

    onResize(w: number, h: number) {
        const prefs = this.danmakuPrefs || DEFAULT_DANMAKU_PREFS;
        const baseW = prefs.scaleWithPlayer ? w : 960;
        const font = (baseW / 960) * 18 * prefs.fontScale;
        this.danmakuSetting.fontSize = font;
        this.danmakuSetting.lineHeight = font * 1.25;
        this.danmakuSetting.velocity = (baseW / 6) * prefs.speedScale;
        this.danmakuSetting.speedScale = prefs.speedScale;
        this.requestUpdate();
        console.log("resize!", w, h, this.danmakuSetting);
    }

    update(_changedProperties: PropertyValues) {
        super.update(_changedProperties);
        const shouldLoadVideo = _changedProperties.has("video") || _changedProperties.has("part_timestamps");
        const prefsChanged = _changedProperties.has("danmakuPrefs");
        this.updateComplete.then(_ => {
            this.loadPlayer();
            if (shouldLoadVideo) {
                setTimeout(() => this.loadVideo(), 0);
            } else if (prefsChanged && this.player) {
                this.player.triggerResize();
            }
        });
    }

    private getFontEffectCss(effect: DanmakuFontEffect): string {
        switch (effect) {
            case "stroke":
                return "-webkit-text-stroke: 2.5px rgba(0, 0, 0, .92); paint-order: stroke fill; text-shadow: 0 1px 2px rgba(0, 0, 0, .45);";
            case "shadow":
                return "-webkit-text-stroke: 0; text-shadow: 1px 1px 2px rgba(0, 0, 0, .92), 0 0 3px rgba(0, 0, 0, .55);";
            case "outline":
            default:
                return "-webkit-text-stroke: 0; text-shadow: 1px 0 1px #000, 0 1px 1px #000, 0 -1px 1px #000, -1px 0 1px #000;";
        }
    }

    render() {
        const effectCss = this.getFontEffectCss((this.danmakuPrefs || DEFAULT_DANMAKU_PREFS).fontEffect);
        return html`
            <link rel="stylesheet" href="lib/DPlayer.min.css">
            <style>
                .dplayer-danmaku .dplayer-danmaku-right.dplayer-danmaku-move {
                    will-change: transform;
                    animation-name: danmaku;
                    animation-timing-function: linear;
                }

                .dplayer-danmaku .dplayer-danmaku-item {
                    font-size: ${this.danmakuSetting.fontSize}px !important;
                    ${effectCss}
                }

                .dplayer-notice.remove-notice {
                    animation: dplayer-notice-hide .3s ease-in-out forwards;
                }

                @keyframes dplayer-notice-hide {
                    to { opacity: 0; }
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

        .dplayer-icon::after {
            display: none;
        }
    `;

}
