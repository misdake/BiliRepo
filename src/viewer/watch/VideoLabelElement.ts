import {css, customElement, html, LitElement, property, PropertyValues} from "lit-element";
import {PartDB, VideoDB} from "../../server/storage/dbTypes";

@customElement('videolabel-element')
export class VideoLabelElement extends LitElement {

    @property()
    video: VideoDB;
    @property()
    part: PartDB;

    @property()
    videoSelected: boolean;
    @property()
    partSelected: boolean;

    @property()
    onitemclick: () => void;

    static styles = css`
        .videoItem {
            display: inline;
            float: left;
            padding: 10px;
            width: 300px;
            height: 100px;
            position: relative;
            overflow: hidden;
            cursor: default;
        }
        .videoItemSelected {
            background: #e5f5fb;
        }
        
        .thumbContainer {
            width: 160px;
            height: 100px;
            position: relative;
        }
        
        .thumb {
            object-fit: cover;
            max-width: 160px;
            max-height: 100px;
            width: 100%;
            height: 100%;
        }
        
        .title {
            position: absolute;
            left: 175px;
            top: 10px;
            width: 140px;
            display: inline;
        }
        
        span {
            cursor: default;
        }
        
        .part {
            display: inline;
            float: left;
            margin-left: 20px;
            padding: 10px;
            width: 280px;
            position: relative;
            overflow: hidden;
            cursor: default;
        }
        .partSelected {
            background: #e5f5fb;
        }
    `;


    protected updated(_changedProperties: PropertyValues) {
        if (this.partSelected || (this.videoSelected && !this.part)) { //
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
        let part = !this.part ? html`` : html`
            <li class="${partClass}" @click=${() => this.onitemclick()}>
                <span>${this.part.index}: ${this.part.title}</span>
            </li>`;

        return html`
            ${video}
            ${part}
        `;
    }

}