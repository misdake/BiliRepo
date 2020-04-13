import {css, customElement, html, LitElement, property} from "lit-element";
import {PartDB, VideoDB} from "../../server/storage/dbTypes";
import {apipost, httppost} from "../common/network";

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
        let part = {
            aid: this.part.aid,
            cid: this.part.cid,
            index: this.part.index,
        };

        apipost("download/danmaku/update", {part: part}, (content) => {
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
                <h5>${desc}</h5>
                <h5><a href="#" @click=${() => this.updateDanmaku()}>更新弹幕</a></h5>
            </div>
        `;
    }

}
