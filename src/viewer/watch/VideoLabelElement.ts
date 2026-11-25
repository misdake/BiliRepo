import {css, html, LitElement, type PropertyValues} from "lit";
import {customElement, property} from "lit/decorators.js";
import {PartDB, VideoDB} from "../../server/storage/dbTypes";

@customElement('videolabel-element')
export class VideoLabelElement extends LitElement {

    @property()
    video: VideoDB;
    @property()
    part_info: PartDB;

    @property()
    videoSelected: boolean;
    @property()
    partSelected: boolean;

    @property()
    onitemclick: () => void;

    static styles = css`
        :host {
            display: block;
            box-sizing: border-box;
            width: 100%;
            min-width: 0;
        }
        .videoItem {
            box-sizing: border-box;
            display: grid;
            grid-template-columns: 104px minmax(0, 1fr);
            gap: 10px;
            padding: 9px 10px;
            width: 100%;
            min-height: 78px;
            position: relative;
            cursor: pointer;
            border-bottom: 1px solid #edf0f5;
            transition: background-color .15s ease;
        }
        .videoItem:hover {
            background: #f8fafc;
        }
        .videoItem:hover .title {
            color: #172033;
        }
        .videoItemSelected,
        .videoItemSelected:hover {
            background: #eef4ff;
            box-shadow: inset 3px 0 0 var(--primary, #2563eb);
        }
        .videoItemSelected .title,
        .videoItemSelected:hover .title {
            color: #1d4ed8;
            font-weight: 600;
        }

        .thumbContainer {
            width: 104px;
            height: 59px;
            position: relative;
            border-radius: 6px;
            overflow: hidden;
            background: #eef1f5;
        }

        .thumb {
            display: block;
            object-fit: cover;
            width: 100%;
            height: 100%;
        }

        .title {
            display: -webkit-box;
            max-height: calc(1.42em * 3);
            color: #344054;
            font-size: 13px;
            line-height: 1.42;
            -webkit-box-orient: vertical;
            -webkit-line-clamp: 3;
            overflow: hidden;
            transition: color .15s ease;
        }

        .part {
            box-sizing: border-box;
            display: block;
            width: 100%;
            padding: 8px 12px 8px 28px;
            position: relative;
            cursor: pointer;
            border-bottom: 1px solid #edf0f5;
            color: #475467;
            font-size: 13px;
            line-height: 1.4;
            overflow-wrap: anywhere;
            transition: background-color .15s ease, color .15s ease;
        }
        .part::before {
            content: "";
            position: absolute;
            left: 15px;
            top: 50%;
            width: 5px;
            height: 5px;
            margin-top: -2.5px;
            border-radius: 50%;
            background: #cbd5e1;
            transition: background-color .15s ease;
        }
        .part:hover {
            background: #f8fafc;
            color: #172033;
        }
        .part:hover::before {
            background: #94a3b8;
        }
        .partSelected,
        .partSelected:hover {
            background: #eef4ff;
            color: #1d4ed8;
            font-weight: 600;
            box-shadow: inset 3px 0 0 var(--primary, #2563eb);
        }
        .partSelected::before,
        .partSelected:hover::before {
            background: var(--primary, #2563eb);
        }
    `;


    protected updated(_changedProperties: PropertyValues) {
        const titleElement = this.shadowRoot.querySelector<HTMLElement>('.title');
        if (titleElement && this.video) {
            const isTruncated = titleElement.scrollHeight > titleElement.clientHeight + 1;
            titleElement.title = isTruncated ? this.video.title : '';
        }

        if (this.partSelected || (this.videoSelected && !this.part_info)) {
            //自己是当前播放的内容，需要滚动到可见位置
            let children = this.shadowRoot.children;
            if (!children || !children.length) return;
            (children[0] as HTMLElement).scrollIntoView({block: 'nearest'});
        }
    }

    render() {
        let videoClass = this.videoSelected ? "videoItem videoItemSelected" : "videoItem";
        let partClass = this.partSelected ? "part partSelected" : "part";
        let video = !this.video ? html`` : html`
            <li class="${videoClass}" @click=${() => this.onitemclick()}>
                <div class="thumbContainer">
                    <img class="thumb" src="${serverConfig.repoRoot}repo/${this.video.aid}/thumb.jpg" alt="thumb"/>
                </div>
                <span class="title">${this.video.title}</span>
            </li>`;
        let part = !this.part_info ? html`` : html`
            <li class="${partClass}" @click=${() => this.onitemclick()}>
                <span>${this.part_info.index}: ${this.part_info.title}</span>
            </li>`;

        return html`
            ${video}
            ${part}
        `;
    }

}
