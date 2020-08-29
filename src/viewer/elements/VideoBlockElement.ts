import {css, customElement, html, LitElement, property} from "lit-element";
import {VideoDB} from "../../server/storage/dbTypes";

@customElement('videoblock-element')
export class VideoBlockElement extends LitElement {

    @property()
    video: VideoDB;

    @property()
    params: { key: string, value: number }[];

    static styles = css`
        .videoItem {
            display: inline;
            float: left;
            margin: 10px;
            width: 305px;
            height: 228px;
            overflow: hidden;
        }
        
        a {
            text-decoration: none;
        }
        
        .thumbContainer {
            width: 305px;
            height: 180px;
            position: relative;
            margin-bottom: 3px;
        }
        
        .thumb {
            display: block;
            object-fit: cover;
            max-width: 305px;
            max-height: 180px;
            width: 100%;
            height: 100%;
        }
    `;

    render() {
        let param = this.params ? "&" + this.params.map(i => `${i.key}=${i.value}`).join("&") : "";
        return html`
            <li class="videoItem">
                <a href=${'watch.html?aid=' + this.video.aid + param}>
                    <div class="thumbContainer">
                        <img class="thumb" src="${serverConfig.repoRoot}repo/${this.video.aid}/thumb.jpg" alt="thumb"/>
                    </div>
                    <span>${this.video.title}</span>
                </a>
            </li>
        `;
    }

}
