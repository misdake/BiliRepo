import {html, render} from "lit-html";
import "./PageElement";
import "../elements/GuideElement";

render(html`
    <div style="height: 100%; width: 960px; max-width: 100%; margin: 0 auto;">
        <div style="margin: 0; position: relative;">
            <div style="position: absolute; right: 0;"><guide-element></guide-element></div>
            <h1 style="margin: 20px 0;">视频下载</h1>
        </div>
        <page-element></page-element>
    </div>
`, document.body);

