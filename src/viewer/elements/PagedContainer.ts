import {css, html, LitElement, type PropertyValues, type TemplateResult} from "lit";
import {property, state} from "lit/decorators.js";
import {Paged} from "../../common/page";

export class PagedContainer<T> extends LitElement {

    @property()
    firstLoadPage: number = 1;
    @property()
    onElementLoaded: (element: PagedContainer<T>) => void;
    @property()
    request: (pageindex: number) => Promise<Paged<T>>;
    @property()
    response: Paged<T>;
    @property()
    afterLoad: (pageindex: number) => void;
    @property()
    autoLoad: boolean = true;

    @state()
    private loading: boolean = false;
    @state()
    private loadError: string = "";

    private requestId: number = 0;

    protected listRenderer: (list: Paged<T>) => TemplateResult;
    protected rightRenderer: (list: Paged<T>) => TemplateResult;

    constructor() {
        super();
        this.response = {
            total: 0,
            pageindex: 1,
            pagecount: 0,
            pagesize: 0,
            result: [],
        };
        this.listRenderer = () => html``;
    }

    protected firstUpdated(_changedProperties: PropertyValues): void {
        if (this.autoLoad) this.loadPage(this.firstLoadPage);
        if (this.onElementLoaded) this.onElementLoaded(this);
    }

    async loadPage(pageindex: number) {
        let requestedPage = Number.isSafeInteger(pageindex) && pageindex >= 1 ? pageindex : 1;
        const requestId = ++this.requestId;

        this.loading = true;
        this.loadError = "";
        this.response = {
            ...this.response,
            pageindex: requestedPage,
            result: [],
        };

        try {
            if (!this.request) throw new Error("分页请求尚未初始化");

            const result = await this.request(requestedPage);
            if (requestId !== this.requestId) return;
            if (!result) throw new Error("服务器没有返回分页数据");

            const pagecount = Math.max(0, Math.floor(Number(result.pagecount) || 0));
            const returnedPage = Number.isSafeInteger(result.pageindex) && result.pageindex >= 1 ? result.pageindex : 1;
            const normalizedPage = pagecount > 0 ? Math.min(returnedPage, pagecount) : 1;
            if (returnedPage !== normalizedPage) {
                await this.loadPage(normalizedPage);
                return;
            }

            this.response = {
                ...result,
                total: Math.max(0, Math.floor(Number(result.total) || 0)),
                pageindex: normalizedPage,
                pagecount,
                pagesize: Math.max(0, Math.floor(Number(result.pagesize) || 0)),
                result: Array.isArray(result.result) ? result.result : [],
            };
            this.loading = false;
            if (this.afterLoad) this.afterLoad(normalizedPage);
        } catch (error) {
            if (requestId !== this.requestId) return;
            this.loading = false;
            this.loadError = error instanceof Error ? error.message : String(error);
        }
    }

    render() {
        let pages: TemplateResult[] = [];
        if (this.response && this.response.pagecount > 1) {
            let pageIndices: number[] = [];
            const pagecount = Math.max(1, Math.floor(this.response.pagecount));
            const currentPage = Math.min(Math.max(1, Math.floor(this.response.pageindex)), pagecount);
            if (pagecount > 10) {
                let start = Math.max(1, currentPage - 3);
                let end = Math.min(pagecount, start + 6);
                start = Math.max(1, end - 6);

                if (start > 1) {
                    pageIndices.push(1);
                    if (start > 2) pageIndices.push(-1);
                }
                for (let i = start; i <= end; i++) pageIndices.push(i);
                if (end < pagecount) {
                    if (end < pagecount - 1) pageIndices.push(-1);
                    pageIndices.push(pagecount);
                }
            } else {
                for (let i = 1; i <= pagecount; i++) pageIndices.push(i);
            }

            for (let i of pageIndices) {
                let classes = i === this.response.pageindex ? "page currentpage" : "page otherpage";
                let text = i > 0 ? `${i}` : "…";
                let click = i > 0 ? () => this.loadPage(i) : undefined;
                pages.push(html`
                    <div class="${classes}" @click="${click}">${text}</div>
                `);
            }
        }
        let content = this.loading
            ? html`<div class="status">加载中…</div>`
            : this.loadError
                ? html`<div class="status error">加载失败：${this.loadError} <button @click=${() => this.loadPage(this.response.pageindex)}>重试</button></div>`
                : this.listRenderer(this.response);
        let rightHeader = this.rightRenderer ? this.rightRenderer(this.response) : html``;

        return html`
            <div>
                <div class="header">
                    <span class="header_text">共${this.response.total}项</span>${pages}<span>${rightHeader}</span>
                </div>
                ${content}
            </div>
        `;
    }

    static styles = css`        
        .header {
            margin: 10px 0;
            user-select: none;
        }
        
        .header_text {
            margin-right: 20px;
        }
        
        .page {
            border-radius: 5px;
            border: 1px solid #87CEEB;
            cursor: pointer;
            display: inline;
            margin: 5px;
            padding: 5px 10px;
        }
        .currentpage {
            background: #87CEEB;
        }
        .otherpage {
        }

        .status {
            margin: 20px 0;
        }
        .error {
            color: #B00020;
        }
    `;

}
