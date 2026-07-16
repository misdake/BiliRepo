import {css, html, LitElement, type TemplateResult} from "lit";
import {customElement, property} from "lit/decorators.js";
import {ViewType, viewTypes} from "../index/indexViewType";

@customElement('viewtype-element')
export class ViewTypeElement extends LitElement {

    static styles = css`
        .nav {
            display: flex;
            flex-direction: column;
            align-items: center;
            width: 112px;
            padding: 6px;
            border: 1px solid var(--border, #dfe4ec);
            border-radius: 12px;
            background: #fff;
            box-shadow: 0 4px 16px rgba(16, 24, 40, .04);
        }
        .tabs {
            display: flex;
            flex-direction: column;
            align-items: center;
            width: 100%;
        }
        span {
            display: block;
            box-sizing: border-box;
            width: 100%;
            text-align: center;
            padding: 9px 8px;
            cursor: pointer;
            user-select: none;
        }
        .viewtype {
            border-radius: 8px;
            color: #475467;
            font-weight: 600;
        }
        .viewtype:hover {
            color: #2563eb;
            background: #f5f8ff;
        }
        a {
            display: block;
            width: 100%;
            text-decoration: none;
        }
        .selectedtype {
            background: #2563eb;
            color: #fff;
        }
        .selectedtype:hover {
            background: #2563eb;
            color: #fff;
        }
    `;

    @property()
    onClick: (viewType: ViewType) => void;
    @property()
    selectedType: ViewType;

    render() {
        let types: TemplateResult[] = [];
        const renderType = (type: ViewType, title: string) => {
            const classes = type === this.selectedType ? " selectedtype" : "";
            return html`<a href="index.html?type=${type}" @click=${(e: Event) => {
                this.onClick(type);
                e.preventDefault();
                return true;
            }}><span class="viewtype${classes}">${title}</span></a>`;
        };
        viewTypes.forEach((value, key) => {
            types.push(renderType(key, value.title));
        });
        types.push(renderType(ViewType.download, "下载"));

        return html`
            <div class="nav">
                <div class="tabs">${types}</div>
            </div>
        `;
    }

}
