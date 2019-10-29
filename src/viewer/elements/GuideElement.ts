import {css, html, LitElement} from "lit-element";

export class GuideElement extends LitElement {

    static register() {
        customElements.define('guide-element', GuideElement);
    }

    static styles = css`
        div {
            width : 64px;
        }
    `;

    render() {
        return html`
            <div><a href="index.html">主页</a></div>
            <div><a href="download.html">下载</a></div>
        `;
    }

}