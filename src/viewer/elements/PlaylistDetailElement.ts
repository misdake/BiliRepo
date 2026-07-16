import {css, html, LitElement, type TemplateResult} from "lit";
import {customElement, property} from "lit/decorators.js";
import {PlaylistDB} from "../../server/storage/dbTypes";

@customElement('playlistdetail-element')
export class PlaylistDetailElement extends LitElement {

    @property()
    playlist: PlaylistDB;

    static styles = css`
        .playlist {
            padding: 14px;
            border: 1px solid #e1e6ee;
            border-radius: 10px;
            background: #fff;
        }
        .playlist:hover {
            border-color: #b9c8e2;
            box-shadow: 0 6px 18px rgba(16, 24, 40, .06);
        }
        .videolist {
            display: flex;
            flex-direction: row;
            justify-content: space-between;
        }
        a {
            text-decoration: none;
            color: #172033;
        }
        .thumblink {
            width: calc(25% - 6px);
            aspect-ratio: 16 / 10;
        }
        .thumb {
            display: block;
            width: 100%;
            height: 100%;
            border-radius: 6px;
            object-fit: cover;
        }
        .placeholder {
            opacity: 0.2;
        }
    `;

    private static readonly THUMB_COUNT = 4;

    render() {
        let videos: TemplateResult[] = [];
        if (this.playlist) {
            let aidList = (this.playlist.videosAid || []).slice(0, PlaylistDetailElement.THUMB_COUNT);
            for (let aid of aidList) {
                videos.push(html`<a class="thumblink" href=${`watch.html?pid=${this.playlist.pid}&aid=${aid}`}><img class="thumb" src="${serverConfig.repoRoot}repo/${aid}/thumb.jpg" alt="thumb"/></a>`);
            }
            while (videos.length < PlaylistDetailElement.THUMB_COUNT) {
                videos.push(html`<a class="thumblink"><img class="thumb placeholder" src="${serverConfig.repoRoot}image/image404.jpeg" alt="thumb"/></a>`);
            }
        }

        return this.playlist ? html`
            <div class="playlist">
                <div style="display:flex; align-items:center; justify-content:space-between; width:100%; padding:0 0 12px;">
                    <a href="/watch.html?pid=${this.playlist.pid}" style="font-size:20px; font-weight:700;">${this.playlist.title}</a>
                    <a href="/index.html?type=3&pid=${this.playlist.pid}" style="font-size:13px; color:#2563eb;">管理 · ${this.playlist.videosAid ? this.playlist.videosAid.length : 0} 项</a>
                </div>
                <div class="videolist">${videos}</div>
            </div>
        ` : html``;
    }

}
