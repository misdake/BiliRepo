import {css, html, LitElement, property, TemplateResult} from "lit-element";
import {Paged} from "../../common/page";
import {VideoDB} from "../../server/storage/dbTypes";
import {VideoListElement} from "./VideoListElement";

export class PagedVideoContainer extends LitElement {

    static register() {
        VideoListElement.register();
        customElements.define('pagedvideo-container', PagedVideoContainer);
    }

    @property()
    request: (pageindex: number) => Promise<Paged<VideoDB>>;
    @property()
    response: Paged<VideoDB>;

    constructor() {
        super();
        this.response = {
            total: 0,
            pageindex: 1,
            pagecount: 0,
            pagesize: 0,
            result: [],
        }
    }

    protected firstUpdated(_changedProperties: Map<PropertyKey, unknown>): void {
        this.loadPage(1);
    }

    private loadPage(pageindex: number) {
        this.request(pageindex).then(result => {
            this.response = result;
        });
    }

    render() {
        let pages: TemplateResult[] = [];
        if (this.response && this.response.pagecount > 1) {
            for (let i = 1; i <= this.response.pagecount; i++) {
                let classes = i === this.response.pageindex ? "page currentpage" : "page otherpage";
                pages.push(html`
                    <div class="${classes}" @click="${() => this.loadPage(i)}">${i}</div>
                `);
            }
        }

        return html`
            <div>
                <div class="header"><span class="header_text">共${this.response.total}项</span>${pages}</div>
                <videolist-element .videos=${this.response.result}></videolist-element>
            </div>
        `;
    }

    static styles = css`
        .header {
            margin: 10px;
            text-align: center;
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