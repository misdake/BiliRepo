import {html, LitElement} from "lit";
import {customElement, property} from "lit/decorators.js";
import {PartDB, VideoParts} from "../../server/storage/dbTypes";

@customElement('videotitle-element')
export class VideoTitleElement extends LitElement {

    @property()
    video: VideoParts;
    @property()
    part_info: PartDB;

    render() {
        let title1 = "";
        let title2 = null;
        if (this.video && this.part_info) {
            title1 = this.video.title;
            if (this.video.parts.length > 1 && this.part_info && this.part_info.title && this.part_info.title.length > 0) {
                title2 = `Part ${this.part_info.index}: ${this.part_info.title}`;
            }
        }

        return html`
            <div style="width: 960px;">
                <h1>${title1}</h1>
                <h3>${title2}</h3>
            </div>
        `;
    }

}
