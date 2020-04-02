import {css, customElement, html, LitElement} from "lit-element";

@customElement('guide-element')
export class GuideElement extends LitElement {

    static styles = css`
        div {
            width : 64px;
        }
    `;

    render() {
        return html`
            <div>
                <div style="text-align:right"><a href="index.html">主页</a></div>
                <div style="text-align:right"><a href="download.html">下载</a></div>
                <div style="text-align:right"><a href="search.html">搜索</a></div>
            </div>
        `;
    }

}
