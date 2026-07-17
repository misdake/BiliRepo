import {css, html, LitElement} from "lit";
import {customElement, property, state} from "lit/decorators.js";
import {DownloadStatus, VideoStatus} from "../../common/DownloadStatus";
import "../elements/InputElement";
import "./VideoStatusElement";
import "./VideoListElement";
import "./VideoDownloadElement";
import {ClientApis} from "../common/api/ClientApi";
import {LatestRequest} from "../common/LatestRequest";

@customElement('download-page-element')
export class PageElement extends LitElement {

    static styles = css`
        :host {
            display: block;
            box-sizing: border-box;
            width: 100%;
            height: 100%;
            min-height: 0;
            margin: 0 auto;
            color: var(--text, #172033);
            overflow: hidden;
        }
        #page {
            display: grid;
            grid-template-columns: 360px minmax(0, 1fr);
            align-items: stretch;
            gap: 16px;
            width: 100%;
            height: 100%;
            min-height: 0;
            overflow: hidden;
        }
        .panel {
            box-sizing: border-box;
            border: 1px solid var(--border, #dfe4ec);
            border-radius: 12px;
            background: #fff;
            overflow: hidden;
            box-shadow: 0 8px 24px rgba(16, 24, 40, .04);
        }
        .panel-header {
            min-height: 34px;
            padding: 7px 12px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            border-bottom: 1px solid #e8ecf2;
            background: #f8fafc;
            font-size: 13px;
            font-weight: 700;
        }
        .count {
            color: var(--muted, #667085);
            font-size: 12px;
            font-weight: 500;
        }
        .input-area {
            padding: 10px;
            border-bottom: 1px solid #edf0f5;
        }
        .preview {
            margin-top: 8px;
        }
        .queue-list {
            flex: 1;
            min-height: 0;
            overflow-y: auto;
        }
        #left_panel, #done_container, #failed_container {
            display: flex;
            flex-direction: column;
            min-height: 0;
        }
        #right_panel {
            display: grid;
            grid-template-rows: auto minmax(0, 1fr);
            gap: 16px;
            min-height: 0;
            overflow: hidden;
        }
        #right_top {
            display: grid;
            gap: 16px;
            min-height: 0;
        }
        #done_failed_container {
            display: grid;
            grid-template-columns: 1fr 1fr;
            grid-row: 2;
            gap: 16px;
            min-height: 0;
            overflow: hidden;
        }
        .result-list {
            flex: 1;
            min-height: 0;
            overflow-y: auto;
        }
        .message {
            padding: 11px 14px;
            border: 1px solid #f5c2c0;
            border-radius: 10px;
            background: #fff6f5;
            color: #b42318;
        }
        .message button, .stop-button {
            margin-left: 10px;
            padding: 5px 9px;
            border: 1px solid currentColor;
            border-radius: 6px;
            background: transparent;
            color: inherit;
            cursor: pointer;
        }
        .stop-button {
            color: #b42318;
        }
        .empty {
            padding: 36px 14px;
            color: var(--muted, #667085);
            text-align: center;
        }
    `;

    constructor() {
        super();
        this.inputVideo = null;

        this.queue = [];
        this.current = null;
        this.done = [];
        this.failed = [];

    }

    private statusSource: EventSource;

    connectedCallback() {
        super.connectedCallback();
        this.statusSource = new EventSource(`${serverConfig.apiRoot}download/status/stream`);
        this.statusSource.onmessage = (event: MessageEvent) => {
            this.statusError = "";
            let status: DownloadStatus = JSON.parse(event.data);
            this.message = status ? status.message : null;
            this.queue = (status && status.queue) || [];
            this.current = (status && status.current) || null;
            this.done = (status && status.done) || [];
            this.failed = (status && status.failed) || [];
        };
        this.statusSource.onerror = () => {
            // EventSource reconnects automatically, just let the user know
            this.statusError = "与服务器的连接断开，正在自动重连…";
        };
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        // close the SSE stream, otherwise the connection and its server-side
        // listener leak for the lifetime of the server
        if (this.statusSource) {
            this.statusSource.close();
            this.statusSource = undefined;
        }
    }

