import {css, html, LitElement} from "lit";
import {customElement, property} from "lit/decorators.js";
import "./VideoLabelElement";
import {Playlist} from "./Playlist";

@customElement('playlist-element')
export class PlaylistElement extends LitElement {

    @property()
    playlist: Playlist;
    @property()
    playindex: number;
    @property()
    onitemclick: (playindex: number) => void;

    static styles = css`
        :host {
            display: block;
            box-sizing: border-box;
            width: 100%;
            height: 100%;
            min-width: 0;
        }
        ul {
            box-sizing: border-box;
            width: 100%;
            height: 100%;
            padding: 0;
            margin: 0;
            overflow-y: auto;
            list-style: none;
        }
    `;

    render() {
        if (!this.playlist) return html``;

        let lines = [];

        let selectedVideo = this.playlist.items[this.playindex].video;
        let selectedPart = this.playlist.items[this.playindex].part;
        let lastVideo = null;
        for (let [index, playlistItem] of this.playlist.items.entries()) {
            let video = playlistItem.video;
            let part = playlistItem.part;
            if (video.parts.length === 1) {
                part = null;
            }
            if (lastVideo === video) {
                video = null;
            }
            lines.push(html`
                <videolabel-element
                    .onitemclick=${() => this.onitemclick(index)}
                    .video=${video}
                    .part_info=${part}
                    .videoSelected=${selectedVideo === video}
                    .partSelected=${selectedPart === part}
                ></videolabel-element>`);
            if (video) lastVideo = video;
        }

        return html`
            <ul>
                ${lines}
            </ul>
        `;
    }

}
