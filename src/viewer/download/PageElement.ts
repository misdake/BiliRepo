import {css, customElement, html, LitElement, property} from "lit-element";
import {VideoStatus} from "../../common/DownloadStatus";
import "../elements/InputElement";
import "./VideoStatusElement";
import "./VideoListElement";
import "./VideoDownloadElement";
import {ClientApis} from "../common/api/ClientApi";

@customElement('page-element')
export class PageElement extends LitElement {

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
            margin-left: -10px;
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
        
        .icon {
            color: #FFF;
            background: #800;
            padding: 5px 10px;
            cursor: pointer;
            position: absolute;
            top: 10px;
            right: 10px;
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
        ClientApis.StatusDownload.fetch({}).then(status => {
            if (status) {
                this.message = status.message;
                this.queue = status.queue || [];
                this.current = status.current;
                this.done = status.done || [];
                this.failed = status.failed || [];
            } else {
                this.message = null;
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
    message: string;
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
        if(!input.toLowerCase().startsWith("av") && !input.toLowerCase().startsWith("bv")) return;

        ClientApis.GetVideoInfo.fetch(input, {}).then(videoJson => {
            let v = videoJson.data;
            if (!v) return;
            this.inputVideo = {
                aid: v.aid,
                done: false,
                failed: false,
                parts: null,
                pic: v.pic,
                title: v.title,
            };
        });
    }

    private enqueue() {
        if (this.inputVideo) {
            ClientApis.AddDownload.fetch(this.inputVideo.aid).then(_r => {
                this.loadStatus();
            });
            this.inputVideo = null;
        }
    }

    private retryVideo(video: VideoStatus) {
        if (video) {
            ClientApis.RetryDownload.fetch(video.aid).then(_r => {
                this.loadStatus();
            });
        }
    }

    private removeVideo(video: VideoStatus) {
        if (video) {
            ClientApis.RemoveDownload.fetch(video.aid).then(_r => {
                this.loadStatus();
            });
        }
    }

    private updateCookie() {
        navigator.clipboard.readText().then(value => {
            if (value.indexOf("Netscape HTTP Cookie File") >= 0) {
                ClientApis.UpdateCookie.fetch({}, {cookie: value}).then(content => {
                    if (content === "good") {
                        this.message = "";
                        alert("cookie updated!");
                    } else {
                        this.message = content;
                        alert("cookie update failed!\nresponse: " + content);
                    }
                });
            } else {
                alert("copy cookie content into clipboard and retry")
            }
        });
    }

    render() {
        return html`
            <div id="page">
                <div id="left_panel">
                    <input-element .input=${""} .buttonText=${"查看"} .checkInput="${(input: string) => this.checkInput(input)}"></input-element>
                    <ul><videostatus-element .video=${this.inputVideo} .iconShow=${true} .icon=${"添加"} .onIconClick=${() => this.enqueue()}></videostatus-element></ul>
                    <div class="text">下载队列: 共${this.queue.length}个</div>
                    <div id="queue_container"><videolist-element .videos=${this.queue} .icon=${"删除"} .onIconClick=${(video: VideoStatus) => this.removeVideo(video)}></videolist-element></div>
                </div>
                <div id="right_panel">
                    ${this.message ? html`<div style="color:#F00">${this.message}<button @click=${() => this.updateCookie()}>updateCookie</button></div>` : ""}
                    <div id="current_container">
                        <div class="text">正在下载: ${this.current ? html`<div class="icon" @click="${() => this.removeVideo(this.current)}">停止</div>` : html``}</div>
                        <videodownload-element .video=${this.current}></videodownload-element>
                    </div>
                    <div id="done_failed_container">
                        <div id="done_container">
                            <div class="text">完成队列: 共${this.done.length}个</div>
                            <videolist-element .videos=${this.done}></videolist-element>
                        </div>
                        <div id="failed_container">
                            <div class="text">失败队列: 共${this.failed.length}个</div>
                            <videolist-element .videos=${this.failed} .icon=${"重试"} .onIconClick=${(video: VideoStatus) => this.retryVideo(video)}></videolist-element>
                        </div>
                    </div>
                </div>
                <div style="clear: both"></div>
            </div>
        `;
    }

}
