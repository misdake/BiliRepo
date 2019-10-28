import {css, html, LitElement, property} from "lit-element";
import {DownloadStatus, VideoStatus} from "../../common/DownloadStatus";
import {httpget} from "../../common/network";
import {BilibiliVideo} from "../../common/types";
import {InputElement} from "./InputElement";
import {VideoStatusElement} from "./VideoStatusElement";
import {VideoListElement} from "./VideoListElement";

export class PageElement extends LitElement {

    static register() {
        InputElement.register();
        VideoStatusElement.register();
        VideoListElement.register();
        customElements.define('page-element', PageElement);
    }

    static styles = css`
        #page {
            position: relative;
            width: 960px;
            max-width: 100%;
            margin: 20px auto;
        }
        .text {
            margin: 0 10px;
        }
                
        #left_panel {
            width: 320px;
        }
        input-element {
            padding: 10px;
        }
        ul {
            padding: 0;
            margin: 0;
        }
        
        #right_panel {
            position:absolute;
            left: 320px;
            top: 0;
            width: 320px;
        }
        #current_container {
            width: 620px;
            margin: 10px;
            height: 200px;
            background: #CCCCCC;
        }
        #done_failed_container{
            position: relative;
            margin: 0 auto;
        }
        #done_container {
            position: absolute;
            left: 0;
            width: 320px;
        }
        #failed_container {
            position: absolute;
            left: 320px;
            width: 320px;
        }
    `;

    constructor() {
        super();
        this.inputVideo = null;

        this.status = null;

        this.queue = [];
        this.current = null;
        this.done = [];
        this.failed = [];

        this.loadStatus();
    }

    private loadStatus() {
        httpget("http://localhost:8081/download/status", (content: string) => {
            this.status = JSON.parse(content) as DownloadStatus;

            this.queue = null;
            this.current = null;
            this.done = null;
            this.failed = null;

            if (this.status) {
                this.queue = this.status.queue || [];
                this.current = this.status.current;
                this.done = this.status.done || [];
                this.failed = this.status.failed || [];
            }
        });
    }

    @property()
    inputVideo: VideoStatus;

    @property()
    status: DownloadStatus;

    @property()
    queue: VideoStatus[];
    @property()
    current: VideoStatus;
    @property()
    done: VideoStatus[];
    @property()
    failed: VideoStatus[];

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
        return html`
            <div id="page">
                <div id="left_panel">
                    <input-element .input=${""} .checkInput="${(input: string) => this.checkInput(input)}"></input-element>
                    <ul><videostatus-element .video=${this.inputVideo}></videostatus-element></ul>
                    <div class="text">下载队列: 共${this.queue.length}个</div>
                    <div id="queue_container"><videolist-element .videos=${this.queue}></videolist-element></div>
                </div>
                <div id="right_panel">
                    <div id="current_container">
                    
                    </div>
                    <div id="done_failed_container">
                        <div id="done_container">
                            <div class="text">完成队列: 共${this.done.length}个</div>
                            <videolist-element .videos=${this.done}></videolist-element>
                        </div>
                        <div id="failed_container">
                            <div class="text">失败队列: 共${this.failed.length}个</div>
                            <videolist-element .videos=${this.failed}></videolist-element>
                        </div>
                    </div>
                </div>
                <div style="clear: both"></div>
            </div>
        `;
    }

}