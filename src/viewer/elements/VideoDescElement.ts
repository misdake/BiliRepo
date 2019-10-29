import {css, html, LitElement, property} from "lit-element";
import {PartDB, VideoDB} from "../../server/storage/dbTypes";

export class VideoDescElement extends LitElement {

    static register() {
        customElements.define('videodesc-element', VideoDescElement);
    }

    @property()
    video: VideoDB;
    @property()
    part: PartDB;

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