    private showError(action: string, error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        this.localMessage = `${action}失败：${message}`;
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

    @state()
    private localMessage: string = "";
    @state()
    private statusError: string = "";

    private checkInputGuard: LatestRequest = new LatestRequest();

    private checkInput(input: string) {
        const token = this.checkInputGuard.begin();
        this.inputVideo = null;
        if (!input.toLowerCase().startsWith("av") && !input.toLowerCase().startsWith("bv")) return;

        ClientApis.GetVideoInfo.fetch(input, {}).then(videoJson => {
            if (!this.checkInputGuard.isCurrent(token)) return;
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
        }).catch(error => {
            if (!this.checkInputGuard.isCurrent(token)) return;
            this.showError("获取视频信息", error);
        });
    }

    private enqueue() {
        if (this.inputVideo) {
            this.checkInputGuard.begin(); // invalidate any in-flight preview request
            this.localMessage = "";
            ClientApis.AddDownload.fetch(this.inputVideo.aid).catch(error => {
                this.showError("加入下载队列", error);
            });
            this.inputVideo = null;
        }
    }

    private retryVideo(video: VideoStatus) {
        if (video) {
            this.localMessage = "";
            ClientApis.RetryDownload.fetch(video.aid).catch(error => {
                this.showError("重试下载", error);
            });
        }
    }

    private removeVideo(video: VideoStatus) {
        if (video) {
            this.localMessage = "";
            ClientApis.RemoveDownload.fetch(video.aid).catch(error => {
                this.showError("移除下载任务", error);
            });
        }
    }

    private updateCookie() {
        let value = window.prompt("Netscape HTTP Cookie File", "");
        if (!value) return;
        if (value.indexOf("Netscape HTTP Cookie File") >= 0) {
            ClientApis.UpdateCookie.fetch({}, { cookie: value }).then(content => {
                if (content === "good") {
                    this.localMessage = "";
                    alert("cookie updated!");
                } else {
                    this.localMessage = content;
                    alert("cookie update failed!\nresponse: " + content);
                }
            }).catch(error => {
                this.showError("更新Cookie", error);
            });
        } else {
            alert("copy cookie content into clipboard and retry");
        }
    }

    render() {
        return html`
            <div id="page">
                <section id="left_panel" class="panel">
                    <div class="panel-header"><span>添加视频</span><span class="count">待下载 ${this.queue.length}</span></div>
                    <div class="input-area">
                        <input-element .placeholder=${"aid 或 bvid"} .input=${""} .buttonText=${"查看"} .checkInput=${(input: string) => this.checkInput(input)}></input-element>
                        <div class="preview"><videostatus-element .video=${this.inputVideo} .iconShow=${true} .icon=${"添加"} .onIconClick=${() => this.enqueue()}></videostatus-element></div>
                    </div>
                    <div class="panel-header"><span>下载队列</span><span class="count">${this.queue.length} 项</span></div>
                    <div class="queue-list">${this.queue.length ? html`
                        <download-video-list-element .videos=${this.queue} .icon=${"删除"} .onIconClick=${(video: VideoStatus) => this.removeVideo(video)}></download-video-list-element>
                    ` : html`<div class="empty">队列为空</div>`}</div>
                </section>
                <div id="right_panel">
                    <div id="right_top">
                        ${this.statusError ? html`<div class="message">${this.statusError}</div>` : ""}
                        ${this.localMessage ? html`<div class="message">${this.localMessage}</div>` : ""}
                        ${this.message ? html`<div class="message">${this.message}<button @click=${() => this.updateCookie()}>更新 Cookie</button></div>` : ""}
                        <section id="current_container" class="panel">
                            <div class="panel-header">
                                <span>当前任务</span>
                                ${this.current ? html`<button class="stop-button" @click=${() => this.removeVideo(this.current)}>停止</button>` : html``}
                            </div>
                            ${this.current ? html`<videodownload-element .video=${this.current}></videodownload-element>` : html`<div class="empty">当前没有下载任务</div>`}
                        </section>
                    </div>
                    <div id="done_failed_container">
                        <section id="done_container" class="panel">
                            <div class="panel-header"><span>已完成</span><span class="count">${this.done.length} 项</span></div>
                            <div class="result-list">${this.done.length ? html`<download-video-list-element .videos=${this.done}></download-video-list-element>` : html`<div class="empty">暂无已完成任务</div>`}</div>
                        </section>
                        <section id="failed_container" class="panel">
                            <div class="panel-header"><span>失败</span><span class="count">${this.failed.length} 项</span></div>
                            <div class="result-list">${this.failed.length ? html`<download-video-list-element .videos=${this.failed} .icon=${"重试"} .onIconClick=${(video: VideoStatus) => this.retryVideo(video)}></download-video-list-element>` : html`<div class="empty">暂无失败任务</div>`}</div>
                        </section>
                    </div>
                </div>
            </div>
        `;
    }

}
