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
            box-sizing: border-box;
            width: 112px;
            height: 60vh;
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
            height: 100%;
        }
        .viewtype {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 8px;
            box-sizing: border-box;
            width: 100%;
            height: 100%;
            text-align: center;
            padding: 8px;
            cursor: pointer;
            user-select: none;
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
            flex: 1;
            min-height: 0;
            width: 100%;
            text-decoration: none;
        }
        svg {
            width: 40px;
            height: 40px;
            flex: 0 0 40px;
            fill: none;
            stroke: currentColor;
            stroke-width: 1.7;
            stroke-linecap: round;
            stroke-linejoin: round;
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

    private renderIcon(type: ViewType) {
        switch (type) {
            case ViewType.video:
                return html`
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                        <rect x="3" y="5" width="18" height="14" rx="2"></rect>
                        <path d="m10 9 5 3-5 3z"></path>
                    </svg>
                `;
            case ViewType.member:
                return html`
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                        <circle cx="12" cy="8" r="4"></circle>
                        <path d="M4.5 20c.7-4.2 3.2-6.3 7.5-6.3s6.8 2.1 7.5 6.3"></path>
                    </svg>
                `;
            case ViewType.playlist:
                return html`
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M4 6h11M4 11h8M4 16h7"></path>
                        <path d="m15 13 5 3-5 3z"></path>
                    </svg>
                `;
            case ViewType.timestamp:
                return html`
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                        <circle cx="12" cy="12" r="9"></circle>
                        <path d="M12 7v5l3.5 2"></path>
                    </svg>
                `;
            case ViewType.download:
                return html`
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M12 3v11"></path>
                        <path d="m8 10 4 4 4-4"></path>
                        <path d="M5 17v3h14v-3"></path>
                    </svg>
                `;
        }
    }

    render() {
        let types: TemplateResult[] = [];
        const renderType = (type: ViewType, title: string) => {
            const classes = type === this.selectedType ? " selectedtype" : "";
            return html`<a href="index.html?type=${type}" @click=${(e: Event) => {
                this.onClick(type);
                e.preventDefault();
                return true;
            }}><span class="viewtype${classes}">${this.renderIcon(type)}${title}</span></a>`;
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
