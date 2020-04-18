import {customElement, html, LitElement, property} from "lit-element";
import {PlaylistDB} from "../../server/storage/dbTypes";
import "./PlaylistElement";
import {PagedContainer} from "./PagedContainer";
import {repeat} from "lit-html/directives/repeat";

@customElement('playlistlist-element')
export class PlaylistListElement extends LitElement {

    @property()
    playlists: PlaylistDB[];

    createRenderRoot() {
        return this;
    }

    render() {
        return html`
            <ul style="padding: 0; margin: 0 -10px;">
                ${repeat(this.playlists, (playlist: PlaylistDB) => html`<playlist-element style="float: left; width: 300px; margin: 10px;" .playlist=${playlist}></playlist-element>`)}
            </ul>
        `;
    }

}

@customElement('pagedplaylist-container')
export class PagedPlaylistContainer extends PagedContainer<PlaylistDB> {

    constructor() {
        super();
        super.listRenderer = list => html`<playlistlist-element .playlists=${list.result}></playlistlist-element>`;
    }

}
