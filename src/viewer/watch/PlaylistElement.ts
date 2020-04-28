import {css, customElement, html, LitElement, property} from "lit-element";
import "../elements/VideoElements";
import {Playlist} from "./Playlist";

@customElement('playlist-element')
export class PlaylistElement extends LitElement {

    @property()
    playlist: Playlist;
    @property()
    playindex: number;
    @property()
    onitemclick: (playindex: number) => void;

    createRenderRoot() {
        return this;
    }

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
                    .part=${part}
                    .videoSelected=${selectedVideo === video}
                    .partSelected=${selectedPart === part}
                ></videolabel-element>`);
            if (video) lastVideo = video;
        }

        return html`
            <ul style="padding: 0; margin: 0; width: 320px; max-width: 100%; height: 510px;">
                ${lines}
            </ul>
        `;
    }

}
