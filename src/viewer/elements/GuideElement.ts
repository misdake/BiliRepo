import {css, html, LitElement} from "lit";
import {customElement} from "lit/decorators.js";

@customElement('guide-element')
export class GuideElement extends LitElement {

    static styles = css`
        .guide {
            display: flex;
            justify-content: flex-end;
            gap: 8px;
            white-space: nowrap;
        }
        a {
            text-decoration: none;
            padding: 4px 6px;
            border-radius: 7px;
            color: #475467;
            font-size: 12px;
            white-space: nowrap;
        }
        a:hover {
            background: #eef3fb;
            color: #2563eb;
        }
    `;

    render() {
        return html`
            <div class="guide">
                <a href="index.html">主页</a>
                <a href="index.html?type=5">下载</a>
            </div>
        `;
    }

}
