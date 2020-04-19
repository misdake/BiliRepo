import {css, customElement, html, LitElement, property, TemplateResult} from "lit-element";
import {PlaylistDB} from "../../server/storage/dbTypes";

@customElement('playlistdetail-element')
export class PlaylistDetailElement extends LitElement {

    @property()
    playlist: PlaylistDB;

    static styles = css`
        .playlist {
            width: 620px;
            padding: 10px;
        }
        .playlist:hover {
            background: rgba(224, 224, 224, 1);
        }
        .videolist {
            display: flex;
            flex-direction: row;
            justify-content: space-between;
        }
        a {
            text-decoration: none;
        }
        .thumblink {
            width: 144px;
            height: 90px;
        }
        .thumb {
            width: 144px;
            height: 90px;
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
                videos.push(html`<a class="thumblink" href=${`watch.html?aid=${aid}`}><img class="thumb" src="${serverConfig.repoRoot}repo/${aid}/thumb.jpg" alt="thumb"/></a>`);
            }
            while (videos.length < PlaylistDetailElement.THUMB_COUNT) {
                videos.push(html`<a class="thumblink"><img class="thumb placeholder" src="${serverConfig.repoRoot}image/image404.jpeg" alt="thumb"/></a>`);
            }
        }

        return this.playlist ? html`
            <div class="playlist"><a href="/playlist.html?pid=${this.playlist.pid}">
                    <div style="width: 100%; font-size: 30px; padding: 0 0 10px 0;">${this.playlist.title}</div>
                    <div class="videolist">${videos}</div>
            </a></div>
        ` : html``;
    }

}
