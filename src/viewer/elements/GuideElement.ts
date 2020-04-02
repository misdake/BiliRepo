import {css, customElement, html, LitElement} from "lit-element";

@customElement('guide-element')
export class GuideElement extends LitElement {

    static styles = css`
        a {
            text-decoration: none;
            padding: 0 5px;
        }
    `;

    render() {
        return html`
            <div style="text-align: right;">
                <span style="text-align:right"><a href="index.html">视频</a></span>
                <span style="text-align:right"><a href="index.html">up主</a></span>
                <span style="text-align:right"><a href="index.html">列表</a></span>
                <span style="text-align:right"><a href="index.html">节点</a></span>
            </div>
            <div style="text-align: right;">
                <span style="text-align:right"><a href="download.html">下载</a></span>
            </div>
        `;
    }

}
