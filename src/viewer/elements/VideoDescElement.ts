import {customElement, html, LitElement, property} from "lit-element";
import {PartDB, VideoDB} from "../../server/storage/dbTypes";

@customElement('videodesc-element')
export class VideoDescElement extends LitElement {

    @property()
    video: VideoDB;
    @property()
    part: PartDB;

    createRenderRoot() {
        return this;
    }

    render() {
        let desc = "";
        if (this.video && this.part) {
            desc = this.video.desc;
        }

        return html`
            <div>
                <h5 style="white-space:pre">${desc}</h5>
            </div>
        `;
    }

}
