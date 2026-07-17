import {css, html, LitElement, type PropertyValues, type TemplateResult} from "lit";
import {property, state} from "lit/decorators.js";
import {Paged} from "../../common/page";
import {LatestRequest} from "../common/LatestRequest";
import "./InputElement";

export class PagedContainer<T> extends LitElement {

    @property()
    firstLoadPage: number = 1;
    @property()
    request: (pageindex: number) => Promise<Paged<T>>;
    @property()
    response: Paged<T>;
    @property()
    afterLoad: (pageindex: number) => void;
    @property()
    autoLoad: boolean = true;
    @property()
    searchInput: string = "";
    @property()
    onSearch: (input: string) => void;

    @state()
    private loading: boolean = false;
    @state()
    private loadError: string = "";
    @state()
    private jumpPageInput: string = "";

    private requestGuard: LatestRequest = new LatestRequest();

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
    }

    // a new request (e.g. the owner changed the search input) reloads at page 1;
    // the very first assignment is handled by firstUpdated/autoLoad instead
    private requestInitialized: boolean = false;
    protected updated(changedProperties: PropertyValues): void {
        super.updated(changedProperties);
        if (changedProperties.has("request")) {
            if (this.requestInitialized && this.request) this.loadPage(1);
            this.requestInitialized = true;
        }
    }

    async loadPage(pageindex: number) {
        let requestedPage = Number.isSafeInteger(pageindex) && pageindex >= 1 ? pageindex : 1;
        const requestToken = this.requestGuard.begin();

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
            if (!this.requestGuard.isCurrent(requestToken)) return;
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
            this.jumpPageInput = "";
            this.loading = false;
            if (this.afterLoad) this.afterLoad(normalizedPage);
        } catch (error) {
            if (!this.requestGuard.isCurrent(requestToken)) return;
            this.loading = false;
            this.loadError = error instanceof Error ? error.message : String(error);
        }
    }

    private renderPagination() {
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
                pages.push(i > 0 ? html`
                    <button class="${classes}" ?disabled=${i === this.response.pageindex || this.loading} @click=${() => this.loadPage(i)}>${text}</button>
                ` : html`<span class="ellipsis">${text}</span>`);
            }
        }

        if (!this.response || this.response.total === 0) return html``;

        return html`
            <div class="pagination" aria-label="分页">
                <div class="page-list">${pages}</div>
                <span class="page-summary">第 ${this.response.pageindex} / ${Math.max(1, this.response.pagecount)} 页</span>
                <label class="jump-page">
                    <span>跳至</span>
                    <input type="number" min="1" max=${Math.max(1, this.response.pagecount)}
                        .value=${this.jumpPageInput}
                        @input=${(event: Event) => this.jumpPageInput = (event.target as HTMLInputElement).value}
                        @keydown=${(event: KeyboardEvent) => this.onJumpKeyDown(event)}
                        ?disabled=${this.loading}
                        aria-label="输入页码后回车"/>
                    <span>页，回车</span>
                </label>
            </div>
        `;
    }

    private onJumpKeyDown(event: KeyboardEvent) {
        if (event.key !== "Enter") return;
        event.preventDefault();
        let pagecount = Math.max(1, this.response.pagecount || 1);
        let parsed = Number(this.jumpPageInput);
        if (!Number.isSafeInteger(parsed)) return;
        this.loadPage(Math.min(Math.max(1, parsed), pagecount));
    }

    private search(input: string) {
        this.searchInput = (input || "").trim();
        if (this.onSearch) this.onSearch(this.searchInput);
    }

    render() {
        let content = this.loading
            ? html`<div class="status">加载中…</div>`
            : this.loadError
                ? html`<div class="status error">加载失败：${this.loadError} <button @click=${() => this.loadPage(this.response.pageindex)}>重试</button></div>`
                : this.response.result.length === 0
                    ? html`<div class="status empty">没有符合条件的内容。</div>`
                    : this.listRenderer(this.response);
        let rightHeader = this.rightRenderer ? this.rightRenderer(this.response) : html``;

        return html`
            <div class="paged-container">
                <div class="header">
                    <span class="header-main">
                        <span class="header_text">共 <strong>${this.response.total}</strong> 项</span>
                        ${this.onSearch ? html`
                            <input-element class="search" .input=${this.searchInput} .placeholder=${"搜索当前栏目"} .buttonText=${"搜索"} .showClearButton=${true} .checkInput=${(input: string) => this.search(input)}></input-element>
                        ` : html``}
                    </span>
                    <span class="header-actions">${rightHeader}</span>
                </div>
                <div class="content">${content}</div>
                ${this.renderPagination()}
            </div>
        `;
    }

    static styles = css`        
        :host {
            display: block;
        }
        .header {
            min-height: 34px;
            margin: 0 0 10px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 20px;
            user-select: none;
        }
        
        .header_text {
            color: var(--muted, #667085);
            white-space: nowrap;
        }

        .header-main {
            display: flex;
            align-items: center;
            gap: 14px;
        }

        input-element.search {
            --control-height: 34px;
            --input-width: 220px;
        }

        .header-actions {
            flex: 1;
            display: flex;
            justify-content: flex-end;
        }

        .toolbar {
            display: flex;
            align-items: center;
            gap: 8px;
        }

        .toolbar select, .toolbar button {
            box-sizing: border-box;
            height: 36px;
            padding: 7px 11px;
            border: 1px solid #d0d5dd;
            border-radius: 8px;
            background: #fff;
            color: #344054;
            font: inherit;
        }

        .toolbar button {
            cursor: pointer;
        }

        .toolbar button:hover:not(:disabled) {
            border-color: #98a2b3;
            background: #f8fafc;
        }

        .toolbar button:disabled {
            opacity: .45;
            cursor: default;
        }

        .content {
            min-height: 120px;
        }

        .pagination {
            min-height: 42px;
            margin-top: 10px;
            padding-top: 0;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 18px;
        }

        .page-list {
            display: flex;
            align-items: center;
            gap: 6px;
        }

        .page {
            min-width: 34px;
            height: 34px;
            padding: 0 9px;
            border-radius: 7px;
            border: 1px solid #d0d5dd;
            background: #fff;
            color: #344054;
            cursor: pointer;
        }

        .page:hover:not(:disabled) {
            border-color: #2563eb;
            color: #2563eb;
        }

        .currentpage {
            border-color: #2563eb;
            background: #2563eb;
            color: #fff;
        }

        .currentpage:disabled {
            opacity: 1;
        }

        .ellipsis, .page-summary, .jump-page {
            color: var(--muted, #667085);
            font-size: 13px;
        }

        .jump-page {
            display: flex;
            align-items: center;
            gap: 6px;
        }

        .jump-page input {
            width: 58px;
            height: 34px;
            padding: 5px 7px;
            border: 1px solid #d0d5dd;
            border-radius: 7px;
            outline: none;
            text-align: center;
        }

        .jump-page input:focus {
            border-color: #2563eb;
            box-shadow: 0 0 0 3px rgba(37, 99, 235, .12);
        }

        .status {
            padding: 54px 20px;
            border: 1px dashed #d0d5dd;
            border-radius: 10px;
            color: var(--muted, #667085);
            text-align: center;
        }
        .error {
            color: #B00020;
        }
        .status button {
            margin-left: 8px;
            min-height: 32px;
            padding: 6px 11px;
            border: 1px solid #d0d5dd;
            border-radius: 7px;
            background: #fff;
            cursor: pointer;
        }
    `;

}
