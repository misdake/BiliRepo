import {customElement, html, LitElement, property} from "lit-element";
import {PartDB, VideoDB} from "../../server/storage/dbTypes";
import {repeat} from "lit-html/directives/repeat";

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
        let desc : string[] = [];
        if (this.video && this.part) {
            desc = this.video.desc.split("\n");
        }

        return html`
            <div>
                ${repeat(desc, (line: string) => html`<p>${line}</p>`)}
            </div>
        `;
    }

}
