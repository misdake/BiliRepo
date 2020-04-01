import {customElement, html, LitElement, property} from "lit-element";
import './GuideElement'

@customElement('title-element')
export class TitleElement extends LitElement {

    @property()
    title: string;

    createRenderRoot() {
        return this;
    }

    render() {
        return html`
            <div style="margin: 20px 0; position: relative;">
                <div style="position: absolute; right: 10px;"><guide-element></guide-element></div>
                <h1 style="margin: 10px;">${this.title}</h1>
            </div>
        `;
    }

}
