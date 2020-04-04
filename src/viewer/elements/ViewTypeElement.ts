import {css, customElement, html, LitElement, property, TemplateResult} from "lit-element";
import {ViewType, viewTypes} from "../index/indexViewType";

@customElement('viewtype-element')
export class ViewTypeElement extends LitElement {

    static styles = css`
        span {
            display: inline-block;
            text-align: center;
            text-decoration: none;
            margin: 5px;
            padding: 5px 10px;
            cursor: pointer;
            min-width: 48px;
        }
        
        .viewtype {
            border-radius: 5px;
            border-width: 1px;
            border-style: solid;
            border-color: rgb(135, 206, 235);
            border-image: initial;
        }
        
        .download {
            border-radius: 5px;
            border-width: 1px;
            border-style: solid;
            border-color: rgba(135, 206, 235, 0);
            border-image: initial;
        }
        
        .selectedtype {
            background: rgb(135, 206, 235);
        }
    `;

    @property()
    onClick: (viewType: ViewType) => void;
    @property()
    selectedType: ViewType;

    render() {
        let types: TemplateResult[] = [];
        viewTypes.forEach((value, key) => {
            console.log(value);
            let classes = key === this.selectedType ? " selectedtype" : "";
            types.push(html`<span class="viewtype${classes}" @click=${() => this.onClick(value.type)}>${value.title}</span>`)
        });

        return html`
            <div style="text-align: right;">
                ${types}
                <span class="download" @click=${() => {window.location.href = "download.html";}}>下载</span>
            </div>
        `;
    }

}
