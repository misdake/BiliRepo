import {css, html, LitElement, type PropertyValues} from "lit";
import {customElement, property, state} from "lit/decorators.js";
import type {MemberDB} from "../../server/storage/dbTypes";
import {ClientApis} from "../common/api/ClientApi";
import "../elements/PagedVideoContainer";

@customElement("member-detail-page-element")
export class MemberDetailPageElement extends LitElement {
    @property({type: Number})
    mid: number;

    @state()
    private member: MemberDB;
    @state()
    private loading: boolean = true;
    @state()
    private error: string = "";

    private loadId: number = 0;

    protected updated(changedProperties: PropertyValues): void {
        if (changedProperties.has("mid")) this.loadMember();
    }

    private async loadMember() {
        const loadId = ++this.loadId;
        this.loading = true;
        this.error = "";
        try {
            const member = await ClientApis.GetMember.fetch(this.mid);
            if (loadId !== this.loadId) return;
            if (!member) throw new Error("没有找到该 UP 主");
            this.member = member;
            document.title = member.name;
        } catch (error) {
            if (loadId !== this.loadId) return;
            this.error = error instanceof Error ? error.message : String(error);
        } finally {
            if (loadId === this.loadId) this.loading = false;
        }
    }

    private requestVideos = (page: number) => {
        return ClientApis.ListVideoByMember.fetch({mid: this.mid, page});
    };

    render() {
        if (this.loading) return html`<div class="status">正在加载 UP 主信息…</div>`;
        if (this.error) return html`
            <div class="status error">加载 UP 主失败：${this.error}
                <button @click=${() => this.loadMember()}>重试</button>
                <a href="index.html?type=2">返回 UP 主列表</a>
            </div>`;

        return html`
            <div class="detail-header">
                <div class="heading">
                    <a class="back" href="index.html?type=2">← 返回 UP 主列表</a>
                    <h1>${this.member.name}</h1>
                </div>
                <a class="external" target="_blank" rel="noopener noreferrer" href="https://space.bilibili.com/${this.mid}">打开 B 站主页</a>
            </div>
            <pagedvideo-container .request=${this.requestVideos}></pagedvideo-container>
        `;
    }

    static styles = css`
        :host { display: block; }
        .detail-header {
            min-height: 44px;
            margin-bottom: 10px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 20px;
        }
        .heading {
            min-width: 0;
            display: flex;
            align-items: center;
            gap: 14px;
        }
        h1 {
            margin: 0;
            overflow: hidden;
            color: #172033;
            font-size: 20px;
            line-height: 1.25;
            text-overflow: ellipsis;
            white-space: nowrap;
        }
        a { text-decoration: none; }
        .back, .external {
            box-sizing: border-box;
            min-height: 34px;
            padding: 7px 11px;
            border: 1px solid #d0d5dd;
            border-radius: 8px;
            background: #fff;
            color: #475467;
            white-space: nowrap;
        }
        .back:hover, .external:hover {
            border-color: #98a2b3;
            color: #2563eb;
        }
        .status {
            padding: 54px 20px;
            border: 1px dashed #d0d5dd;
            border-radius: 10px;
            color: #667085;
            text-align: center;
        }
        .status.error { color: #b42318; }
        .status button, .status a { margin-left: 8px; }
    `;
}
