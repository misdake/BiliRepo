import {html, LitElement} from "lit";
import {customElement, property} from "lit/decorators.js";
import {PartDB, VideoDB} from "../../server/storage/dbTypes";
import {repeat} from "lit/directives/repeat.js";

@customElement('videodesc-element')
export class VideoDescElement extends LitElement {

    @property()
    video: VideoDB;
    @property()
    part_info: PartDB;

    createRenderRoot() {
        return this;
    }

    render() {
        let desc: string[] = [];
        if (this.video && this.part_info) {
            desc = this.video.desc.split('\n');
        }

        return html`
            <div>
                ${repeat(desc, (line: string) => html`<p>${line}</p>`)}
            </div>
        `;
    }

}
