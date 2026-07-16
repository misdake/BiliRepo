import {css, html, LitElement} from "lit";
import {customElement, property} from "lit/decorators.js";
import {PlaylistDB} from "../../server/storage/dbTypes";
import "./PlaylistDetailElement";
import "./InputElement";
import {PagedContainer} from "./PagedContainer";
import {repeat} from "lit/directives/repeat.js";
import {ClientApis, showRequestError} from "../common/api/ClientApi";

@customElement('playlistlist-element')
export class PlaylistListElement extends LitElement {

    @property()
    playlists: PlaylistDB[];

    render() {
        return html`
            <ul>
                ${repeat(this.playlists, (playlist: PlaylistDB) => html`<playlistdetail-element .playlist=${playlist}></playlistdetail-element>`)}
            </ul>
        `;
    }

    static styles = css`
        ul {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 14px;
            padding: 0;
            margin: 0;
            list-style: none;
        }
    `;

}

@customElement('pagedplaylist-container')
export class PagedPlaylistContainer extends PagedContainer<PlaylistDB> {

    clickNewPlaylist(input: string) {
        ClientApis.AddPlaylist.fetch({}, {title: input.trim(), aids: []}).then(playlist => {
            window.location.assign(`index.html?type=3&pid=${playlist.pid}`);
        }).catch(error => {
            showRequestError("新建播放列表", error);
        });
    }

    constructor() {
        super();
        this.rightRenderer = _list => html`
            <input-element .placeholder=${"新建列表名称"} .input=${""} .buttonText=${"新建列表"} .checkInput=${(input: string) => this.clickNewPlaylist(input)}></input-element>
        `;
        this.listRenderer = list => html`
            <playlistlist-element .playlists=${list.result}></playlistlist-element>`;
    }

}
