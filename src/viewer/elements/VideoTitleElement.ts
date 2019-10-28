import {html, LitElement, property} from "lit-element";
import {BilibiliPage, BilibiliVideo} from "../../common/types";

export class VideoTitleElement extends LitElement {

    static register() {
        customElements.define('videotitle-element', VideoTitleElement);
    }

    @property()
    video: BilibiliVideo;
    @property()
    part: BilibiliPage;

    render() {
        let title1 = "";
        let title2 = null;
        if (this.video && this.part) {
            title1 = this.video.title;
            if (this.video.pages.length > 1 && this.part && this.part.part && this.part.part.length > 0) {
                title2 = `Part ${this.part.page}: ${this.part.part}`;
            }
        }

        return html`
            <div>
                <h1>${title1}</h1>
                <h3>${title2}</h3>
            </div>
        `;
    }

}