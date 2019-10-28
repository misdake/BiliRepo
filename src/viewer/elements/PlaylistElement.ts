import {css, html, LitElement, property} from "lit-element";
import {VideoLabelElement} from "./VideoElements";
import {Playlist} from "../../common/Playlist";

export class PlaylistElement extends LitElement {

    static register() {
        VideoLabelElement.register();
        customElements.define('playlist-element', PlaylistElement);
    }

    @property()
    playlist: Playlist;
    @property()
    playindex: number;
    @property()
    onitemclick: (playindex: number) => void;

    static styles = css`
        ul {
            padding: 0;
            margin: 0;
            width: 340px;
            max-width: 100%;
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
            if (video.pages.length === 1) {
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
            <ul>
                ${lines}
            </ul>
        `;
    }

}