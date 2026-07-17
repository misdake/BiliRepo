import { html, render } from 'lit/html.js';
import "../elements/PagedVideoContainer";
import "../elements/PagedMemberContainer";
import "../elements/PagedPlaylistContainer";
import "../elements/PagedTimestampContainer";
import "../elements/ViewTypeElement";
import "../download/PageElement";
import "./MemberDetailPageElement";
import "./PlaylistDetailPageElement";
import { isViewType, ViewType, viewTypes } from "./indexViewType";
import {positiveIntegerParam} from "../common/url";

document.documentElement.classList.add("library-page");
document.body.classList.add("library-page");

// single source of truth for this page: URL -> state -> render -> syncUrl
interface PageState {
    type: ViewType;
    page: number;
    search: string;
    mid?: number;
    pid?: number;
}

function parseState(): PageState {
    let url = new URL(window.location.href);
    let requestedViewType = positiveIntegerParam(url.searchParams, "type") as ViewType;
    let type = isViewType(requestedViewType) ? requestedViewType : ViewType.video;
    return {
        type: type,
        page: positiveIntegerParam(url.searchParams, "page") || 1,
        search: url.searchParams.get("search") || "",
        mid: type === ViewType.member ? positiveIntegerParam(url.searchParams, "mid") : undefined,
        pid: type === ViewType.playlist ? positiveIntegerParam(url.searchParams, "pid") : undefined,
    };
}

const state: PageState = parseState();

function syncUrl() {
    let url = `${location.pathname}?type=${state.type}&page=${state.page}`;
    if (state.search) url += `&search=${encodeURIComponent(state.search)}`;
    if (state.mid !== undefined) url += `&mid=${state.mid}`;
    if (state.pid !== undefined) url += `&pid=${state.pid}`;
    history.replaceState(null, "", url);
}

const pageTemplate = () => {
    const isDownload = state.type === ViewType.download;
    let container;
    if (isDownload) {
        container = html`<download-page-element></download-page-element>`;
    } else if (state.type === ViewType.member && state.mid !== undefined) {
        container = html`<member-detail-page-element .mid=${state.mid}></member-detail-page-element>`;
    } else if (state.type === ViewType.playlist && state.pid !== undefined) {
        container = html`<playlist-detail-page-element .pid=${state.pid}></playlist-detail-page-element>`;
    } else {
        container = viewTypes.get(state.type).render(state.page, state.search,
            (input: string) => { // onSearch
                state.search = (input || "").trim();
                state.page = 1;
                syncUrl();
                renderPage();
            },
            (pageindex: number) => { // afterLoad
                state.page = pageindex;
                syncUrl();
            });
    }
    document.title = isDownload ? "下载" : viewTypes.get(state.type).title;
    return html`
        <main class="app-shell app-shell--library">
            <nav class="section-nav">
                <viewtype-element .selectedType=${state.type} .onClick=${(nextViewType: ViewType) => {
                    state.type = isViewType(nextViewType) ? nextViewType : ViewType.video;
                    state.page = 1;
                    state.search = "";
                    state.mid = undefined;
                    state.pid = undefined;
                    syncUrl();
                    renderPage();
                }}></viewtype-element>
            </nav>
            <section class="content-surface">${container}</section>
        </main>
    `;
};

function renderPage() {
    render(pageTemplate(), document.body);
}

syncUrl();
renderPage();
