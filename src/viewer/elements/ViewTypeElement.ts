import {css, customElement, html, LitElement, property, TemplateResult} from "lit-element";
import {ViewType, viewTypes} from "../index/indexViewType";

@customElement('viewtype-element')
export class ViewTypeElement extends LitElement {

    static styles = css`
        span {
            display: inline-block;
            text-align: center;
            margin: 5px;
            padding: 5px 10px;
            cursor: pointer;
            min-width: 48px;
            user-select: none;
        }
        
        .viewtype {
            border-radius: 5px;
            border-width: 1px;
            border-style: solid;
            border-color: rgb(135, 206, 235);
            border-image: initial;
        }
        
        a {
            text-decoration: none;
            color: blue;
        }
        
        .download {
            border-width: 1px;
            border-color: rgba(135, 206, 235, 0);
            color: blue;
        }
        
        .selectedtype {
            background: rgb(135, 206, 235);
        }
    `;

    @property()
    onClick: (viewType: ViewType) => void;
    @property()
    afterLoad: (viewType: ViewType, pageindex: number) => void;
    @property()
    selectedType: ViewType;

    render() {
        let types: TemplateResult[] = [];
        viewTypes.forEach((value, key) => {
            let classes = key === this.selectedType ? " selectedtype" : "";
            types.push(html`<a href="index.html?type=${value.type}" @click=${(e: Event) => {
                this.onClick(value.type);
                e.preventDefault();
                return true;
            }}><span class="viewtype${classes}">${value.title}</span></a>`)
        });

        return html`
            <div style="text-align: right;">
                ${types}
                <span class="download" @click=${() => window.open("download.html")}>下载</span>
            </div>
        `;
    }

}
