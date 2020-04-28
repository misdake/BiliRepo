import {css, customElement, html, LitElement, property, TemplateResult} from "lit-element";
import {PageElement} from "./PageElement";
import "./PlaylistElement";
import "../elements/VideoPlaylistEdit";
import {ClientApis} from "../common/api/ClientApi";

@customElement('controlpanel-element')
export class ControlPanelElement extends LitElement {

    @property()
    pageelement: PageElement;

    @property()
    currentTab: number = 0;

    private tabs: { title: string, content: () => TemplateResult }[] = [
        {title: "播放列表", content: () => html`
            <playlist-element .onitemclick=${(index: number) => this.pageelement.updatePlayIndex(index)} .playlist=${this.pageelement.playlist} .playindex=${this.pageelement.playindex}></playlist-element>
        `},
        {title: "编辑", content: () => html`
            <div style="padding: 5px;">
                <videoplaylistedit-element .video=${this.pageelement.currentVideo}></videoplaylistedit-element>
                <h5><a href="#" @click=${() => this.updateDanmaku()}>更新弹幕</a></h5>
            </div>
        `},
    ];

    private updateDanmaku() {
        ClientApis.UpdateDanmaku.fetch({}, {part: this.pageelement.currentPart}).then(content => {
            if (content === "good") {
                alert("danmaku updated!");
                window.location.reload();
            } else {
                alert("danmaku update failed!\nresponse: " + content);
            }
        });
    }

    private clickHeader(index: number) {
        this.currentTab = index;
    }

    render() {
        let headers: TemplateResult[] = [];
        for (let i = 0; i < this.tabs.length; i++) {
            let tab = this.tabs[i];
            if (i !== this.currentTab) {
                headers.push(html`<div class="tab" @click=${() => this.clickHeader(i)}>${tab.title}</div>`);
            } else {
                headers.push(html`<div class="tab tab-selected" @click=${() => this.clickHeader(i)}>${tab.title}</div>`);
            }
        }

        return html`
            <div style="display:flex; height: 30px; line-height: 30px;">${headers}</div>
            ${this.tabs[this.currentTab].content()}
        `;
    }

    static styles = css`
        .tab {
            flex: 1;
            color: blue;
            background: rgb(224, 224, 224);
            text-align: center;
        }
        .tab-selected {
            background: rgb(135, 206, 235);
        }
        playlist-element {
            position: relative;
            height: 510px;
        }
        ul {
            overflow-y: hidden;
        }
        ul:hover {
            overflow-y: auto;
        }
    `;

}
