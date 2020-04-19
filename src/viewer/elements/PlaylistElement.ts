import {css, customElement, html, LitElement, property} from "lit-element";
import {PlaylistDB} from "../../server/storage/dbTypes";

@customElement('playlist-element')
export class PlaylistElement extends LitElement {

    @property()
    playlist: PlaylistDB;

    static styles = css`
        .playlist {
            margin: 0;
        }
        a {
            text-decoration: none;
        }
    `;

    render() {
        return this.playlist ? html`
            <div class="playlist"><a href="/playlist.html?pid=${this.playlist.pid}">
                <h1>${this.playlist.title}</h1>
            </a></div>
        ` : html``;
    }

}
