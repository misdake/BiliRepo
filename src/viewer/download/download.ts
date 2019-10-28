import {html, render} from "lit-html";
import {PageElement} from "./PageElement";

PageElement.register();

render(html`<page-element></page-element>`, document.body);

