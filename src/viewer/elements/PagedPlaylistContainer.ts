import {customElement, html, LitElement, property} from "lit-element";
import {PlaylistDB} from "../../server/storage/dbTypes";
import "./PlaylistDetailElement";
import "./InputElement";
import {PagedContainer} from "./PagedContainer";
import {repeat} from "lit-html/directives/repeat";
import {ClientApis} from "../common/api/ClientApi";

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
                ${repeat(this.playlists, (playlist: PlaylistDB) => html`<playlistdetail-element style="float: left;" .playlist=${playlist}></playlistdetail-element>`)}
            </ul>
        `;
    }

}

@customElement('pagedplaylist-container')
export class PagedPlaylistContainer extends PagedContainer<PlaylistDB> {

    clickNewPlaylist(input: string) {
        ClientApis.AddPlaylist.fetch({}, {title: input.trim(), aids: []}).then(playlist => {
            window.open(`playlist.html?pid=${playlist.pid}`, "_blank");
            window.location.reload();
        });
    }

    constructor() {
        super();
        super.rightRenderer = () => html`
            <input-element style="float: right;" .input=${""} .buttonText=${"新建列表"} .checkInput="${(input: string) => this.clickNewPlaylist(input)}" .showClearButton=${false}></input-element>
        `;
        super.listRenderer = list => html`<playlistlist-element .playlists=${list.result}></playlistlist-element>`;
    }

}
