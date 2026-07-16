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
            grid-template-columns: 112px minmax(0, 1fr);
            gap: 10px;
            padding: 10px;
            width: 100%;
            min-height: 84px;
            position: relative;
            cursor: pointer;
            border-bottom: 1px solid #edf0f5;
        }
        .videoItemSelected {
            background: #eaf1ff;
        }
        
        .thumbContainer {
            width: 112px;
            height: 63px;
            position: relative;
        }
        
        .thumb {
            object-fit: cover;
            width: 100%;
            height: 100%;
            border-radius: 6px;
        }
        
        .title {
            display: -webkit-box;
            color: #344054;
            font-size: 13px;
            line-height: 1.45;
            -webkit-box-orient: vertical;
            -webkit-line-clamp: 3;
            overflow: hidden;
        }
        
        span {
            cursor: default;
        }
        
        .part {
            box-sizing: border-box;
            display: block;
            margin-left: 24px;
            padding: 9px 12px;
            width: calc(100% - 24px);
            position: relative;
            cursor: pointer;
            border-bottom: 1px solid #edf0f5;
            color: #475467;
            font-size: 13px;
            overflow-wrap: anywhere;
        }
        .partSelected {
            background: #eaf1ff;
            color: #2563eb;
        }
    `;


    protected updated(_changedProperties: PropertyValues) {
        if (this.partSelected || (this.videoSelected && !this.part_info)) { //
            //自己是当前播放的内容，需要滚动到指定位置
            let children = this.shadowRoot.children;
            if (!children) return;

            //拿到列表的屏幕范围和自己的屏幕范围
            let rect = children[0].getClientRects()[0];
            let parentRect = this.parentElement.getClientRects()[0];

            if (rect.top - parentRect.bottom > 0) { //自己的顶部>列表的底部 => 太靠下了
                this.parentElement.scrollBy(0, rect.bottom - parentRect.bottom); //滚动使得底边重合
            }
            if (parentRect.top - rect.bottom > 0) { //自己的底部<列表的顶部 => 太靠上了
                this.parentElement.scrollBy(0, rect.top - parentRect.top); //滚动使得顶边重合
            }
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
