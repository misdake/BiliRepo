import {css, html, LitElement, property} from "lit-element";
import {repeat} from "lit-html/directives/repeat";
import {DownloadStatus, VideoStatus} from "../../common/DownloadStatus";
import {httpget} from "../../common/network";
import {BilibiliVideo} from "../../common/types";
import {InputElement} from "./InputElement";
import {VideoStatusElement} from "./VideoStatusElement";

export class PageElement extends LitElement {

    static register() {
        InputElement.register();
        VideoStatusElement.register();
        customElements.define('page-element', PageElement);
    }

    static styles = css`
        ul {
            margin: 0;
            padding: 0;
        }
    `;

    constructor() {
        super();
        this.inputVideo = null;
        this.status = null;

        httpget("http://localhost:8081/download/status", (content: string) => {
            this.status = JSON.parse(content) as DownloadStatus;
        });
    }

    @property()
    inputVideo: VideoStatus;
    @property()
    status: DownloadStatus;

    private checkInput(input: string) {
        this.inputVideo = null;

        let aid = parseInt(input);
        if (!aid) return;

        httpget(`http://localhost:8081/proxy/videoinfo/${aid}`, content => {
            if (!content) return;
            let v = JSON.parse(content).data as BilibiliVideo;
            if (!v) return;
            this.inputVideo = {
                aid: v.aid,
                done: false,
                failed: false,
                parts: null,
                pic: v.pic,
                title: v.title,
            }
        })
    }


    render() {
        let queue = !this.status ? html`` : html`
            <ul style="padding: 0; margin: 0;">
                ${repeat(this.status.queue, (v: VideoStatus) => html`<videostatus-element .video=${v}></videostatus-element>`)}
            </ul>
        `;

        return html`
            <input-element .input=${1} .checkInput="${(input: string) => this.checkInput(input)}"></input-element>
            <ul><videostatus-element .video=${this.inputVideo}></videostatus-element></ul>
            ${queue}
        `;
    }

}