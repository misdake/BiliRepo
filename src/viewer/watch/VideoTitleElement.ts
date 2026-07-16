import {css, html, LitElement} from "lit";
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
            <div class="title-block">
                <div class="title-wrap">
                    <h1>${title1}</h1>
                    <h1 class="expanded-title">${title1}</h1>
                </div>
                ${title2 ? html`<h3>${title2}</h3>` : html``}
            </div>
        `;
    }

    static styles = css`
        :host {
            display: block;
            width: 960px;
            min-width: 960px;
            max-width: 960px;
        }
        .title-block {
            position: relative;
            width: 960px;
        }
        .title-wrap {
            position: relative;
            width: 960px;
        }
        h1 {
            box-sizing: border-box;
            width: 960px;
            margin: 0;
            padding: 0 8px;
            overflow: hidden;
            color: #172033;
            font-size: 25px;
            line-height: 1.3;
            text-overflow: ellipsis;
            white-space: nowrap;
        }
        .expanded-title {
            display: none;
            position: absolute;
            z-index: 20;
            top: -6px;
            left: 0;
            box-sizing: border-box;
            width: 960px;
            padding: 6px 8px;
            border-radius: 8px;
            background: #fff;
            box-shadow: 0 0 0 1px #dfe4ec, 0 8px 24px rgba(16, 24, 40, .12);
            overflow: visible;
            text-overflow: clip;
            white-space: normal;
        }
        .title-wrap:hover .expanded-title {
            display: block;
        }
        h3 {
            margin: 6px 0 0;
            color: #667085;
            font-size: 15px;
            font-weight: 500;
        }
    `;

}
