import {customElement, html, LitElement, property} from "lit-element";
import {PartDB, VideoParts} from "../../server/storage/dbTypes";

@customElement('videotitle-element')
export class VideoTitleElement extends LitElement {

    @property()
    video: VideoParts;
    @property()
    part: PartDB;

    render() {
        let title1 = "";
        let title2 = null;
        if (this.video && this.part) {
            title1 = this.video.title;
            if (this.video.parts.length > 1 && this.part && this.part.title && this.part.title.length > 0) {
                title2 = `Part ${this.part.index}: ${this.part.title}`;
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
