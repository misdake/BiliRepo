import {css, customElement, html, LitElement} from "lit-element";

@customElement('guide-element')
export class GuideElement extends LitElement {

    static styles = css`
        a {
            text-decoration: none;
            padding: 0 5px;
            color: blue;
        }
    `;

    render() {
        return html`
            <div style="text-align: right;">
                <span style="text-align:right"><a href="index.html">主页</a></span>
            </div>
            <div style="text-align: right;">
                <span style="text-align:right"><a href="download.html">下载</a></span>
            </div>
        `;
    }

}
