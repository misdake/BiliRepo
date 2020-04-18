import {css, customElement, html, LitElement, property} from "lit-element";
import {PlaylistDB} from "../../server/storage/dbTypes";

@customElement('playlist-element')
export class PlaylistElement extends LitElement {

    @property()
    playlist: PlaylistDB;

    static styles = css`
        .playlist {
            margin: 0;
            width: 236px;
            height: 64px;
            overflow: hidden;
        }
        img {
            float: left;
            width: 64px;
            height: 64px;
            object-fit: cover;
        }
    `;

    render() {
        // <img src="${this.playlist.face}" crossOrigin = "Anonymous" alt="face"/>
        return this.playlist ? html`
            <div class="playlist"><a href="/playlist.html?pid=${this.playlist.pid}">
                <div>${this.playlist.title}</div>
            </a></div>
        ` : html``;
    }

}
