import {css, html, LitElement, property, TemplateResult} from "lit-element";
import {Paged} from "../../common/page";
import "./VideoListElement";

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

    protected listRenderer: (list: Paged<T>) => TemplateResult;

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

    protected firstUpdated(_changedProperties: Map<PropertyKey, unknown>): void {
        if (this.autoLoad) this.loadPage(this.firstLoadPage);
        if (this.onElementLoaded) this.onElementLoaded(this);
    }

    loadPage(pageindex: number) {
        this.request(pageindex).then(result => {
            this.response = result;
            if (this.afterLoad) this.afterLoad(pageindex);
        });
    }

    render() {
        let pages: TemplateResult[] = [];
        if (this.response && this.response.pagecount > 1) {
            let pageIndices = [];
            if (this.response.pagecount > 10) {
                let left = this.response.pageindex - 1;
                let right = this.response.pageindex + 1;
                pageIndices.push(this.response.pageindex);
                while (pageIndices.length < 7) {
                    if (left >= 1) pageIndices.unshift(left--);
                    if (right <= this.response.pagecount) pageIndices.push(right++);
                }
                if (left > 1) pageIndices.unshift(-1);
                if (left >= 1) pageIndices.unshift(1);
                if (right < this.response.pagecount) pageIndices.push(-1);
                if (right <= this.response.pagecount) pageIndices.push(this.response.pagecount);
            } else {
                for (let i = 1; i <= this.response.pagecount; i++) pageIndices.push(i);
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
        let list = this.listRenderer(this.response);

        return html`
            <div>
                <div class="header"><span class="header_text">共${this.response.total}项</span>${pages}</div>
                ${list}
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
    `;

}
