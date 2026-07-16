import { html, render } from 'lit/html.js';
import "../elements/PagedVideoContainer";
import "../elements/PagedMemberContainer";
import "../elements/PagedPlaylistContainer";
import "../elements/PagedTimestampContainer";
import "../elements/ViewTypeElement";
import "../download/PageElement";
import "./MemberDetailPageElement";
import "./PlaylistDetailPageElement";
import { isViewType, ViewType, ViewTypeContent, viewTypes } from "./indexViewType";
import {positiveIntegerParam} from "../common/url";

document.documentElement.classList.add("library-page");
document.body.classList.add("library-page");

let url = new URL(window.location.href);
let loadpage = positiveIntegerParam(url.searchParams, "page") || 1;
let requestedViewType = positiveIntegerParam(url.searchParams, "type") as ViewType;
let viewtype = isViewType(requestedViewType) ? requestedViewType : ViewType.video;
let searchInput = url.searchParams.get("search") || "";
let detailMid = viewtype === ViewType.member ? positiveIntegerParam(url.searchParams, "mid") : undefined;
let detailPid = viewtype === ViewType.playlist ? positiveIntegerParam(url.searchParams, "pid") : undefined;

function replaceUrl(type?: ViewType, pageindex?: number, input?: string) {
    if (type !== undefined && isViewType(type)) viewtype = type;
    if (pageindex !== undefined && Number.isSafeInteger(pageindex) && pageindex >= 1) loadpage = pageindex;
    if (input !== undefined) searchInput = input;
    let url = `${location.pathname}?type=${viewtype}&page=${loadpage}`;
    if (searchInput) url += `&search=${encodeURIComponent(searchInput)}`;
    history.replaceState(null, "", url);
}

let currentViewType: ViewType = undefined;
let currentViewTypeContent: ViewTypeContent<any, any>;

function setViewType(viewType: ViewType) {
    if (!isViewType(viewType)) viewType = ViewType.video;
    if (viewType !== currentViewType) {
        if (currentViewType !== undefined) {
            loadpage = 1;
            searchInput = "";
        }
        currentViewType = viewType;
        currentViewTypeContent = viewType === ViewType.download ? undefined : viewTypes.get(viewType);
        renderPage();
    }
}

const pageTemplate = () => {
    const isDownload = currentViewType === ViewType.download;
    let container;
    if (isDownload) {
        container = html`<download-page-element></download-page-element>`;
    } else if (currentViewType === ViewType.member && detailMid !== undefined) {
        container = html`<member-detail-page-element .mid=${detailMid}></member-detail-page-element>`;
    } else if (currentViewType === ViewType.playlist && detailPid !== undefined) {
        container = html`<playlist-detail-page-element .pid=${detailPid}></playlist-detail-page-element>`;
    } else {
        container = currentViewTypeContent.render(loadpage, searchInput, replaceUrl);
    }
    document.title = isDownload ? "下载" : currentViewTypeContent.title;
    return html`
        <main class="app-shell app-shell--library">
            <nav class="section-nav">
                <viewtype-element .selectedType=${currentViewType} .onClick=${(nextViewType: ViewType) => {
                    const hadDetail = detailMid !== undefined || detailPid !== undefined;
                    detailMid = undefined;
                    detailPid = undefined;
                    replaceUrl(nextViewType, 1, "");
                    if (nextViewType === currentViewType && hadDetail) renderPage();
                    else setViewType(nextViewType);
                }}></viewtype-element>
            </nav>
            <section class="content-surface">${container}</section>
        </main>
    `;
};

function renderPage() {
    render(pageTemplate(), document.body);
}

setViewType(viewtype); //will render page
