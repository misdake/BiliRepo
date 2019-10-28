import {css, html, LitElement, property} from "lit-element";
import {DownloadStatus, VideoStatus} from "../../common/DownloadStatus";
import {httpget} from "../../common/network";
import {BilibiliVideo} from "../../common/types";
import {InputElement} from "./InputElement";
import {VideoStatusElement} from "./VideoStatusElement";
import {VideoListElement} from "./VideoListElement";
import {VideoDownloadElement} from "./VideoDownloadElement";

export class PageElement extends LitElement {

    static register() {
        InputElement.register();
        VideoStatusElement.register();
        VideoListElement.register();
        VideoDownloadElement.register();
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
            width: 640px;
        }
        #current_container {
            position: relative;
            width: 620px;
            /*background: #CCCCCC;*/
            padding: 10px;
            border: 1px solid;
            margin-bottom: 10px;
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

        this.queue = [];
        this.current = null;
        this.done = [];
        this.failed = [];

        this.loop();
    }

    private loadStatus() {
        httpget("http://localhost:8081/download/status", (content: string) => {
            let status = JSON.parse(content) as DownloadStatus;
            if (status) {
                this.queue = status.queue || [];
                this.current = status.current;
                this.done = status.done || [];
                this.failed = status.failed || [];
            } else {
                this.queue = [];
                this.current = null;
                this.done = [];
                this.failed = [];
            }
        });
    }

    private loop() {
        this.loadStatus();

        setTimeout(() => {
            this.loop(); //TODO replace with websocket
        }, 1000);
    }

    @property()
    inputVideo: VideoStatus;

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
        });
    }

    private enqueue() {
        if (this.inputVideo) {
            httpget(`http://localhost:8081/download/add/${this.inputVideo.aid}`, content => {
                this.loadStatus();
            });
            this.inputVideo = null;
        }
    }

    render() {
        return html`
            <div id="page">
                <div id="left_panel">
                    <input-element .input=${""} .checkInput="${(input: string) => this.checkInput(input)}"></input-element>
                    <ul><videostatus-element .video=${this.inputVideo} .icon=${"add"} .onIconClick=${() => this.enqueue()}></videostatus-element></ul>
                    <div class="text">下载队列: 共${this.queue.length}个</div>
                    <div id="queue_container"><videolist-element .videos=${this.queue}></videolist-element></div>
                </div>
                <div id="right_panel">
                    <div id="current_container">
                        <div class="text">正在下载: </div>
                        <videodownload-element .video=${this.current}></videodownload-element>
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