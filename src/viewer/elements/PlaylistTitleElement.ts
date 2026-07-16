import {css, html, LitElement} from "lit";
import {customElement, property} from "lit/decorators.js";
import {PlaylistDB} from "../../server/storage/dbTypes";

@customElement('playlisttitle-element')
export class PlaylistTitleElement extends LitElement {

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
            <div class="playlist"><a href="/index.html?type=3&pid=${this.playlist.pid}">
                <h1>${this.playlist.title}</h1>
            </a></div>
        ` : html``;
    }

}
