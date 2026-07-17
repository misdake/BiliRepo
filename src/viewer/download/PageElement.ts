import {css, html, LitElement} from "lit";
import {customElement, property} from "lit/decorators.js";
import {VideoStatus} from "../../common/DownloadStatus";
import "../elements/InputElement";
import "./VideoStatusElement";
import "./VideoListElement";
import "./VideoDownloadElement";
import {ClientApis} from "../common/api/ClientApi";

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

    private statusRequestPending: boolean = false;
    private refreshTimer: ReturnType<typeof setTimeout>;

    connectedCallback() {
        super.connectedCallback();
        this.loop();
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        if (this.refreshTimer) clearTimeout(this.refreshTimer);
        this.refreshTimer = undefined;
    }

    private loadStatus() {
        if (this.statusRequestPending) return;
        this.statusRequestPending = true;
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
        }).catch(error => {
            this.showError("获取下载状态", error);
        }).then(() => {
            this.statusRequestPending = false;
        });
    }

    private showError(action: string, error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        this.message = `${action}失败：${message}`;
    }

    private loop() {
        if (!this.isConnected) return;
        this.loadStatus();

        this.refreshTimer = setTimeout(() => {
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
        if (!input.toLowerCase().startsWith("av") && !input.toLowerCase().startsWith("bv")) return;

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
        }).catch(error => {
            this.showError("获取视频信息", error);
        });
    }

    private enqueue() {
        if (this.inputVideo) {
            ClientApis.AddDownload.fetch(this.inputVideo.aid).then(_r => {
                this.loadStatus();
            }).catch(error => {
                this.showError("加入下载队列", error);
            });
            this.inputVideo = null;
        }
    }

    private retryVideo(video: VideoStatus) {
        if (video) {
            ClientApis.RetryDownload.fetch(video.aid).then(_r => {
                this.loadStatus();
            }).catch(error => {
                this.showError("重试下载", error);
            });
        }
    }

    private removeVideo(video: VideoStatus) {
        if (video) {
            ClientApis.RemoveDownload.fetch(video.aid).then(_r => {
                this.loadStatus();
            }).catch(error => {
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
                    this.message = "";
                    alert("cookie updated!");
                } else {
                    this.message = content;
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
