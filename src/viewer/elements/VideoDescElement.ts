import {css, customElement, html, LitElement, property} from "lit-element";
import {PartDB, VideoDB} from "../../server/storage/dbTypes";
import {ClientApis} from "../common/api/ClientApi";

@customElement('videodesc-element')
export class VideoDescElement extends LitElement {

    @property()
    video: VideoDB;
    @property()
    part: PartDB;

    static styles = css`
        span {
          color: green;
        }
    `;

    updateDanmaku() {
        ClientApis.UpdateDanmaku.run({}, {part: this.part}).then(content => {
            if (content === "good") {
                alert("danmaku updated!");
                window.location.reload();
            } else {
                alert("danmaku update failed!\nresponse: " + content);
            }
        });
    }

    render() {
        let desc = "";
        if (this.video && this.part) {
            desc = this.video.desc;
        }

        return html`
            <div>
                <h5 style="white-space:pre">${desc}</h5>
                <h5><a href="#" @click=${() => this.updateDanmaku()}>更新弹幕</a></h5>
            </div>
        `;
    }

}
