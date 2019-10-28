import {css, html, LitElement, property} from "lit-element";
import {BilibiliPage, BilibiliVideo} from "../../common/types";

export class VideoDescElement extends LitElement {

    static register() {
        customElements.define('videodesc-element', VideoDescElement);
    }

    @property()
    video: BilibiliVideo;
    @property()
    part: BilibiliPage;

    static styles = css`
        span {
          color: green;
        }
    `;

    render() {
        let desc = "";
        if (this.video && this.part) {
            desc = this.video.desc;
        }

        return html`
            <div>
                <h5>${desc}</h5>
            </div>
        `;
    }

}